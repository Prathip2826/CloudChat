-- =====================================================================
-- Glowchat – Supabase schema
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run (idempotent where possible).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 60),
  email         text,
  avatar_color  int  not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.rooms (
  id                     uuid primary key default gen_random_uuid(),
  name                   text check (name is null or char_length(name) <= 80),
  is_group               boolean not null default false,
  created_by             uuid references public.profiles(id) on delete set null,
  created_at             timestamptz not null default now(),
  last_message_at        timestamptz not null default now(),
  last_message_preview   text,
  last_message_sender_id uuid
);

create table if not exists public.room_members (
  room_id      uuid not null references public.rooms(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('admin', 'member')),
  joined_at    timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index if not exists room_members_user_idx on public.room_members(user_id);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references public.rooms(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  content          text not null default '' check (char_length(content) <= 4000),
  attachment_path  text,
  attachment_name  text,
  attachment_type  text,
  attachment_size  bigint,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now(),
  constraint message_has_body check (
    char_length(content) > 0 or attachment_path is not null or deleted_at is not null
  )
);
create index if not exists messages_room_created_idx on public.messages(room_id, created_at desc);

-- ---------------------------------------------------------------------
-- Helper: membership check (SECURITY DEFINER avoids RLS recursion)
-- ---------------------------------------------------------------------
create or replace function public.is_room_member(rid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.room_members
    where room_id = rid and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------
-- 1) Create a profile whenever a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, avatar_color)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1),
      'User'
    ), 60),
    new.email,
    floor(random() * 8)::int
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Keep the room's "last message" fields up to date
create or replace function public.on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rooms
     set last_message_at        = new.created_at,
         last_message_sender_id = new.sender_id,
         last_message_preview   = left(
           coalesce(
             nullif(new.content, ''),
             case when new.attachment_name is not null then '📎 ' || new.attachment_name else '' end
           ), 120)
   where id = new.room_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.on_message_insert();

-- ---------------------------------------------------------------------
-- RPC functions (all writes to rooms / room_members go through these)
-- ---------------------------------------------------------------------
create or replace function public.start_direct_chat(other uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me  uuid := auth.uid();
  rid uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if other is null or other = me then raise exception 'Choose another person'; end if;
  if not exists (select 1 from public.profiles where id = other) then
    raise exception 'User not found';
  end if;

  select r.id into rid
    from public.rooms r
   where r.is_group = false
     and exists (select 1 from public.room_members where room_id = r.id and user_id = me)
     and exists (select 1 from public.room_members where room_id = r.id and user_id = other)
   limit 1;

  if rid is null then
    insert into public.rooms (is_group, created_by) values (false, me) returning id into rid;
    insert into public.room_members (room_id, user_id) values (rid, me), (rid, other);
  end if;
  return rid;
end;
$$;

create or replace function public.create_group(group_name text, member_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me  uuid := auth.uid();
  rid uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if group_name is null or char_length(trim(group_name)) = 0 then
    raise exception 'Group name is required';
  end if;

  insert into public.rooms (name, is_group, created_by)
  values (left(trim(group_name), 80), true, me)
  returning id into rid;

  insert into public.room_members (room_id, user_id, role) values (rid, me, 'admin');

  insert into public.room_members (room_id, user_id)
  select distinct rid, p.id
    from public.profiles p
   where p.id = any (coalesce(member_ids, '{}')) and p.id <> me
  on conflict do nothing;

  return rid;
end;
$$;

create or replace function public.add_room_members(rid uuid, member_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.room_members rm
      join public.rooms r on r.id = rm.room_id
     where rm.room_id = rid and rm.user_id = auth.uid()
       and rm.role = 'admin' and r.is_group
  ) then
    raise exception 'Only group admins can add members';
  end if;

  insert into public.room_members (room_id, user_id)
  select distinct rid, p.id
    from public.profiles p
   where p.id = any (coalesce(member_ids, '{}'))
  on conflict do nothing;
end;
$$;

create or replace function public.mark_room_read(rid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.room_members
     set last_read_at = now()
   where room_id = rid and user_id = auth.uid();
$$;

create or replace function public.get_unread_counts()
returns table (room_id uuid, unread bigint)
language sql
stable
as $$
  select m.room_id, count(*)::bigint
    from public.messages m
    join public.room_members rm
      on rm.room_id = m.room_id and rm.user_id = auth.uid()
   where m.sender_id <> auth.uid()
     and m.deleted_at is null
     and m.created_at > rm.last_read_at
   group by m.room_id;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;
alter table public.messages     enable row level security;

-- profiles: any signed-in user can find people; you can edit only yourself
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select to authenticated using (true);
create policy "profiles update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- rooms: members can read (writes happen only through RPC functions)
drop policy if exists "rooms read" on public.rooms;
create policy "rooms read" on public.rooms for select to authenticated
  using (public.is_room_member(id));

-- room_members: see members of your rooms; you can remove yourself (leave)
drop policy if exists "members read"  on public.room_members;
drop policy if exists "members leave" on public.room_members;
create policy "members read"  on public.room_members for select to authenticated
  using (public.is_room_member(room_id));
create policy "members leave" on public.room_members for delete to authenticated
  using (user_id = auth.uid());

-- messages
drop policy if exists "messages read"   on public.messages;
drop policy if exists "messages insert" on public.messages;
drop policy if exists "messages update" on public.messages;
create policy "messages read"   on public.messages for select to authenticated
  using (public.is_room_member(room_id));
create policy "messages insert" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_room_member(room_id));
create policy "messages update" on public.messages for update to authenticated
  using (sender_id = auth.uid()) with check (sender_id = auth.uid());

-- Tighten table privileges (defense in depth on top of RLS)
revoke insert, update, delete on public.rooms        from anon, authenticated;
revoke insert, update          on public.room_members from anon, authenticated;
revoke all on public.profiles, public.rooms, public.room_members, public.messages from anon;

revoke update on public.profiles from authenticated;
grant  update (display_name, avatar_color) on public.profiles to authenticated;

revoke update on public.messages from authenticated;
grant  update (content, deleted_at, attachment_path, attachment_name, attachment_type, attachment_size)
  on public.messages to authenticated;

-- Only signed-in users may call the RPCs
revoke execute on function public.start_direct_chat(uuid)         from public, anon;
revoke execute on function public.create_group(text, uuid[])      from public, anon;
revoke execute on function public.add_room_members(uuid, uuid[]) from public, anon;
revoke execute on function public.mark_room_read(uuid)            from public, anon;
revoke execute on function public.get_unread_counts()             from public, anon;
grant  execute on function public.start_direct_chat(uuid)         to authenticated;
grant  execute on function public.create_group(text, uuid[])      to authenticated;
grant  execute on function public.add_room_members(uuid, uuid[]) to authenticated;
grant  execute on function public.mark_room_read(uuid)            to authenticated;
grant  execute on function public.get_unread_counts()             to authenticated;
grant  execute on function public.is_room_member(uuid)            to authenticated;

-- ---------------------------------------------------------------------
-- Storage: private bucket for chat attachments (max 10 MB per file)
-- Object path convention: {room_id}/{uuid}-{filename}
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-files', 'chat-files', false, 10485760)
on conflict (id) do update set file_size_limit = excluded.file_size_limit, public = false;

drop policy if exists "chat files read"   on storage.objects;
drop policy if exists "chat files upload" on storage.objects;
drop policy if exists "chat files delete" on storage.objects;

create policy "chat files read" on storage.objects for select to authenticated
  using (bucket_id = 'chat-files'
         and public.is_room_member(((storage.foldername(name))[1])::uuid));

create policy "chat files upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-files'
              and public.is_room_member(((storage.foldername(name))[1])::uuid));

create policy "chat files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'chat-files'
         and public.is_room_member(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------------
-- Realtime: broadcast row changes for these tables (RLS is enforced)
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.room_members;
exception when duplicate_object then null; end $$;

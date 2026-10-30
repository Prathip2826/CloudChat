# Glowchat – Real-time chat (React + Supabase)

A full chat application with a polished UI: landing page, sign in / sign up, direct messages, group rooms, file & image sharing, read receipts, typing indicators, online presence and desktop notifications.

**Stack:** React 18 · Vite · Tailwind CSS · React Router · Supabase (Postgres, Auth, Realtime, Storage)

## Features
- Landing page, email/password auth and optional Google sign-in
- Direct messages (one conversation per pair, reused) and group rooms with admins
- Real-time messages via Postgres changes; optimistic sending with retry on failure
- Read receipts (✓ sent, ✓✓ seen), unread badges, typing indicator, online/offline presence
- Image and file sharing (10 MB) in a **private** bucket, served through signed URLs
- Delete your own messages, load older messages, emoji picker, paste images
- Desktop notifications + in-app toasts for new messages
- Profile settings (display name, avatar colour)
- Responsive: single-pane layout on phones
- Security enforced by Postgres Row Level Security (members-only access)

## Project structure
```
glowchat/
├─ supabase/schema.sql        # tables, RLS, RPC functions, storage, realtime  (run once)
├─ src/
│  ├─ lib/                    # supabase client, helpers
│  ├─ context/                # AuthContext, ChatContext (rooms, realtime, presence)
│  ├─ pages/                  # Landing, AuthPage, AppShell, ChatRoom, EmptyChat
│  ├─ components/             # Sidebar, MessageBubble, Composer, InfoPanel, modals…
│  └─ hooks/useSignedUrl.js
├─ vercel.json, public/_redirects   # SPA rewrites for Vercel / Netlify
└─ .env.example
```

## Setup (about 5 minutes)

1. **Create a Supabase project** at https://supabase.com.
2. **Create the database:** Dashboard → *SQL Editor* → *New query* → paste the whole of `supabase/schema.sql` → *Run*.
3. **Auth settings** (Dashboard → Authentication):
   - *Providers → Email* is on by default. For quick testing turn **off** "Confirm email" (Authentication → Sign In / Providers → Email), otherwise new users must click an email link first.
   - *URL Configuration*: set **Site URL** to `http://localhost:5173` (and add your deployed URL later under Redirect URLs).
   - Optional Google: enable the Google provider and add your OAuth client ID/secret.
4. **Add your keys:** copy `.env.example` to `.env.local` and fill in *Project URL* and *anon public key* (Project Settings → API).
5. **Run:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173, create two accounts (use a private window for the second), start a chat and try it.

## Deploy
- **Vercel / Netlify:** push to GitHub, import the repo, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables, deploy. (`vercel.json` and `public/_redirects` already handle client-side routing.)
- Afterwards add the deployed URL to Supabase → Authentication → URL Configuration.

## Database model
```
profiles       id (= auth user), display_name, email, avatar_color
rooms          id, name, is_group, created_by, last_message_* (kept by trigger)
room_members   room_id, user_id, role (admin|member), last_read_at
messages       id, room_id, sender_id, content, attachment_*, deleted_at, created_at
storage        bucket "chat-files" (private), path: {room_id}/{uuid}-{filename}
```
Rooms and memberships are created only through RPC functions (`start_direct_chat`, `create_group`, `add_room_members`, `mark_room_read`), so clients can never insert themselves into someone else's room.

## Security notes
- RLS is enabled on every table; messages and files are readable only by room members.
- Any signed-in user can search profiles (name + email) to start chats. If you need stricter privacy, remove `email` from the search in `UserPicker.jsx` and from `profiles`.
- The anon key is safe to expose in the browser; the RLS policies are what protect your data.

## Troubleshooting
- **Setup screen appears:** `.env.local` is missing or the dev server was not restarted after creating it.
- **"Invalid login credentials" right after sign-up:** email confirmation is on – confirm via email or disable it (step 3).
- **Messages don't arrive live:** make sure `schema.sql` ran completely (it adds `messages` and `room_members` to the `supabase_realtime` publication). Check Dashboard → Database → Replication.
- **Can't find a user to chat with:** they must have signed up first.
- **Push alerts:** desktop notifications use the browser Notification API and work while the app tab is open (background tab). True closed-browser push would need a service worker + web-push server, which is not included.

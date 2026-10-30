import Avatar from './Avatar';
import { DoubleCheckIcon, PaperclipIcon, SendIcon, SearchIcon } from './Icons';
import { LogoMark } from './Logo';

const rooms = [
  { name: 'Design Team', preview: 'Priya: Uploaded the new mockups 🎨', time: '10:42', unread: 3, color: 4, active: true },
  { name: 'Karthik R', preview: 'Sounds good, see you then!', time: '10:15', color: 2, online: true },
  { name: 'Project Alpha', preview: 'You: Deploy is green ✅', time: 'Yesterday', color: 0 },
  { name: 'Meera S', preview: 'Can you share the doc?', time: 'Mon', color: 1, online: false }
];

export default function ChatPreview({ className = '' }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white text-left shadow-2xl shadow-blue-900/20 ring-1 ring-slate-900/10 ${className}`}
    >
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <div className="mx-auto w-full max-w-xs rounded-md bg-white px-4 py-1 text-center text-xs text-slate-400 ring-1 ring-slate-200">
          glowchat.app
        </div>
      </div>

      <div className="flex h-[25rem] sm:h-[28rem]">
        {/* sidebar */}
        <div className="hidden w-64 shrink-0 flex-col border-r border-slate-100 sm:flex">
          <div className="flex items-center gap-2 p-4">
            <LogoMark className="h-7 w-7" />
            <span className="font-display font-medium">Chats</span>
          </div>
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-400">
            <SearchIcon className="h-3.5 w-3.5" /> Search
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden px-2">
            {rooms.map((r) => (
              <div
                key={r.name}
                className={`flex items-center gap-3 rounded-xl px-2 py-2 ${r.active ? 'bg-blue-50' : ''}`}
              >
                <Avatar name={r.name} color={r.color} size="sm" online={r.online} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-slate-900">{r.name}</span>
                    <span className="text-[10px] text-slate-400">{r.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-slate-500">{r.preview}</span>
                    {r.unread && (
                      <span className="rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold text-white">
                        {r.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* conversation */}
        <div className="chat-bg flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
            <Avatar name="Design Team" color={4} size="sm" />
            <div>
              <div className="text-sm font-semibold">Design Team</div>
              <div className="text-xs text-emerald-600">4 members · 3 online</div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-hidden p-4 text-sm">
            <div className="flex items-end gap-2">
              <Avatar name="Priya N" color={1} size="xs" />
              <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 shadow-sm ring-1 ring-slate-100">
                <div className="text-[11px] font-semibold text-pink-600">Priya N</div>
                Morning team! The new onboarding flow is ready for review 🚀
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="w-7" />
              <div className="max-w-[78%] rounded-2xl bg-white px-3.5 py-2 shadow-sm ring-1 ring-slate-100">
                <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <PaperclipIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold">onboarding-v2.fig</div>
                    <div className="text-[11px] text-slate-400">2.4 MB</div>
                  </div>
                </div>
                Looks clean — nice work!
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[78%] rounded-2xl rounded-br-md bg-blue-600 px-3.5 py-2 text-white shadow-sm">
                Love it. Shipping to staging now ✨
                <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-blue-100">
                  10:42 <DoubleCheckIcon className="h-3.5 w-3.5 text-sky-200" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
              </span>
              Karthik is typing…
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 bg-white p-3">
            <PaperclipIcon className="h-5 w-5 text-slate-400" />
            <div className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-400">Type a message</div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
              <SendIcon className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

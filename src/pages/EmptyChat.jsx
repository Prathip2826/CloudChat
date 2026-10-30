import { LogoMark } from '../components/Logo';
import { PlusIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

export default function EmptyChat() {
  const { profile } = useAuth();
  const { setNewChatOpen } = useChat();
  return (
    <div className="chat-bg flex flex-1 items-center justify-center p-8 text-center">
      <div className="max-w-sm">
        <LogoMark className="mx-auto h-16 w-16 shadow-xl shadow-blue-600/30" />
        <h2 className="mt-6 font-display text-2xl text-slate-900">Hi {profile.display_name.split(' ')[0]} 👋</h2>
        <p className="mt-2 text-slate-600">
          Pick a conversation from the left, or start a new one to begin chatting in real time.
        </p>
        <button onClick={() => setNewChatOpen(true)} className="btn btn-primary mt-6 px-5 py-2.5">
          <PlusIcon className="h-4 w-4" /> New conversation
        </button>
      </div>
    </div>
  );
}

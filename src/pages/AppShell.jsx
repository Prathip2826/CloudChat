import { Outlet, useMatch } from 'react-router-dom';
import { ChatProvider, useChat } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import Toasts from '../components/Toasts';
import NewChatModal from '../components/NewChatModal';
import SettingsModal from '../components/SettingsModal';
import { cn } from '../lib/utils';

function Layout({ activeRoomId }) {
  const { newChatOpen, settingsOpen } = useChat();
  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      <Sidebar
        activeRoomId={activeRoomId}
        className={cn('w-full md:w-[22rem] md:flex lg:w-96', activeRoomId ? 'hidden' : 'flex')}
      />
      <main className={cn('min-w-0 flex-1 md:flex', activeRoomId ? 'flex' : 'hidden')}>
        <Outlet />
      </main>
      <Toasts />
      {newChatOpen && <NewChatModal />}
      {settingsOpen && <SettingsModal />}
    </div>
  );
}

export default function AppShell() {
  const match = useMatch('/app/:roomId');
  const activeRoomId = match?.params.roomId ?? null;
  return (
    <ChatProvider activeRoomId={activeRoomId}>
      <Layout activeRoomId={activeRoomId} />
    </ChatProvider>
  );
}

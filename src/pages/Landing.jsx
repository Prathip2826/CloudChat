import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import ChatPreview from '../components/ChatPreview';
import {
  ArrowRightIcon,
  BellIcon,
  BoltIcon,
  ChatIcon,
  CheckIcon,
  FileIcon,
  LockIcon,
  PlayIcon,
  ShieldIcon,
  UsersIcon
} from '../components/Icons';
import { useAuth } from '../context/AuthContext';

function Container({ className = '', children }) {
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

/** Hand-drawn style underline */
function Swoosh() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 420 36"
      preserveAspectRatio="none"
      className="absolute left-0 top-full h-[0.5em] w-full fill-none stroke-blue-300/80"
      strokeWidth="5"
      strokeLinecap="round"
    >
      <path d="M4 22C70 8 170 4 270 10c60 4 110 10 146 4" />
      <path d="M30 30c80-12 190-14 290-8" />
    </svg>
  );
}

function Header() {
  const { user } = useAuth();
  return (
    <header className="py-8">
      <Container className="flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              ['Features', '#features'],
              ['How it works', '#how'],
              ['Security', '#security']
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/app" className="btn btn-primary">
              Open app
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 sm:block"
              >
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get started <span className="hidden lg:inline">today</span>
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}

function Hero() {
  const { user } = useAuth();
  return (
    <section className="pb-16 pt-12 text-center lg:pt-20">
      <Container>
        <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
          Real-time chat that{' '}
          <span className="relative whitespace-nowrap text-blue-600">
            <Swoosh />
            <span className="relative">just works</span>
          </span>{' '}
          for everyone.
        </h1>
        <p className="mx-auto mt-10 max-w-2xl text-lg tracking-tight text-slate-700">
          Message friends and teams instantly. Direct chats, group rooms, file sharing, read receipts and live typing
          indicators — all in one clean, fast app.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to={user ? '/app' : '/register'} className="btn btn-dark px-5 py-2.5">
            Start chatting free
          </Link>
          <a href="#how" className="btn btn-outline px-5 py-2.5">
            <PlayIcon className="h-3.5 w-3.5 text-blue-600" />
            See how it works
          </a>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="pointer-events-none absolute -inset-x-6 -top-8 bottom-0 -z-10 rounded-[2.5rem] bg-gradient-to-b from-blue-100 via-blue-50 to-transparent" />
          <ChatPreview />
        </div>
      </Container>
    </section>
  );
}

const featureCols = [
  {
    icon: BoltIcon,
    tint: 'bg-blue-600 text-white',
    label: 'Realtime',
    labelColor: 'text-blue-600',
    title: 'Messages land the instant they are sent.',
    text: 'Powered by Postgres realtime channels, so every device stays perfectly in sync with no refreshing.'
  },
  {
    icon: UsersIcon,
    tint: 'bg-slate-500 text-white',
    label: 'Rooms',
    labelColor: 'text-slate-500',
    title: 'One-to-one chats and group rooms in one place.',
    text: 'Start a direct chat in two clicks, or spin up a group, invite people and manage members as an admin.'
  },
  {
    icon: LockIcon,
    tint: 'bg-slate-500 text-white',
    label: 'Private',
    labelColor: 'text-slate-500',
    title: 'Only the people in a room can read it.',
    text: 'Row-level security protects every message and every file, enforced by the database itself.'
  }
];

function Features() {
  return (
    <section id="features" className="scroll-mt-8 pb-24 pt-10 sm:pb-32">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl">
            Everything you need, nothing you don’t.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            A focused chat experience built for speed, clarity and privacy.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-10 lg:max-w-none lg:grid-cols-3">
          {featureCols.map((f) => (
            <div key={f.label}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${f.tint}`}>
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className={`mt-6 text-sm font-medium ${f.labelColor}`}>{f.label}</h3>
              <p className="mt-2 font-display text-xl text-slate-900">{f.title}</p>
              <p className="mt-4 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

const steps = [
  {
    icon: ChatIcon,
    title: 'Direct messages',
    text: 'Search anyone who has signed up and start talking. Your conversation is created once and reused.'
  },
  {
    icon: UsersIcon,
    title: 'Group rooms',
    text: 'Create a room, add teammates, and see who is online. Admins can add more people later.'
  },
  {
    icon: FileIcon,
    title: 'File & image sharing',
    text: 'Drop in images, PDFs and docs up to 10 MB. Files are stored privately and shown only to members.'
  },
  {
    icon: BellIcon,
    title: 'Typing, receipts & alerts',
    text: 'See when someone is typing, when your message was seen, and get desktop alerts for new messages.'
  }
];

function HowItWorks() {
  return (
    <section
      id="how"
      className="relative scroll-mt-8 overflow-hidden bg-blue-600 py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute -right-24 top-0 h-[30rem] w-[30rem] rounded-full bg-sky-400/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-indigo-500/50 blur-3xl" />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-5xl">
            Everything you need to stay in sync.
          </h2>
          <p className="mt-6 text-lg tracking-tight text-blue-100">
            From a quick hello to a busy project room, Glowchat keeps every conversation organised.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className={`rounded-2xl p-6 ${i === 0 ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'} transition`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg text-white">{s.title}</h3>
                </div>
                <p className="mt-3 text-sm text-blue-100">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-7">
            <ChatPreview className="lg:-mr-24" />
          </div>
        </div>
      </Container>
    </section>
  );
}

const securityCards = [
  {
    icon: ShieldIcon,
    title: 'Row-level security',
    text: 'Every table is locked down. You only ever see rooms you belong to.',
    items: ['Members-only messages', 'Admin-only invites', 'No public access']
  },
  {
    icon: LockIcon,
    title: 'Private file storage',
    text: 'Attachments live in a private bucket and are served with short-lived signed links.',
    items: ['10 MB per file', 'Signed URLs', 'Room-scoped access'],
    featured: true
  },
  {
    icon: BoltIcon,
    title: 'Built to scale',
    text: 'Postgres, realtime channels and presence handle growing teams without extra servers.',
    items: ['Realtime sync', 'Online presence', 'Indexed queries']
  }
];

function Security() {
  return (
    <section id="security" className="scroll-mt-8 bg-slate-900 py-20 sm:py-32">
      <Container>
        <div className="text-center">
          <h2 className="relative mx-auto inline-block font-display text-3xl tracking-tight text-white sm:text-5xl">
            <svg
              aria-hidden="true"
              viewBox="0 0 420 36"
              preserveAspectRatio="none"
              className="absolute left-0 top-full h-[0.4em] w-full fill-none stroke-blue-400"
              strokeWidth="4"
              strokeLinecap="round"
            >
              <path d="M4 22C70 8 170 4 270 10c60 4 110 10 146 4" />
            </svg>
            <span className="relative">Private by design,</span>
          </h2>{' '}
          <span className="font-display text-3xl tracking-tight text-white sm:text-5xl">simple for everyone.</span>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
            Your conversations belong to you. Security is built into the database, not bolted on.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-y-10 sm:mt-20 lg:max-w-none lg:grid-cols-3 lg:items-center lg:gap-x-8">
          {securityCards.map((c) => (
            <section
              key={c.title}
              className={`flex flex-col rounded-3xl px-6 sm:px-8 ${
                c.featured ? 'order-first bg-blue-600 py-8 lg:order-none' : 'lg:py-8'
              }`}
            >
              <c.icon className={`h-8 w-8 ${c.featured ? 'text-white' : 'text-blue-400'}`} />
              <h3 className="mt-5 font-display text-2xl text-white">{c.title}</h3>
              <p className={`mt-4 text-sm ${c.featured ? 'text-blue-100' : 'text-slate-400'}`}>{c.text}</p>
              <ul className={`mt-8 space-y-3 text-sm ${c.featured ? 'text-white' : 'text-slate-300'}`}>
                {c.items.map((it) => (
                  <li key={it} className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ring-1 ${
                        c.featured ? 'ring-white/60' : 'ring-slate-600'
                      }`}
                    >
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {it}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CallToAction() {
  const { user } = useAuth();
  return (
    <section className="relative overflow-hidden bg-blue-600 py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/40 blur-3xl" />
      <Container className="relative">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">Get started today</h2>
          <p className="mt-4 text-lg tracking-tight text-blue-100">
            It takes less than a minute to create an account and say hello.
          </p>
          <Link to={user ? '/app' : '/register'} className="btn btn-white mt-10 px-6 py-3">
            {user ? 'Open Glowchat' : 'Create your account'} <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 py-12 md:flex-row">
          <Logo />
          <nav className="flex gap-8 text-sm text-slate-700">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#security" className="hover:text-slate-900">Security</a>
          </nav>
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Glowchat. Built with React &amp; Supabase.</p>
        </div>
      </Container>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-full bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Security />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}

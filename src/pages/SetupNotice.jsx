import Logo from '../components/Logo';

export default function SetupNotice() {
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <Logo />
        <h1 className="mt-8 font-display text-2xl text-slate-900">Connect your Supabase project</h1>
        <p className="mt-3 text-sm text-slate-600">
          The app can’t find your Supabase keys yet. Do these steps, then restart <code>npm run dev</code>:
        </p>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-slate-700">
          <li>
            Create a project at <span className="font-medium">supabase.com</span>.
          </li>
          <li>
            Open <span className="font-medium">SQL Editor</span> and run the whole file{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">supabase/schema.sql</code>.
          </li>
          <li>
            Copy <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code> to{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.local</code> and paste your Project URL and anon key
            (Project Settings → API).
          </li>
        </ol>
      </div>
    </div>
  );
}

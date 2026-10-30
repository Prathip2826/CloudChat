import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

// Placeholders keep the app from crashing on import when env vars are missing;
// <App /> shows a setup screen in that case.
export const supabase = createClient(url || 'http://localhost:54321', key || 'public-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 10 } }
});

export const FILES_BUCKET = 'chat-files';
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && anonKey);

export const NOT_CONFIGURED_MESSAGE = isConfigured
  ? ''
  : 'Backend G-Perspective-Spin belum disambungkan. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di berkas .env, lalu jalankan ulang dev server.';

export const supabase: SupabaseClient = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'g-perspective-spin-unconfigured',
  { auth: { persistSession: true, autoRefreshToken: true } },
);

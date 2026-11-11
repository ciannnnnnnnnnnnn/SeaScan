import { createClient } from '@supabase/supabase-js';
import { cookieStorage, clearLegacyLocalSessions } from './lib/cookieStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

clearLegacyLocalSessions();

// The session (JWT access token + refresh token) lives in cookies; see
// lib/cookieStorage.js. Supabase refreshes the short-lived JWT automatically.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

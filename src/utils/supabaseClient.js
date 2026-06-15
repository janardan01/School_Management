import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl.trim() && supabaseAnonKey.trim());

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase environment variables are missing (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).\n" +
    "The application will automatically fall back to LocalStorage mode."
  );
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Get the ID from localStorage
const userId = localStorage.getItem("user_id") || "guest";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-user-id': userId // This is what the RLS policy looks for!
    }
  }
});
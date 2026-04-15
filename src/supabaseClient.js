import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Build-safe check: only access localStorage if 'window' is defined
const getUserId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("user_id") || "guest";
  }
  return "guest";
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      // Use a dynamic getter if possible, or just the safe check
      'x-user-id': getUserId() 
    }
  }
});
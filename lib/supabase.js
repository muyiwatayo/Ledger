import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ihzjmfwmkbqtjmdslvva.supabase.co";
const supabaseAnonKey =
  "sb_publishable_v6Fab2ajUAJEa5fdAZtXVg_xEnig0LQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

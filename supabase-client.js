const ledgerSupabase = window.supabase.createClient(
    window.LEDGER_SUPABASE_URL,
    window.LEDGER_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

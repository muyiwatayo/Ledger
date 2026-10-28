import type { SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    "ledger-install-available": Event;
  }

  interface Navigator {
    standalone?: boolean;
  }

  interface Window {
    initializeLedgerDashboard: () => void;
    ledgerDashboardStarted?: boolean;
    ledgerInstallPrompt: BeforeInstallPromptEvent | null;
    ledgerSupabase: SupabaseClient;
  }
}

export {};

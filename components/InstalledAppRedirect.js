"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function InstalledAppRedirect() {
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (!standalone) return;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Could not check the installed Ledger session.", error);
        return;
      }
      if (data.session) window.location.replace("/dashboard");
    });
  }, []);

  return null;
}

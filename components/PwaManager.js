"use client";

import { useEffect, useState } from "react";

export function PwaManager() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch((error) => {
        console.error("Could not register the Ledger service worker.", error);
      });
    }

    function captureInstallPrompt(event) {
      event.preventDefault();
      window.ledgerInstallPrompt = event;
      window.dispatchEvent(new Event("ledger-install-available"));
    }
    function clearInstallPrompt() {
      window.ledgerInstallPrompt = null;
      window.dispatchEvent(new Event("ledger-install-available"));
    }

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", clearInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", clearInstallPrompt);
    };
  }, []);

  return null;
}

export function InstallButton({
  className = "small-button install-button",
  children = "Install app",
  ariaLabel,
}) {
  const [available, setAvailable] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function updateAvailability() {
      setAvailable(Boolean(window.ledgerInstallPrompt));
    }
    updateAvailability();
    window.addEventListener("ledger-install-available", updateAvailability);
    return () => window.removeEventListener("ledger-install-available", updateAvailability);
  }, []);

  async function install() {
    const prompt = window.ledgerInstallPrompt;
    if (!prompt) {
      setMessage("Open your browser menu and choose Install Ledger or Add to Home Screen.");
      setHelpOpen((open) => !open);
      return;
    }
    try {
      await prompt.prompt();
      await prompt.userChoice;
      window.ledgerInstallPrompt = null;
      window.dispatchEvent(new Event("ledger-install-available"));
      setHelpOpen(false);
    } catch (error) {
      console.error("Could not install Ledger.", error);
      setMessage("Installation could not start. Try your browser menu instead.");
      setHelpOpen(true);
    }
  }

  return (
    <div className="install-action">
      <button
        className={className}
        type="button"
        onClick={install}
        aria-label={ariaLabel}
        aria-expanded={helpOpen}
      >
        {children}
      </button>
      {helpOpen && (
        <p className="install-help" role="status">
          {message || (available
            ? "Choose your device’s install prompt to add Ledger."
            : "Open your browser menu and choose Install Ledger or Add to Home Screen.")}
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { JSX } from "react";

export default function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    let storedTheme = "light";
    try {
      storedTheme = localStorage.getItem("ledger.theme") === "dark" ? "dark" : "light";
    } catch {
      storedTheme = "light";
    }
    setTheme(storedTheme);
    document.documentElement.dataset.theme = storedTheme;
    document.documentElement.style.colorScheme = storedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      storedTheme === "dark" ? "#111a14" : "#f2f7f2",
    );
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      nextTheme === "dark" ? "#111a14" : "#f2f7f2",
    );
    try {
      localStorage.setItem("ledger.theme", nextTheme);
    } catch {
      // Theme selection remains active for the current page.
    }
  }

  return (
    <button
      className="small-button theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

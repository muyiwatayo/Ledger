import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaManager } from "../components/PwaManager";

export const metadata: Metadata = {
  title: {
    default: "Ledger | A clearer view of your spending",
    template: "%s | Ledger",
  },
  description:
    "Track everyday spending, set monthly and category budgets, and keep recurring bills in view with Ledger.",
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Ledger | A clearer view of your spending",
    description:
      "Track everyday spending, set budgets, and understand your money with Ledger.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f7f2",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PwaManager />
        {children}
      </body>
    </html>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "./SiteFooter";

type LegalPageProps = { title: string; children: ReactNode };

export default function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="landing-body legal-body">
      <main className="legal-content">
        <Link className="back-home" href="/">← Back to Ledger home</Link>
        <p className="eyebrow">Ledger</p>
        <h1>{title}</h1>
        <p className="legal-updated">Effective October 27, 2026</p>
        <div className="legal-copy">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

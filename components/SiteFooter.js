import Link from "next/link";
import {
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconBrandX,
} from "@tabler/icons-react";
import ThemeToggle from "./ThemeToggle";

export default function SiteFooter() {
  return (
    <footer className="landing-footer site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <Link className="brand footer-brand" href="/" aria-label="Ledger home">
              <span className="brand-mark">L</span>
              <span><strong>ledger</strong><small>personal finance</small></span>
            </Link>
            <p>Personal finance, on your terms.</p>
          </div>
          <div className="site-footer-groups">
            <section className="footer-group" aria-labelledby="footer-contact-title">
              <h2 id="footer-contact-title">Contact</h2>
              <a
                className="footer-contact-link"
                href="https://wa.me/2349081416637"
                target="_blank"
                rel="noreferrer"
              >
                <IconBrandWhatsapp size={18} stroke={1.7} aria-hidden="true" />
                <span>09081416637</span>
              </a>
            </section>
            <section className="footer-group" aria-labelledby="footer-social-title">
              <h2 id="footer-social-title">Social</h2>
              <div className="footer-socials" aria-label="Social links">
                <a
                  href="https://www.instagram.com/mart.ins4823/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <IconBrandInstagram size={19} stroke={1.7} aria-hidden="true" />
                </a>
                <a
                  href="https://x.com/MartinsOdeshina"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X @MartinsOdeshina"
                >
                  <IconBrandX size={19} stroke={1.7} aria-hidden="true" />
                </a>
                <a
                  href="https://wa.me/2349081416637"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp 09081416637"
                >
                  <IconBrandWhatsapp size={19} stroke={1.7} aria-hidden="true" />
                </a>
              </div>
            </section>
            <section className="footer-group" aria-labelledby="footer-legal-title">
              <h2 id="footer-legal-title">Legal</h2>
              <div className="footer-legal">
                <Link href="/terms">Terms of Service</Link>
                <Link href="/privacy">Privacy</Link>
              </div>
            </section>
          </div>
        </div>
        <div className="site-footer-bottom">
          <p className="footer-copyright">
            © 2026 Ledger. All rights reserved. Created by <strong>Martins Odeshina</strong>.
          </p>
          <div className="landing-footer-controls">
            <span>Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

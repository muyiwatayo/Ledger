import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import { InstallButton } from "../components/PwaManager";
import InstalledAppRedirect from "../components/InstalledAppRedirect";
import SiteFooter from "../components/SiteFooter";

export default function HomePage() {
  return (
    <div className="landing-body">
      <InstalledAppRedirect />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="landing-nav">
        <Link className="brand" href="/" aria-label="Ledger home">
          <span className="brand-mark">L</span>
          <span><strong>ledger</strong><small>personal finance</small></span>
        </Link>
        <nav className="landing-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#principles">Why Ledger</a>
          <Link href="/login">Sign in</Link>
        </nav>
        <div className="landing-actions">
          <InstallButton />
          <Link className="small-button landing-nav-cta" href="/signup">Get started <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <main id="main-content">
        <section className="landing-hero">
          <div className="hero-copy">
            <p className="eyebrow">Money, made easier to follow</p>
            <h1>See your money clearly.</h1>
            <p className="hero-summary">Keep spending, budgets, and regular bills together. Make your next money decision with more context.</p>
            <div className="hero-actions">
              <Link className="primary-button landing-cta" href="/signup">Get started <span aria-hidden="true">↗</span></Link>
              <a className="quiet-link" href="#how-it-works">Explore Ledger</a>
            </div>
            <p className="hero-note">Start with what you spend. No bank connection required.</p>
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&amp;fit=crop&amp;w=1500&amp;q=85" alt="Calculator and notebook ready for a monthly budget review" width="1500" height="1100" fetchPriority="high" />
              <span className="hero-photo-caption">A little more clarity, every day.</span>
            </div>
            <div className="hero-photo-detail">
              <img src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&amp;fit=crop&amp;w=700&amp;q=80" alt="Shop owner serving a customer at the checkout" width="700" height="467" loading="lazy" />
            </div>
          </div>
        </section>

        <section className="number-strip" aria-label="Ledger features">
          <div><strong>One view</strong><span>Everyday expenses in one place</span></div>
          <div><strong>Your budget</strong><span>Monthly and category limits</span></div>
          <div><strong>On your terms</strong><span>No bank connection required</span></div>
        </section>

        <section className="feature-section" id="features">
          <div className="feature-heading">
            <h2>All the pieces of your month, in one place.</h2>
            <p>Keep the small daily decisions connected to the bigger picture.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-tile feature-tile-spending">
              <span className="feature-kicker">Everyday spending</span>
              <h3>Capture it while it is fresh.</h3>
              <p>Save an amount, category, and date. Find entries later with search and category filters.</p>
            </article>
            <article className="feature-tile feature-tile-budget">
              <span className="feature-kicker">Monthly budgets</span>
              <h3>Set limits that fit your life.</h3>
              <p>Use one monthly budget or give categories their own spending limits.</p>
            </article>
            <article className="feature-tile feature-tile-recurring">
              <span className="feature-kicker">Regular bills</span>
              <h3>Get a reminder, then decide.</h3>
              <p>Schedule weekly or monthly expenses. Ledger waits for you to confirm before adding them.</p>
            </article>
            <article className="feature-tile feature-tile-history">
              <span className="feature-kicker">Your history</span>
              <h3>Look back with context.</h3>
              <p>Review category totals, compare your recent months, and export your transactions as a CSV.</p>
            </article>
          </div>
        </section>

        <section className="story-section" id="how-it-works">
          <div className="section-intro">
            <p className="eyebrow">A clearer picture</p>
            <h2>Know where the month is going.</h2>
            <p>One simple place to record spending, follow your budget, and plan for the bills that come around again.</p>
            <Link className="quiet-link story-link" href="/signup">Make a start <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="principle-list">
            <article><span className="principle-icon" aria-hidden="true">＋</span><div><h3>Record it as it happens</h3><p>Add an amount, category, and date. Your spending history stays easy to search.</p></div></article>
            <article><span className="principle-icon" aria-hidden="true">◷</span><div><h3>Keep an eye on your limits</h3><p>Set a monthly budget or create a separate limit for each category.</p></div></article>
            <article><span className="principle-icon" aria-hidden="true">↻</span><div><h3>Plan for regular expenses</h3><p>Keep bill reminders in view and record them when they are due.</p></div></article>
          </div>
        </section>

        <section className="image-band" id="principles">
          <div className="image-band-photo"><img src="https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&amp;fit=crop&amp;w=1400&amp;q=85" alt="Person reviewing handwritten financial notes at a desk" width="1400" height="1050" loading="lazy" /></div>
          <div className="image-band-copy">
            <p className="eyebrow">Built around real life</p>
            <h2>Useful tools, without the noise.</h2>
            <p>See your spending by category, compare months, and keep regular bills on your radar.</p>
            <Link className="quiet-link" href="/signup">See your spending clearly <span aria-hidden="true">↗</span></Link>
          </div>
        </section>

        <section className="faq-section" id="faq">
          <div className="faq-heading">
            <h2>A few things worth knowing.</h2>
            <p>Simple answers before you start adding expenses.</p>
          </div>
          <div className="faq-list">
            <details>
              <summary>Do I need to connect my bank?</summary>
              <p>No. Add expenses yourself and keep control of what goes into your Ledger account.</p>
            </details>
            <details>
              <summary>Will recurring expenses be added automatically?</summary>
              <p>No. Ledger shows a reminder when a bill is due, and you confirm before it becomes an expense.</p>
            </details>
            <details>
              <summary>Can I take my transaction history with me?</summary>
              <p>Yes. Export your transactions from the dashboard as a CSV file.</p>
            </details>
          </div>
        </section>

        <section className="final-cta">
          <div className="final-cta-copy">
            <h2>Make room for a clearer month.</h2>
            <p>Build a money habit that works at your pace.</p>
            <Link className="primary-button landing-cta" href="/signup">Get started <span aria-hidden="true">↗</span></Link>
          </div>
          <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&amp;fit=crop&amp;w=1000&amp;q=80" alt="Open notebook and calculator ready for planning expenses" width="1000" height="750" loading="lazy" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

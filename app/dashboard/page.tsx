"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { JSX } from "react";
import "../../script.js";
import { supabase } from "../../lib/supabase";
import { InstallButton } from "../../components/PwaManager";

export default function DashboardPage(): JSX.Element {
  useEffect(() => {
    document.body.className = "app-body";
    document.title = "Dashboard | Ledger";
    window.ledgerSupabase = supabase;
    if (!window.ledgerDashboardStarted) {
      window.ledgerDashboardStarted = true;
      window.initializeLedgerDashboard();
    }
    return () => {
      document.body.className = "";
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="app-shell">
        <aside className="sidebar" aria-label="Primary navigation">
          <div className="sidebar-top">
            <Link className="brand" href="/" aria-label="Ledger home"><span className="brand-mark">L</span><span><strong>ledger</strong><small>personal finance</small></span></Link>
            <span className="sidebar-credit">Created by <strong>Martins Odeshina</strong></span>
            <button className="nav-link nav-button" id="logout-btn" type="button"><svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></svg>Log out</button>
          </div>
          <nav className="side-nav">
            <a className="nav-link is-active" href="#overview"><svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 11 8-7 8 7v9H4z" /><path d="M9 20v-5h6v5" /></svg>Overview</a>
            <a className="nav-link" href="#transactions"><svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14M4 8l3-3 3 3M17 19V5m-3 3 3-3 3 3" /></svg>Transactions</a>
            <a className="nav-link" href="#category-budgets"><svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></svg>Budgets</a>
            <a className="nav-link" href="#insights"><svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7" /></svg>Insights</a>
            <a className="nav-link" href="#recurring">Recurring</a>
          </nav>
          <div className="sidebar-bottom"><div className="sidebar-note"><span className="status-dot" /><span><strong>Synced to your account</strong><small>Available when you sign in</small></span></div></div>
        </aside>

        <main className="main-content" id="main-content">
          <header className="topbar">
            <div><p className="eyebrow">Personal dashboard</p><h1>Good morning, <span id="user-display-name">there</span>.</h1><p className="muted">Here is your spending picture for <span id="current-month">this month</span>.</p></div>
            <div className="topbar-actions"><Link className="home-link" href="/">Home</Link><InstallButton className="icon-button install-button" ariaLabel="Install Ledger">＋</InstallButton><button className="icon-button" id="export-btn" type="button" title="Export transactions" aria-label="Export transactions">↓</button><button className="logout-top" id="logout-top" type="button">Log out</button><div className="profile-chip"><span className="profile-avatar" id="profile-initial">L</span><span id="profile-name">Account</span></div></div>
          </header>

          <section className="kpi-grid" id="overview" aria-label="Spending overview">
            <article className="kpi-card kpi-primary"><div className="kpi-heading"><span>Total spent</span><svg className="kpi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17 10 11l4 4 6-8" /><path d="M15 7h5v5" /></svg></div><strong id="total-spent">₦0</strong><p id="spend-change">No expenses yet</p></article>
            <article className="kpi-card"><div className="kpi-heading"><span>Monthly budget</span><svg className="kpi-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /></svg></div><strong id="budget-total">₦250,000</strong><div className="budget-meter" id="budget-meter" aria-label="Budget usage" role="progressbar" aria-valuemin={0} aria-valuemax={100}><span id="budget-meter-fill" /></div><div className="budget-meter-caption"><span id="budget-used">0%</span><span>used</span></div><p><button className="text-button" id="edit-budget-btn" type="button" aria-expanded="false" aria-controls="budget-edit-form">Edit budget</button></p><form className="budget-edit-form" id="budget-edit-form" hidden noValidate><div><label htmlFor="monthly-budget-input">New monthly limit</label><div className="input-with-symbol"><span>₦</span><input id="monthly-budget-input" type="number" min="0.01" step="0.01" required /></div></div><p className="form-message" id="budget-edit-message" role="alert" /><div className="budget-edit-actions"><button className="primary-button" type="submit">Save</button><button className="secondary-button" id="cancel-budget-edit-btn" type="button">Cancel</button></div></form></article>
            <article className="kpi-card"><div className="kpi-heading"><span>Remaining</span><svg className="kpi-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg></div><strong id="remaining-budget">₦250,000</strong><p id="budget-status">You're on track</p></article>
            <article className="kpi-card"><div className="kpi-heading"><span>Transactions</span><svg className="kpi-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v18H7zM10 7h4M10 11h4M10 15h2" /></svg></div><strong id="transaction-count">0</strong><p id="latest-date">Start your first entry</p></article>
          </section>

          <section className="content-grid">
            <article className="panel add-panel" id="expense-entry">
              <div className="panel-header"><div><p className="eyebrow">Quick add</p><h2 id="expense-form-title">Record an expense</h2></div><span className="panel-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></span></div>
              <form id="expense-form" noValidate>
                <label htmlFor="description">What did you spend on?</label><input type="text" id="description" placeholder="e.g. Weekly groceries" maxLength={60} required />
                <div className="form-row"><div><label htmlFor="amount">Amount</label><div className="input-with-symbol"><span>₦</span><input type="number" id="amount" placeholder="0.00" min="0.01" step="0.01" required /></div></div><div><label htmlFor="category">Category</label><select id="category"><option>Food</option><option>Bills</option><option>Transport</option><option>Shopping</option><option>Fun</option><option>Other</option></select></div></div>
                <div><label htmlFor="expense-date">Date</label><input type="date" id="expense-date" required /><small className="field-hint">Previous years are supported.</small></div>
                <p className="form-message" id="form-message" role="alert" /><div className="form-actions"><button className="primary-button" id="expense-submit-btn" type="submit">Add expense <span>↗</span></button><button className="secondary-button" id="cancel-edit-btn" type="button" hidden>Cancel</button></div>
              </form>
            </article>

            <article className="panel chart-panel" id="insights">
              <div className="panel-header"><div><p className="eyebrow">Where it goes</p><h2>Spending breakdown</h2></div><select className="period-select" id="chart-period" aria-label="Chart period"><option value="month">This month</option><option value="year">This year</option><option value="all">All history</option></select></div>
              <div className="chart-wrap"><canvas id="expenseChart" aria-label="Spending by category" role="img" /><div className="chart-empty" id="chart-empty"><strong>Your chart is waiting</strong><span>Add expenses to see your mix.</span></div></div><div className="legend" id="chart-legend" />
            </article>

            <article className="insight-panel" id="spending-pulse"><div className="insight-copy"><div className="trend-intro"><p className="eyebrow">Spending pulse</p><h2>Six-month trend</h2><p id="trend-summary">Add expenses to see how this month compares.</p><a href="#transactions">Review transactions <span>↗</span></a></div><div className="trend-chart" id="monthly-trend" role="img" aria-label="Monthly spending totals for the last six months" /></div></article>

            <article className="panel category-budgets-panel" id="category-budgets">
              <div className="panel-header panel-header-wide"><div><p className="eyebrow">Plan by category</p><h2>Monthly category budgets</h2><p className="muted">Set a limit for each kind of spending and track this month’s progress.</p></div></div>
              <p className="form-message category-budget-message" id="category-budget-message" role="alert" />
              <form className="category-budget-form" id="category-budget-form" noValidate>
                <div><label htmlFor="budget-category">Category</label><select id="budget-category"><option>Food</option><option>Bills</option><option>Transport</option><option>Shopping</option><option>Fun</option><option>Other</option></select></div>
                <div><label htmlFor="category-budget-amount">Monthly limit</label><div className="input-with-symbol"><span>₦</span><input id="category-budget-amount" type="number" min="0.01" step="0.01" placeholder="e.g. 25000" required /></div></div>
                <button className="primary-button" id="category-budget-submit" type="submit">Save limit <span>↗</span></button>
              </form>
              <div className="category-budget-list" id="category-budget-list" aria-live="polite" />
            </article>

            <article className="panel recurring-panel" id="recurring">
              <div className="panel-header panel-header-wide"><div><p className="eyebrow">Plan ahead</p><h2>Recurring expenses</h2><p className="muted">See in-app reminders when regular bills are due. Nothing is added until you confirm it.</p></div></div>
              <form id="recurring-form" className="recurring-form" noValidate>
                <div><label htmlFor="recurring-description">Expense</label><input id="recurring-description" type="text" maxLength={60} placeholder="e.g. Internet bill" required /></div>
                <div><label htmlFor="recurring-amount">Amount</label><div className="input-with-symbol"><span>₦</span><input id="recurring-amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></div></div>
                <div><label htmlFor="recurring-category">Category</label><select id="recurring-category"><option>Bills</option><option>Food</option><option>Transport</option><option>Shopping</option><option>Fun</option><option>Other</option></select></div>
                <div><label htmlFor="recurring-frequency">Repeats</label><select id="recurring-frequency"><option value="monthly">Monthly</option><option value="weekly">Weekly</option></select></div>
                <div><label htmlFor="recurring-date">Next due date</label><input id="recurring-date" type="date" required /></div>
                <button className="primary-button recurring-submit" type="submit">Add reminder <span>↗</span></button>
                <p className="form-message recurring-message" id="recurring-message" role="alert" />
              </form>
              <div className="recurring-list" id="recurring-list" aria-live="polite" />
            </article>

            <article className="panel transactions-panel" id="transactions">
              <div className="panel-header panel-header-wide"><div><p className="eyebrow">Activity</p><h2>Recent transactions</h2></div><div className="table-actions"><label className="search-field"><span>⌕</span><input id="search-input" type="search" placeholder="Search expenses" aria-label="Search expenses" /></label><select id="category-filter" aria-label="Filter by category"><option value="All">All categories</option><option>Food</option><option>Bills</option><option>Transport</option><option>Shopping</option><option>Fun</option><option>Other</option></select></div></div>
              <div className="table-wrap"><table><thead><tr><th scope="col">Description</th><th scope="col">Category</th><th scope="col">Date</th><th scope="col">Amount</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody id="transaction-list" /></table><div className="empty-state" id="empty-state"><strong>No expenses found</strong><p>Add an expense above or adjust your search.</p></div></div>
              <div className="panel-footer"><span id="transaction-summary">Showing 0 transactions</span><button className="danger-button" id="clear-btn" type="button">Clear all</button></div>
            </article>
          </section>
          <footer className="app-footer"><span>Tracking since <strong id="user-joined-date">today</strong></span></footer>
        </main>
      </div>
      <div className="toast" id="toast" role="status" aria-live="polite" />
    </>
  );
}

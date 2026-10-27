"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ThemeToggle from "./ThemeToggle";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationMode, setVerificationMode] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.className = "auth-body";
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage(error.message);
        return;
      }
      if (data.session) window.location.replace("/dashboard");
    });
    return () => {
      document.body.className = "";
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (isSignup && password.length < 6) || (!isSignup && !password)) {
      setMessage(isSignup
        ? "Enter a valid email and a password with at least 6 characters."
        : "Enter a valid email address and your password.");
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: new URL("/dashboard", window.location.origin).href },
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign("/dashboard");
          return;
        }
        setVerificationMode("signup");
        setMessage(`We sent a 6-digit confirmation code to ${email}.`);
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign("/dashboard");
      }
    } catch (error) {
      setMessage(error.message || "Connection failed. Check your internet connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendSignInCode() {
    setMessage("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter a valid email address to receive a sign-in code.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setVerificationMode("email");
      setMessage(`We sent a 6-digit sign-in code to ${email.trim()}.`);
    } catch (error) {
      setMessage(error.message || "Connection failed. Check your internet connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setMessage("");
    if (!/^\d{6}$/.test(otp)) {
      setMessage("Enter the 6-digit code from your email.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: verificationMode,
      });
      if (error) throw error;
      window.location.assign("/dashboard");
    } catch (error) {
      setMessage(error.message || "That code could not be verified. Request a new code and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setMessage("");
    setBusy(true);
    try {
      const result = verificationMode === "signup"
        ? await supabase.auth.resend({ type: "signup", email: email.trim() })
        : await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { shouldCreateUser: false },
          });
      if (result.error) throw result.error;
      setOtp("");
      setMessage(`A new 6-digit code has been sent to ${email.trim()}.`);
    } catch (error) {
      setMessage(error.message || "Could not send another code. Wait a moment and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setMessage("");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: new URL("/dashboard", window.location.origin).href },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error.message || "Could not start Google sign-in. Check your connection and Supabase Google provider settings.");
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <Link className="brand" href="/" aria-label="Ledger home">
          <span className="brand-mark">L</span>
          <span><strong>ledger</strong><small>personal finance</small></span>
        </Link>
        <div>
          <h1>{isSignup ? "A calmer way to spend." : "Make every naira count."}</h1>
          <p>{isSignup
            ? "Start with one account for your expenses, your budget, and a better view of where your money goes."
            : "A clear place for your daily spending, monthly budget, and the small decisions that add up."}</p>
        </div>
        <div className="auth-intro-footer"><span>{isSignup ? "+" : "◒"}</span> Created by Martins Odeshina</div>
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-top">
          <Link className="back-home" href="/">← Back to Ledger home</Link>
          <ThemeToggle />
        </div>
        <p className="eyebrow">{isSignup ? "Start fresh" : "Welcome back"}</p>
        <h2 id="auth-title">
          {verificationMode
            ? "Check your email"
            : isSignup ? "Create your account" : "Sign in to Ledger"}
        </h2>
        <p className="muted">
          {verificationMode
            ? `Enter the 6-digit code sent to ${email}.`
            : isSignup ? "Your expense dashboard is one step away." : "Pick up where you left off."}
        </p>
        {verificationMode ? (
          <form className="auth-form" onSubmit={verifyCode} noValidate>
            <div>
              <label htmlFor="email-otp">Email verification code</label>
              <input
                id="email-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="6-digit code"
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            <p className="auth-message" role="alert">{message}</p>
            <button className="primary-button" type="submit" disabled={busy}>
              <span className="submit-label">{busy ? "Verifying..." : "Verify and continue"}</span>
              <span className="submit-arrow">↗</span>
            </button>
            <button className="email-login-button" type="button" onClick={resendCode} disabled={busy}>
              Send a new code
            </button>
            <button
              className="auth-back-button"
              type="button"
              onClick={() => {
                setVerificationMode(null);
                setOtp("");
                setMessage("");
              }}
            >
              Use a different {isSignup ? "email" : "sign-in method"}
            </button>
          </form>
        ) : (
          <>
            <form className="auth-form" onSubmit={submit} noValidate>
              <div>
                <label htmlFor="username">Email address</label>
                <input id="username" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div>
                <label htmlFor="password">Password</label>
                <input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 6 : undefined} placeholder={isSignup ? "At least 6 characters" : "Your password"} required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              {isSignup && <p className="password-note">Use at least 6 characters. Your account is securely stored in the cloud.</p>}
              <p className="auth-message" role="alert">{message}</p>
              <button className="primary-button" type="submit" disabled={busy}>
                <span className="submit-label">{busy ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Create account" : "Sign in")}</span>
                <span className="submit-arrow">↗</span>
              </button>
            </form>
            {!isSignup && <button className="email-login-button" type="button" onClick={sendSignInCode} disabled={busy}>Email me a sign-in code</button>}
            <div className="auth-divider"><span>or</span></div>
            <button className="google-button" type="button" onClick={signInWithGoogle} disabled={busy}>
              <img className="google-logo" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />
              {isSignup ? "Sign up with Google" : "Continue with Google"}
            </button>
            <p className="auth-switch">
              {isSignup ? "Already have an account? " : "New to Ledger? "}
              <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

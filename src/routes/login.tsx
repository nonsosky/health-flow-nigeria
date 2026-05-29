import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Eye, EyeOff, User } from "lucide-react";

const WEBHOOK_URL = "https://storyreadinginenglish.app.n8n.cloud/webhook/login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — MediFlow" },
      { name: "description", content: "Log in to your MediFlow patient portal." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const portal_pin = String(fd.get("portal_pin") ?? "").trim();

    if (!email || !portal_pin) {
      setError("Please enter your email and PIN.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, portal_pin }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      if (data.success && data.patient) {
        localStorage.setItem("mediflow_patient", JSON.stringify(data.patient));
        navigate({ to: "/dashboard" });
      } else {
        throw new Error("Invalid credentials");
      }
    } catch {
      setError("Incorrect email or PIN. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-sm font-medium text-foreground";

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-3xl px-5 pt-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <main className="flex items-start justify-center px-5 py-8 sm:py-12">
        <div className="w-full max-w-[400px] rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>

          <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email and PIN to access your portal
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className={labelClass}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                maxLength={255}
                className={`${inputClass} mt-1.5`}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="portal_pin" className={labelClass}>
                4-digit PIN
              </label>
              <div className="relative mt-1.5">
                <input
                  id="portal_pin"
                  name="portal_pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  className={`${inputClass} pr-10 tracking-[0.5em]`}
                  placeholder="••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-xs font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Logging in…" : "Log in"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              New patient?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary hover:underline"
              >
                Register here
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Eye, EyeOff, Stethoscope } from "lucide-react";

const WEBHOOK_URL = "https://storyreadinginenglish.app.n8n.cloud/webhook/doctor_login";

export const Route = createFileRoute("/doctor-login")({
  head: () => ({
    meta: [
      { title: "Doctor Portal — MediFlow" },
      { name: "description", content: "Sign in to the MediFlow doctor portal." },
    ],
  }),
  component: DoctorLogin,
});

function DoctorLogin() {
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
      let res: Response;
      try {
        res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, portal_pin }),
        });
      } catch {
        setError("Unable to connect. Please check your connection and try again.");
        return;
      }

      const raw = await res.json().catch(() => null);
      const data = Array.isArray(raw) ? raw[0] : raw;

      const doctorRaw = data && (data.doctor ?? data.patient ?? data.user);
      if (res.ok && data && data.success && doctorRaw) {
        const doctor = {
          id: doctorRaw.id,
          full_name: doctorRaw.full_name,
          email: doctorRaw.email,
          specialisation:
            doctorRaw.specialisation ?? doctorRaw["specialisation:"] ?? "",
        };
        localStorage.setItem("mediflow_doctor", JSON.stringify(doctor));
        navigate({ to: "/doctor" });
      } else {
        setError("Incorrect email or PIN. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-sm font-medium text-foreground";

  return (
    <div className="min-h-screen bg-secondary font-sans">
      {/* Top nav */}
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-primary">MediFlow</span>
          </div>
        </div>
      </header>

      <main className="flex items-start justify-center px-5 py-10 sm:py-16">
        <div className="w-full max-w-[420px] rounded-xl border border-border bg-card p-7 shadow-sm sm:p-9">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>

          <div className="mt-5 flex justify-center">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Staff Access Only
            </span>
          </div>

          <h1 className="mt-3 text-center text-2xl font-bold tracking-tight text-foreground">
            Doctor Portal
          </h1>
          <p className="mt-1.5 text-center text-sm text-muted-foreground">
            Sign in with your clinic email and staff PIN
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className={labelClass}>
                Clinic email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                maxLength={255}
                className={`${inputClass} mt-1.5`}
                placeholder="doctor@clinic.com"
              />
            </div>

            <div>
              <label htmlFor="portal_pin" className={labelClass}>
                4-digit staff PIN
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
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Access is restricted to registered medical staff.
              <br />
              Contact your clinic administrator if you need access.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

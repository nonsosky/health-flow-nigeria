import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const WEBHOOK_URL = "https://YOUR_N8N_WEBHOOK_URL/register";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your profile — MediFlow" },
      { name: "description", content: "Register as a new MediFlow patient in under 2 minutes." },
    ],
  }),
  component: Register,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  date_of_birth: z.string().min(1, "Select your date of birth"),
  gender: z.enum(["Male", "Female", "Other"]),
  blood_group: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
  allergies: z.string().trim().min(1, "Required — type 'None' if not applicable").max(500),
  portal_pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
});

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

function Register() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [confirmPin, setConfirmPin] = useState("");
  const [pin, setPin] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setPinError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const raw = {
      full_name: String(fd.get("full_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      date_of_birth: String(fd.get("date_of_birth") ?? ""),
      gender: String(fd.get("gender") ?? ""),
      blood_group: String(fd.get("blood_group") ?? ""),
      allergies: String(fd.get("allergies") ?? ""),
      portal_pin: String(fd.get("portal_pin") ?? ""),
    };
    const confirm = String(fd.get("confirm_pin") ?? "");

    if (raw.portal_pin !== confirm) {
      setPinError("PINs do not match");
      return;
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      toast.success("Profile created! Please log in to book your appointment.");
      navigate({ to: "/login" });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-sm font-medium text-foreground";
  const hintClass = "mt-1 text-xs text-muted-foreground";

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
        <div className="w-full max-w-[480px] rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Create your patient profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Takes less than 2 minutes. Used every time you visit.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="full_name" className={labelClass}>Full name</label>
              <input id="full_name" name="full_name" type="text" required maxLength={100} className={`${inputClass} mt-1.5`} />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>Email address</label>
              <input id="email" name="email" type="email" required maxLength={255} className={`${inputClass} mt-1.5`} />
              <p className={hintClass}>Used to log in</p>
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>Phone number</label>
              <input id="phone" name="phone" type="tel" required placeholder="+234..." maxLength={20} className={`${inputClass} mt-1.5`} />
            </div>

            <div>
              <label htmlFor="date_of_birth" className={labelClass}>Date of birth</label>
              <input id="date_of_birth" name="date_of_birth" type="date" required className={`${inputClass} mt-1.5`} />
            </div>

            <div>
              <label htmlFor="gender" className={labelClass}>Gender</label>
              <select id="gender" name="gender" required defaultValue="" className={`${inputClass} mt-1.5`}>
                <option value="" disabled>Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="blood_group" className={labelClass}>Blood group</label>
              <select id="blood_group" name="blood_group" required defaultValue="" className={`${inputClass} mt-1.5`}>
                <option value="" disabled>Select…</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="allergies" className={labelClass}>Known allergies</label>
              <textarea
                id="allergies"
                name="allergies"
                required
                rows={3}
                maxLength={500}
                placeholder="e.g. Penicillin, Sulfa drugs. Type 'None' if not applicable"
                className={`${inputClass} mt-1.5 resize-y`}
              />
            </div>

            <div>
              <label htmlFor="portal_pin" className={labelClass}>Create a 4-digit PIN</label>
              <input
                id="portal_pin"
                name="portal_pin"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className={`${inputClass} mt-1.5 tracking-[0.5em]`}
              />
              <p className={hintClass}>You will use this PIN to log in each visit</p>
            </div>

            <div>
              <label htmlFor="confirm_pin" className={labelClass}>Confirm PIN</label>
              <input
                id="confirm_pin"
                name="confirm_pin"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
                value={confirmPin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setConfirmPin(v);
                  if (pinError && v === pin) setPinError(null);
                }}
                className={`${inputClass} mt-1.5 tracking-[0.5em]`}
              />
              {pinError && (
                <p className="mt-1.5 text-xs font-medium text-destructive">{pinError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating profile…" : "Create my profile"}
            </button>

            {submitError && (
              <p className="text-center text-sm font-medium text-destructive">{submitError}</p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Log in here
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

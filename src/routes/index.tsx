import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Calendar, FileText, History } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediFlow — Your health, managed before you arrive" },
      { name: "description", content: "AI-powered patient portal for Nigerian clinics. Register once, book appointments, and access your medical history from your phone." },
      { property: "og:title", content: "MediFlow — AI-powered patient portal" },
      { property: "og:description", content: "Register once, book appointments, and access your full medical history." },
    ],
  }),
  component: Index,
});

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Activity className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">MediFlow</span>
    </Link>
  );
}

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <header className="border-b border-border/60">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
        </nav>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary sm:text-sm">
            Trusted by clinics across Nigeria
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Your health, managed before you arrive
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Register once, book appointments, and access your full medical history — all from your phone.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              I'm a new patient
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-primary bg-background px-7 text-base font-semibold text-primary transition hover:bg-secondary"
            >
              I've visited before
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
            {[
              { icon: Calendar, label: "Book in 2 minutes" },
              { icon: FileText, label: "No paperwork" },
              { icon: History, label: "See your history anytime" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 px-5 py-6 text-center text-sm text-muted-foreground">
        MediFlow © 2026 — Powered by AI
      </footer>
    </div>
  );
}

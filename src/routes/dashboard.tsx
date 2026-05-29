import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, LogOut, Stethoscope, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — MediFlow" }],
  }),
  component: Dashboard,
});

const SUPABASE_URL = "https://akrwucfwvwvooxyrdrub.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcnd1Y2Z3dnd2b294eXJkcnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTAyOTIsImV4cCI6MjA5NTM2NjI5Mn0.EHw35-o2i78Aq0H85dR6zNePubmxNvYlxcf8qOqjUWU";
const CANCEL_WEBHOOK = "https://storyreadinginenglish.app.n8n.cloud/webhook/cancel";
const BOOKING_WEBHOOK = "https://storyreadinginenglish.app.n8n.cloud/webhook/appointment-booking";
const DOCTOR_NAME = "Dr. Adaeze Eze";

type Patient = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  blood_group?: string;
  allergies?: string;
};

type SlotInfo = { slot_date: string; slot_time: string; doctor_name: string };
type Appointment = {
  id: string;
  patient_id: string;
  chief_complaint: string;
  status: "booked" | "checked_in" | string;
  slots: SlotInfo | null;
};
type HistoryRow = {
  appointment_id?: string;
  id?: string;
  slot_date: string;
  slot_time?: string;
  doctor_name: string;
  diagnosis: string;
  prescription: string;
};
type Slot = { id: string; slot_time: string };

function sbHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

function fmtDateTime(dateStr?: string, timeStr?: string) {
  if (!dateStr) return "";
  const iso = timeStr ? `${dateStr}T${timeStr}` : dateStr;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return `${dateStr} ${timeStr ?? ""}`.trim();
  const datePart = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  if (!timeStr) return datePart;
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
}

function fmtShortDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(timeStr: string) {
  const d = new Date(`2000-01-01T${timeStr}`);
  if (isNaN(d.getTime())) return timeStr;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function Dashboard() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mediflow_patient");
      if (!raw) {
        navigate({ to: "/login" });
        return;
      }
      setPatient(JSON.parse(raw));
      setReady(true);
    } catch {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  if (!ready || !patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <DashboardInner patient={patient} />;
}

function DashboardInner({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const firstName = patient.full_name?.split(" ")[0] ?? "there";

  const [upcoming, setUpcoming] = useState<Appointment[] | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [upcomingErr, setUpcomingErr] = useState(false);
  const [historyErr, setHistoryErr] = useState(false);

  const [refreshSlotsTick, setRefreshSlotsTick] = useState(0);

  const loadUpcoming = useCallback(async () => {
    setUpcoming(null);
    setUpcomingErr(false);
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setUpcomingErr(true);
      return;
    }
    try {
      const url =
        `${SUPABASE_URL}/rest/v1/appointments` +
        `?patient_id=eq.${patient.id}` +
        `&status=in.(booked,checked_in)` +
        `&select=*,slots(slot_date,slot_time,doctor_name)` +
        `&order=slots(slot_date).asc`;
      const res = await fetch(url, { headers: sbHeaders() });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as Appointment[];
      data.sort((a, b) => {
        const ad = a.slots?.slot_date ?? "";
        const bd = b.slots?.slot_date ?? "";
        return ad.localeCompare(bd);
      });
      setUpcoming(data);
    } catch {
      setUpcomingErr(true);
      setUpcoming([]);
    }
  }, [patient.id]);

  const loadHistory = useCallback(async () => {
    setHistory(null);
    setHistoryErr(false);
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setHistoryErr(true);
      return;
    }
    try {
      const url =
        `${SUPABASE_URL}/rest/v1/patient_history` +
        `?patient_id=eq.${patient.id}` +
        `&status=eq.completed` +
        `&order=slot_date.desc`;
      const res = await fetch(url, { headers: sbHeaders() });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as HistoryRow[];
      setHistory(data);
    } catch {
      setHistoryErr(true);
      setHistory([]);
    }
  }, [patient.id]);

  useEffect(() => {
    loadUpcoming();
    loadHistory();
  }, [loadUpcoming, loadHistory]);

  function handleLogout() {
    localStorage.removeItem("mediflow_patient");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              MediFlow
            </span>
          </Link>
          <p className="hidden text-sm font-medium text-foreground sm:block">
            Hello, {firstName}
          </p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
        <p className="border-t border-border/40 px-4 py-2 text-center text-sm font-medium text-foreground sm:hidden">
          Hello, {firstName}
        </p>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-5 lg:gap-8 lg:py-8">
        {/* Left column */}
        <section className="space-y-8 lg:col-span-2 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
          <UpcomingSection
            appointments={upcoming}
            error={upcomingErr}
            onCancelled={() => {
              loadUpcoming();
              setRefreshSlotsTick((t) => t + 1);
            }}
            patientId={patient.id}
          />
          <HistorySection history={history} error={historyErr} />
        </section>

        {/* Right column */}
        <section className="lg:col-span-3">
          <BookingPanel
            patientId={patient.id}
            refreshTick={refreshSlotsTick}
            onBooked={() => loadUpcoming()}
          />
        </section>
      </main>
    </div>
  );
}

/* ───────────────────── Upcoming ───────────────────── */

function UpcomingSection({
  appointments,
  error,
  onCancelled,
  patientId,
}: {
  appointments: Appointment[] | null;
  error: boolean;
  onCancelled: () => void;
  patientId: string;
}) {
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function confirmCancel() {
    if (!cancelling) return;
    setSubmitting(true);
    try {
      const res = await fetch(CANCEL_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: cancelling.id,
          patient_id: patientId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Your appointment has been cancelled. The slot is now free.");
      setCancelling(null);
      onCancelled();
    } catch {
      toast.error("Cancellation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">Upcoming Appointments</h2>
      <div className="mt-3 space-y-3">
        {appointments === null && !error ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : appointments && appointments.length > 0 ? (
          appointments.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {fmtDateTime(a.slots?.slot_date, a.slots?.slot_time)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {a.slots?.doctor_name ?? DOCTOR_NAME}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              {a.chief_complaint && (
                <p className="mt-3 text-sm text-foreground/80">
                  <span className="font-medium text-foreground">Reason: </span>
                  {a.chief_complaint}
                </p>
              )}
              <button
                onClick={() => setCancelling(a)}
                className="mt-4 w-full rounded-lg border border-destructive/60 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/5"
              >
                Cancel appointment
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-secondary/40 p-4 text-sm text-muted-foreground">
            No upcoming appointments. Book one using the form →
          </p>
        )}
      </div>

      {cancelling && (
        <Modal onClose={() => !submitting && setCancelling(null)}>
          <h3 className="text-lg font-bold text-foreground">Cancel appointment?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to cancel your appointment on{" "}
            <span className="font-medium text-foreground">
              {fmtDateTime(cancelling.slots?.slot_date, cancelling.slots?.slot_time)}
            </span>
            ? This cannot be undone.
          </p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setCancelling(null)}
              disabled={submitting}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
            >
              Keep appointment
            </button>
            <button
              onClick={confirmCancel}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Cancelling…" : "Yes, cancel it"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isCheckedIn = status === "checked_in";
  const cls = isCheckedIn
    ? "bg-green-100 text-green-800"
    : "bg-amber-100 text-amber-800";
  const label = isCheckedIn ? "Checked in" : "Booked";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

/* ───────────────────── History ───────────────────── */

function HistorySection({
  history,
  error,
}: {
  history: HistoryRow[] | null;
  error: boolean;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">Visit History</h2>
      <div className="mt-3 space-y-3">
        {history === null && !error ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : history && history.length > 0 ? (
          history.map((h, i) => (
            <div
              key={h.appointment_id ?? h.id ?? i}
              className="rounded-xl border border-border/60 border-l-4 border-l-primary bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {fmtShortDate(h.slot_date)}
                </p>
                <p className="text-xs text-muted-foreground">{h.doctor_name}</p>
              </div>
              {h.diagnosis && (
                <p className="mt-2 text-sm font-bold text-primary">{h.diagnosis}</p>
              )}
              {h.prescription && (
                <p className="mt-1 text-sm text-foreground/80">
                  <span className="font-medium text-foreground">Rx: </span>
                  {h.prescription}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-secondary/40 p-4 text-sm text-muted-foreground">
            No visits yet — your history will appear here after your first consultation.
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Booking ───────────────────── */

function BookingPanel({
  patientId,
  refreshTick,
  onBooked,
}: {
  patientId: string;
  refreshTick: number;
  onBooked: () => void;
}) {
  const days = useMemo(() => {
    const out: { iso: string; label: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      out.push({ iso, label });
    }
    return out;
  }, []);

  const [dayHasSlots, setDayHasSlots] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [chief, setChief] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Preload availability for all 7 days (counts)
  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, boolean> = {};
      await Promise.all(
        days.map(async ({ iso }) => {
          try {
            const url =
              `${SUPABASE_URL}/rest/v1/slots` +
              `?slot_date=eq.${iso}` +
              `&is_available=eq.true` +
              `&doctor_name=eq.${encodeURIComponent(DOCTOR_NAME)}` +
              `&select=id&limit=1`;
            const res = await fetch(url, { headers: sbHeaders() });
            if (!res.ok) throw new Error();
            const data = (await res.json()) as unknown[];
            map[iso] = data.length > 0;
          } catch {
            map[iso] = false;
          }
        }),
      );
      if (!cancelled) setDayHasSlots(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [days, refreshTick]);

  const loadSlots = useCallback(
    async (date: string) => {
      setSlots(null);
      setSelectedSlot(null);
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setSlots([]);
        return;
      }
      try {
        const url =
          `${SUPABASE_URL}/rest/v1/slots` +
          `?slot_date=eq.${date}` +
          `&is_available=eq.true` +
          `&doctor_name=eq.${encodeURIComponent(DOCTOR_NAME)}` +
          `&select=id,slot_time` +
          `&order=slot_time.asc`;
        const res = await fetch(url, { headers: sbHeaders() });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as Slot[];
        setSlots(data);
      } catch {
        setSlots([]);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate, loadSlots, refreshTick]);

  const canSubmit = !!selectedDate && !!selectedSlot && chief.trim().length > 0 && !submitting;

  async function handleBook() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSuccess(null);
    try {
      const res = await fetch(BOOKING_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          slot_id: selectedSlot,
          chief_complaint: chief.trim(),
          pre_symptoms: symptoms.trim() || null,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        if (text.includes("SLOT_TAKEN")) {
          toast.error("This slot was just booked by someone else. Please choose a different time.");
          if (selectedDate) loadSlots(selectedDate);
          return;
        }
        throw new Error();
      }
      const slot = slots?.find((s) => s.id === selectedSlot);
      const banner = `✓ Your appointment is confirmed for ${
        selectedDate ? fmtShortDate(selectedDate) : ""
      } at ${slot ? fmtTime(slot.slot_time) : ""} with ${DOCTOR_NAME}. You will receive a confirmation shortly.`;
      setSuccess(banner);
      setChief("");
      setSymptoms("");
      setSelectedSlot(null);
      if (selectedDate) loadSlots(selectedDate);
      onBooked();
    } catch {
      toast.error("Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-foreground">Book your next visit</h2>
      <p className="mt-1 text-sm text-muted-foreground">with {DOCTOR_NAME}</p>

      {success && (
        <div className="mt-4 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">
          {success}
        </div>
      )}

      {/* Step 1 */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">1. Pick a date</h3>
        <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {days.map(({ iso, label }) => {
            const hasSlots = dayHasSlots[iso];
            const selected = selectedDate === iso;
            const disabled = hasSlots === false;
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedDate(iso)}
                className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : disabled
                      ? "cursor-not-allowed border-border/60 bg-secondary text-muted-foreground/60"
                      : "border-primary/40 text-primary hover:bg-primary/5"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">2. Pick a time slot</h3>
        <div className="mt-3">
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground">Select a date to see available times.</p>
          ) : slots === null ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No slots available on this day. Please pick another date.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s) => {
                const selected = selectedSlot === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSlot(s.id)}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/40 text-primary hover:bg-primary/5"
                    }`}
                  >
                    {fmtTime(s.slot_time)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Step 3 */}
      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">3. Reason for visit</h3>
        <div>
          <label className="block text-sm font-medium text-foreground">
            Chief complaint <span className="text-destructive">*</span>
          </label>
          <textarea
            value={chief}
            onChange={(e) => setChief(e.target.value)}
            rows={3}
            placeholder="Briefly describe why you are visiting..."
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">
            Pre-visit symptoms <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={3}
            placeholder="Any symptoms you have noticed recently? Be as detailed as possible — this helps the doctor prepare."
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleBook}
        disabled={!canSubmit}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Booking…" : "Confirm booking"}
      </button>
    </div>
  );
}

/* ───────────────────── Shared ───────────────────── */

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-secondary" />
      <div className="mt-4 h-9 w-full animate-pulse rounded bg-secondary" />
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground transition hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

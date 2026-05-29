import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, LogOut, Send, Stethoscope, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor")({
  head: () => ({ meta: [{ title: "Doctor Dashboard — MediFlow" }] }),
  component: DoctorPage,
});

const SUPABASE_URL = "https://akrwucfwvwvooxyrdrub.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcnd1Y2Z3dnd2b294eXJkcnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTAyOTIsImV4cCI6MjA5NTM2NjI5Mn0.EHw35-o2i78Aq0H85dR6zNePubmxNvYlxcf8qOqjUWU";
const RAG_WEBHOOK = "https://storyreadinginenglish.app.n8n.cloud/webhook/rag-query";
const SAVE_NOTE_WEBHOOK = "https://storyreadinginenglish.app.n8n.cloud/webhook/save-note";

type Doctor = {
  id: string;
  full_name: string;
  email: string;
  specialisation?: string;
};

function lastName(full?: string) {
  if (!full) return "";
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? "";
}


type QueueRow = {
  appointment_id: string;
  patient_id: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  phone?: string;
  allergies?: string;
  slot_date: string;
  slot_time: string;
  chief_complaint?: string;
  pre_visit_symptoms?: string;
  status: string;
  urgent_flag?: boolean;
};

type Visit = {
  id: string;
  patient_id: string;
  visit_date: string;
  diagnosis?: string;
  prescription?: string;
  soap_assessment?: string;
  soap_plan?: string;
};

type ChatMsg = { role: "user" | "assistant"; content: string; sources?: string[] };

function sbHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtTime(t?: string) {
  if (!t) return "";
  const d = new Date(`2000-01-01T${t}`);
  if (isNaN(d.getTime())) return t;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtDateLong(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusBadgeClasses(status: string) {
  switch (status) {
    case "checked_in":
      return "bg-emerald-100 text-emerald-700";
    case "booked":
      return "bg-amber-100 text-amber-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "checked_in":
      return "Checked in";
    case "booked":
      return "Waiting";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}



function DoctorPage() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("mediflow_doctor");
    if (!raw) {
      navigate({ to: "/doctor-login" });
      return;
    }
    try {
      setDoctor(JSON.parse(raw) as Doctor);
    } catch {
      localStorage.removeItem("mediflow_doctor");
      navigate({ to: "/doctor-login" });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready || !doctor) return null;
  return <DoctorDashboard doctor={doctor} />;
}

function DoctorDashboard({ doctor }: { doctor: Doctor }) {
  const navigate = useNavigate();
  const today = useMemo(() => todayISO(), []);
  const [queue, setQueue] = useState<QueueRow[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setQueue([]);
      return;
    }
    try {
      const url = `${SUPABASE_URL}/rest/v1/doctor_queue?slot_date=eq.${today}&order=slot_time.asc`;
      const res = await fetch(url, { headers: sbHeaders() });
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as QueueRow[];
      setQueue(data);
      if (data.length && !selectedId) setSelectedId(data[0].appointment_id);
    } catch {
      setQueue([]);
    }
  }, [today, selectedId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  function handleSignOut() {
    localStorage.removeItem("mediflow_doctor");
    navigate({ to: "/doctor-login" });
  }


  const selected = useMemo(
    () => queue?.find((q) => q.appointment_id === selectedId) ?? null,
    [queue, selectedId],
  );

  const stats = useMemo(() => {
    const rows = queue ?? [];
    return {
      total: rows.length,
      waiting: rows.filter((r) => r.status === "booked" || r.status === "checked_in").length,
      urgent: rows.filter((r) => r.urgent_flag).length,
    };
  }, [queue]);

  return (
    <div className="min-h-screen bg-secondary">
      {/* Top bar */}
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Stethoscope className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-primary">MediFlow</span>
          </Link>
          <div className="hidden flex-1 text-center text-sm font-medium text-foreground sm:block md:text-base">
            Dr. {lastName(doctor.full_name)}
            {doctor.specialisation ? ` — ${doctor.specialisation}` : ""}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {fmtDateLong(today)}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
        <div className="mx-auto block max-w-7xl px-4 pb-3 text-center text-sm font-medium text-foreground sm:hidden">
          Dr. {lastName(doctor.full_name)}
          {doctor.specialisation ? ` — ${doctor.specialisation}` : ""}
        </div>
      </header>


      {/* Stat cards */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Today's Appointments" value={queue === null ? null : stats.total} />
          <StatCard label="Waiting" value={queue === null ? null : stats.waiting} />
          <StatCard
            label="Urgent Flags"
            value={queue === null ? null : stats.urgent}
            highlight={stats.urgent > 0}
          />
        </div>
      </div>

      {/* Main body */}
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[35%_65%]">
        {/* Left column */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Today's Queue
          </h2>
          <div className="space-y-2">
            {queue === null ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : queue.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No appointments today.
                </CardContent>
              </Card>
            ) : (
              queue.map((row) => {
                const isSelected = row.appointment_id === selectedId;
                const hasAllergy = row.allergies && row.allergies.toLowerCase() !== "none known";
                return (
                  <button
                    key={row.appointment_id}
                    onClick={() => setSelectedId(row.appointment_id)}
                    className={cn(
                      "w-full rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary/40",
                      isSelected && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground">{fmtTime(row.slot_time)}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          statusBadgeClasses(row.status),
                        )}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-foreground">{row.full_name}</div>
                    {row.chief_complaint && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {row.chief_complaint.length > 30
                          ? `${row.chief_complaint.slice(0, 30)}…`
                          : row.chief_complaint}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {row.urgent_flag && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <AlertTriangle className="h-3 w-3" /> Urgent
                        </span>
                      )}
                      {hasAllergy && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          {row.allergies}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Right column */}
        <section>
          {selected ? (
            <ConsultationView
              key={selected.appointment_id}
              patient={selected}
              doctor={doctor}
              onSaved={() => loadQueue()}
            />

          ) : (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Select a patient from the queue.
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            "mt-2 text-3xl font-bold",
            highlight ? "text-red-600" : "text-foreground",
          )}
        >
          {value === null ? <Skeleton className="h-8 w-12" /> : value}
        </div>
      </CardContent>
    </Card>
  );
}
function ConsultationView({
  patient,
  doctor,
  onSaved,
}: {
  patient: QueueRow;
  doctor: Doctor;
  onSaved: () => void;
}) {

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">{patient.full_name}</h2>
          <p className="text-sm text-muted-foreground">
            {fmtTime(patient.slot_time)} · {patient.chief_complaint || "No complaint listed"}
          </p>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Patient Info</TabsTrigger>
            <TabsTrigger value="history">Visit History</TabsTrigger>
            <TabsTrigger value="ai">Clinical AI</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <PatientInfo patient={patient} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <VisitHistory patientId={patient.patient_id} />
          </TabsContent>
          <TabsContent value="ai" className="mt-4">
            <ClinicalAI patientId={patient.patient_id} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 border-t pt-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Save consultation notes</h3>
          <SoapForm patient={patient} doctor={doctor} onSaved={onSaved} />

        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

function PatientInfo({ patient }: { patient: QueueRow }) {
  const hasAllergy = patient.allergies && patient.allergies.toLowerCase() !== "none known";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <InfoRow label="Full name" value={patient.full_name} />
        <InfoRow label="Date of birth" value={patient.date_of_birth} />
        <InfoRow label="Gender" value={patient.gender} />
        <InfoRow label="Blood group" value={patient.blood_group} />
        <InfoRow label="Phone" value={patient.phone} />
      </div>
      {hasAllergy && (
        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
          <AlertTriangle className="h-4 w-4" />
          Allergy: {patient.allergies}
        </div>
      )}
      <div className="rounded-lg bg-secondary p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Chief complaint
        </div>
        <div className="mt-1 text-sm text-foreground">{patient.chief_complaint || "—"}</div>
        {patient.pre_visit_symptoms && (
          <>
            <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pre-visit symptoms
            </div>
            <div className="mt-1 text-sm text-foreground">{patient.pre_visit_symptoms}</div>
          </>
        )}
      </div>
    </div>
  );
}

function VisitHistory({ patientId }: { patientId: string }) {
  const [visits, setVisits] = useState<Visit[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setVisits(null);
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setVisits([]);
        return;
      }
      try {
        const url = `${SUPABASE_URL}/rest/v1/visits?patient_id=eq.${patientId}&order=visit_date.desc`;
        const res = await fetch(url, { headers: sbHeaders() });
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as Visit[];
        if (!cancelled) setVisits(data);
      } catch {
        if (!cancelled) setVisits([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (visits === null) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (visits.length === 0) {
    return <p className="text-sm text-muted-foreground">No previous visits.</p>;
  }

  return (
    <div className="space-y-3">
      {visits.map((v) => (
        <div
          key={v.id}
          className="rounded-lg border border-l-4 border-l-primary bg-background p-4"
        >
          <div className="text-sm font-semibold text-foreground">
            {fmtDateLong(v.visit_date)}
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <InfoRow label="Diagnosis" value={v.diagnosis} />
            <InfoRow label="Prescription" value={v.prescription} />
            <InfoRow label="Assessment" value={v.soap_assessment} />
            <InfoRow label="Plan" value={v.soap_plan} />
          </div>
        </div>
      ))}
    </div>
  );
}

const SUGGESTED = [
  "BP history?",
  "Current medications?",
  "Why flagged?",
  "Allergies and interactions?",
  "Last diagnosis?",
];

function ClinicalAI({ patientId }: { patientId: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(RAG_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, question }),
      });
      const data = await res.json().catch(() => ({}));
      const answer = data.answer || data.response || data.output || "No response.";
      const sources: string[] = Array.isArray(data.sources) ? data.sources : [];
      setMessages((m) => [...m, { role: "assistant", content: answer, sources }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I couldn't reach the AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[500px] flex-col">
      <div className="flex flex-wrap gap-2 pb-3">
        {SUGGESTED.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            disabled={loading}
            className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-secondary p-3"
      >
        {messages.length === 0 && !loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Ask anything about this patient.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground",
              )}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 border-t border-border/50 pt-1.5 text-xs text-muted-foreground">
                  <div className="font-medium">Sources</div>
                  <ul className="list-disc pl-4">
                    {m.sources.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-background px-3 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-3 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this patient..."
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
function SoapForm({ patient, doctor, onSaved }: { patient: QueueRow; doctor: Doctor; onSaved: () => void }) {

function SoapForm({ patient, onSaved }: { patient: QueueRow; onSaved: () => void }) {
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(SAVE_NOTE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patient.patient_id,
          appointment_id: patient.appointment_id,
          soap_subjective: subjective,
          soap_objective: objective,
          soap_assessment: assessment,
          soap_plan: plan,
          diagnosis,
          prescription,
          doctor_name: DOCTOR_NAME,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("Note saved and embedded into AI memory");
      setSubjective("");
      setObjective("");
      setAssessment("");
      setPlan("");
      setDiagnosis("");
      setPrescription("");
      onSaved();
    } catch {
      toast.error("Could not save note. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-foreground">Subjective</label>
          <Textarea
            value={subjective}
            onChange={(e) => setSubjective(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Objective</label>
          <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Assessment</label>
          <Textarea
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Plan</label>
          <Textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={3} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Diagnosis</label>
          <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground">Prescription</label>
          <Input value={prescription} onChange={(e) => setPrescription(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save SOAP note"}
      </Button>
    </form>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarX,
  ClipboardList,
  Database,
  FileText,
  Loader2,
  LogOut,
  Lock,
  Stethoscope,
  TrendingUp,
  Users,
  UserPlus,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Analytics — MediFlow" }] }),
  component: AdminPage,
});

const ANALYTICS_WEBHOOK = "https://unpledged-mayflower-motion.ngrok-free.dev/webhook/analytics";
const ADMIN_PIN = "doctor2026";
const AUTH_KEY = "mediflow_admin_auth";
const REFRESH_MS = 60_000;

const TEAL = "#00e5c8";
const BLUE = "#3b82f6";
const ORANGE = "#fb923c";
const RED = "#ef4444";
const PURPLE = "#a855f7";
const YELLOW = "#facc15";
const PIE_COLORS = [TEAL, BLUE, PURPLE, ORANGE, YELLOW, "#64748b"];

type Analytics = {
  totalPatients?: number;
  newThisMonth?: number;
  todayAppointments?: number;
  weekBooked?: number;
  weekAttended?: number;
  weekCancelled?: number;
  weekUrgent?: number;
  totalUrgent?: number;
  totalVisits?: number;
  notificationsSent?: number;
  soapNotesSaved?: number;
  embeddingsIndexed?: number;
  appointmentTrend?: { week: string; booked: number; attended: number; cancelled: number }[];
  registrationTrend?: { month: string; patients: number }[];
  diagnosisBreakdown?: { name: string; value: number }[];
  bloodGroups?: { group: string; count: number }[];
  genderDistribution?: { gender: string; count: number }[];
  topAllergies?: { name: string; count: number }[];
  urgentToday?: { patient_id?: string; patients?: string; name?: string; symptom: string; status?: string; time?: string }[];
  recentActivity?: { type: string; message: string; time: string }[];
  ragModel?: string;
  embeddingModel?: string;
  vectorDimensions?: number | string;
  matchCount?: number | string;
  vectorStore?: string;
};

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthed(sessionStorage.getItem(AUTH_KEY) === "1");
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />;
  return (
    <AdminDashboard
      onSignOut={() => {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthed(false);
      }}
    />
  );
}

function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onSuccess();
    } else {
      setErr("Incorrect PIN");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-[420px] border-slate-800 bg-slate-900">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
              <Lock className="h-6 w-6" style={{ color: TEAL }} />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-white">Admin Access</h1>
            <p className="mt-1 text-sm text-slate-400">Enter staff PIN to continue</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <Input
              type="password"
              autoFocus
              placeholder="PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErr("");
              }}
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
            />
            {err && <p className="text-sm text-red-400">{err}</p>}
            <Button
              type="submit"
              className="w-full text-slate-950 hover:opacity-90"
              style={{ backgroundColor: TEAL }}
            >
              Unlock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load(initial = false) {
    if (initial) setLoading(true);
    try {
      const res = await fetch(ANALYTICS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const d = Array.isArray(raw) ? raw[0] : raw;
      setData((d ?? {}) as Analytics);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      if (initial) setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(false), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ backgroundColor: TEAL }}
            >
              <Stethoscope className="h-4 w-4 text-slate-950" />
            </div>
            <span className="text-lg font-semibold" style={{ color: TEAL }}>
              MediFlow
            </span>
            <span className="ml-2 text-sm text-slate-400">Admin Analytics</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              LIVE
            </span>
            {lastUpdated && (
              <span className="hidden text-xs text-slate-500 sm:inline">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Link to="/doctor" className="text-sm text-slate-400 transition hover:text-white">
              Doctor view
            </Link>
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Lock
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {loading ? (
          <DashboardSkeleton />
        ) : error && !data ? (
          <Card className="border-red-900/50 bg-red-950/20">
            <CardContent className="p-6 text-center">
              <XCircle className="mx-auto h-10 w-10 text-red-400" />
              <p className="mt-3 font-medium text-red-300">Failed to load analytics</p>
              <p className="mt-1 text-sm text-slate-400">{error}</p>
              <Button
                onClick={() => load(true)}
                className="mt-4 text-slate-950"
                style={{ backgroundColor: TEAL }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : data ? (
          <DashboardTabs data={data} />
        ) : null}
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 bg-slate-800/60" />
        ))}
      </div>
      <Skeleton className="h-48 bg-slate-800/60" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 bg-slate-800/60" />
        <Skeleton className="h-72 bg-slate-800/60" />
      </div>
    </div>
  );
}

function DashboardTabs({ data }: { data: Analytics }) {
  const weekBooked = data.weekBooked ?? 0;
  const attendance = useMemo(
    () => (weekBooked ? Math.round(((data.weekAttended ?? 0) / weekBooked) * 100) : 0),
    [data, weekBooked],
  );
  const cancellation = useMemo(
    () => (weekBooked ? Math.round(((data.weekCancelled ?? 0) / weekBooked) * 100) : 0),
    [data, weekBooked],
  );
  const urgentRate = useMemo(
    () => (weekBooked ? Math.round(((data.weekUrgent ?? 0) / weekBooked) * 100) : 0),
    [data, weekBooked],
  );

  const urgentActive = (data.urgentToday ?? []).filter(
    (r) => (r.status ?? "").toLowerCase() !== "cancelled",
  );

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-slate-900 sm:max-w-xl">
        <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">Overview</TabsTrigger>
        <TabsTrigger value="appointments" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">Appointments</TabsTrigger>
        <TabsTrigger value="patients" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">Patients</TabsTrigger>
        <TabsTrigger value="clinical" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">Clinical</TabsTrigger>
      </TabsList>

      {/* Overview */}
      <TabsContent value="overview" className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-7">
          <Kpi color={TEAL} icon={Users} label="Total Patients" value={data.totalPatients ?? 0} />
          <Kpi color={BLUE} icon={UserPlus} label="New This Month" value={data.newThisMonth ?? 0} />
          <Kpi color={BLUE} icon={CalendarCheck} label="Today's Appts" value={data.todayAppointments ?? 0} />
          <Kpi color={RED} icon={AlertTriangle} label="Urgent (Week)" value={data.weekUrgent ?? 0} />
          <Kpi color={ORANGE} icon={CalendarX} label="Cancelled (Week)" value={data.weekCancelled ?? 0} />
          <Kpi color={PURPLE} icon={TrendingUp} label="Total Visits" value={data.totalVisits ?? 0} />
          <Kpi color={YELLOW} icon={Bell} label="Notifications" value={data.notificationsSent ?? 0} />
        </div>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Weekly Performance
            </h3>
            <div className="space-y-4">
              <ProgressRow label="Attendance Rate" value={attendance} color={TEAL} />
              <ProgressRow label="Cancellation Rate" value={cancellation} color={ORANGE} />
              <ProgressRow label="Urgent Flag Rate" value={urgentRate} color={RED} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                <Activity className="h-4 w-4 text-teal-400" /> Live Activity Feed
              </h3>
              <ActivityFeed events={data.recentActivity ?? []} />
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                <AlertTriangle className="h-4 w-4 text-red-400" /> Today's Urgent Cases
              </h3>
              <UrgentTable rows={urgentActive} showTime />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Appointments */}
      <TabsContent value="appointments" className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi color={BLUE} icon={CalendarCheck} label="Week Booked" value={data.weekBooked ?? 0} />
          <Kpi color={TEAL} icon={BadgeCheck} label="Week Attended" value={data.weekAttended ?? 0} />
          <Kpi color={ORANGE} icon={CalendarX} label="Week Cancelled" value={data.weekCancelled ?? 0} />
          <Kpi color={RED} icon={AlertTriangle} label="Urgent Flags" value={data.totalUrgent ?? 0} />
        </div>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Appointment Trend
            </h3>
            <AppointmentTrendChart data={data.appointmentTrend ?? []} tall />
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Today's Urgent Cases
            </h3>
            <UrgentTable rows={urgentActive} detailed />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Patients */}
      <TabsContent value="patients" className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi color={TEAL} icon={Users} label="Total Registered" value={data.totalPatients ?? 0} />
          <Kpi color={BLUE} icon={UserPlus} label="New This Month" value={data.newThisMonth ?? 0} />
          <Kpi color={PURPLE} icon={TrendingUp} label="Total Visits" value={data.totalVisits ?? 0} />
          <Kpi color={YELLOW} icon={Bell} label="Notifications Sent" value={data.notificationsSent ?? 0} />
        </div>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Monthly Registrations
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.registrationTrend ?? []}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                  <Bar dataKey="patients" fill={TEAL} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Blood Group Distribution
              </h3>
              <DonutChart
                data={(data.bloodGroups ?? []).map((b) => ({ name: b.group, value: b.count }))}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Gender Distribution
              </h3>
              <DonutChart
                data={(data.genderDistribution ?? []).map((g) => ({ name: g.gender, value: g.count }))}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Top Allergies
            </h3>
            {(data.topAllergies ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No allergy data.</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {data.topAllergies!.map((a, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-200">{a.name}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                      {a.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Clinical */}
      <TabsContent value="clinical" className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Kpi color={PURPLE} icon={FileText} label="SOAP Notes Saved" value={data.soapNotesSaved ?? 0} />
          <Kpi color={BLUE} icon={Database} label="Embeddings Indexed" value={data.embeddingsIndexed ?? 0} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Top Diagnoses
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.diagnosisBreakdown ?? []} layout="vertical">
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={110} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                    <Bar dataKey="value" fill={PURPLE} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                RAG Engine Configuration
              </h3>
              <dl className="space-y-3 text-sm">
                <ConfigRow label="Model" value={data.ragModel ?? "—"} />
                <ConfigRow label="Embeddings Model" value={data.embeddingModel ?? "—"} />
                <ConfigRow label="Vector Dimensions" value={String(data.vectorDimensions ?? "—")} />
                <ConfigRow label="Match Count" value={String(data.matchCount ?? "—")} />
                <ConfigRow label="Vector Store" value={data.vectorStore ?? "—"} />
              </dl>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function AppointmentTrendChart({
  data,
  tall = false,
}: {
  data: { week: string; booked: number; attended: number; cancelled: number }[];
  tall?: boolean;
}) {
  return (
    <div className={tall ? "h-80" : "h-64"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
          <Legend wrapperStyle={{ color: "#cbd5e1" }} />
          <Bar dataKey="booked" fill={BLUE} radius={[4, 4, 0, 0]} />
          <Bar dataKey="attended" fill={TEAL} radius={[4, 4, 0, 0]} />
          <Bar dataKey="cancelled" fill={ORANGE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <p className="text-sm text-slate-500">No data.</p>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
          <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function Kpi({
  color,
  icon: Icon,
  label,
  value,
}: {
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="overflow-hidden border-slate-800 bg-slate-900">
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </span>
          <Icon className={cn("h-4 w-4")} />
        </div>
        <div className="mt-2 text-2xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  );
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function UrgentTable({
  rows,
  detailed = false,
  showTime = false,
}: {
  rows: NonNullable<Analytics["urgentToday"]>;
  detailed?: boolean;
  showTime?: boolean;
}) {
  if (!rows?.length) {
    return <p className="text-sm text-slate-500">No urgent cases today.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
            {detailed && <th className="pb-2 pr-3">#</th>}
            <th className="pb-2 pr-3">Patient</th>
            <th className="pb-2 pr-3">Symptom</th>
            {showTime && <th className="pb-2 pr-3">Time</th>}
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-800/50">
              {detailed && <td className="py-2 pr-3 text-slate-400">{i + 1}</td>}
              <td className="py-2 pr-3 font-medium text-slate-100">
                {r.patients ?? r.name ?? r.patient_id ?? "—"}
              </td>
              <td className="py-2 pr-3 text-slate-300">{r.symptom}</td>
              {showTime && (
                <td className="py-2 pr-3 text-slate-300">{r.time ?? "—"}</td>
              )}
              <td className="py-2">
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold uppercase text-red-400">
                  URGENT
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityFeed({ events }: { events: NonNullable<Analytics["recentActivity"]> }) {
  const items = useMemo(() => {
    const today = new Date();
    const isSameDay = (d: Date) =>
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();

    const parsed = (events ?? [])
      .map((e) => ({ ...e, _t: new Date(e.time) }))
      .filter((e) => !isNaN(e._t.getTime()) && isSameDay(e._t))
      .sort((a, b) => b._t.getTime() - a._t.getTime())
      .slice(0, 10);
    return parsed;
  }, [events]);

  if (!items.length) {
    return <p className="text-sm text-slate-500">No activity yet today.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((e, i) => {
        const { Icon, color, bg } = activityVisual(e.type);
        return (
          <li key={i} className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: bg }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-200">{e.message}</p>
              <p className="text-xs text-slate-500">
                {e._t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function activityVisual(type: string): {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
} {
  const t = (type ?? "").toLowerCase();
  if (t.includes("regist")) return { Icon: UserPlus, color: BLUE, bg: "rgba(59,130,246,0.15)" };
  if (t.includes("cancel")) return { Icon: CalendarX, color: ORANGE, bg: "rgba(251,146,60,0.15)" };
  if (t.includes("urgent") || t.includes("alert"))
    return { Icon: AlertTriangle, color: RED, bg: "rgba(239,68,68,0.15)" };
  if (t.includes("soap") || t.includes("note"))
    return { Icon: FileText, color: PURPLE, bg: "rgba(168,85,247,0.15)" };
  if (t.includes("book") || t.includes("appoint"))
    return { Icon: CalendarCheck, color: TEAL, bg: "rgba(0,229,200,0.15)" };
  return { Icon: ClipboardList, color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-mono text-slate-200">{value}</dd>
    </div>
  );
}

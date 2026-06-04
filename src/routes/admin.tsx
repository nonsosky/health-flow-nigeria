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
  Line,
  LineChart,
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Analytics — MediFlow" }] }),
  component: AdminPage,
});

const ANALYTICS_WEBHOOK = "https://kendososky.app.n8n.cloud/webhook/analytics";
const ADMIN_PIN = "doctor2026";
const AUTH_KEY = "mediflow_admin_auth";

const TEAL = "#00e5c8";
const BLUE = "#3b82f6";
const ORANGE = "#fb923c";
const RED = "#ef4444";
const PURPLE = "#a855f7";
const YELLOW = "#facc15";
const PIE_COLORS = [TEAL, BLUE, PURPLE, ORANGE, "#64748b"];

type Analytics = {
  totalPatients: number;
  newThisMonth: number;
  todayAppointments: number;
  weekBooked: number;
  weekAttended: number;
  weekCancelled: number;
  weekUrgent: number;
  totalVisits: number;
  notificationsSent: number;
  appointmentTrend: { week: string; booked: number; attended: number; cancelled: number }[];
  registrationTrend: { month: string; patients: number }[];
  diagnosisBreakdown: { name: string; value: number }[];
  bloodGroups: { group: string; count: number }[];
  urgentToday: { name: string; symptom: string; time: string }[];
  recentActivity: { type: string; message: string; time: string }[];
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
  return <AdminDashboard onSignOut={() => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }} />;
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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ANALYTICS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const d = Array.isArray(raw) ? raw[0] : raw;
      setData(d as Analytics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
            <Link
              to="/doctor"
              className="text-sm text-slate-400 transition hover:text-white"
            >
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
          <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: TEAL }} />
          </div>
        ) : error ? (
          <Card className="border-red-900/50 bg-red-950/20">
            <CardContent className="p-6 text-center">
              <XCircle className="mx-auto h-10 w-10 text-red-400" />
              <p className="mt-3 font-medium text-red-300">Failed to load analytics</p>
              <p className="mt-1 text-sm text-slate-400">{error}</p>
              <Button
                onClick={load}
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

function DashboardTabs({ data }: { data: Analytics }) {
  const attendance = useMemo(
    () => (data.weekBooked ? Math.round((data.weekAttended / data.weekBooked) * 100) : 0),
    [data],
  );
  const cancellation = useMemo(
    () => (data.weekBooked ? Math.round((data.weekCancelled / data.weekBooked) * 100) : 0),
    [data],
  );
  const urgentRate = useMemo(
    () => (data.weekBooked ? Math.round((data.weekUrgent / data.weekBooked) * 100) : 0),
    [data],
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Kpi color={TEAL} icon={Users} label="Total Patients" value={data.totalPatients} />
          <Kpi color={BLUE} icon={CalendarCheck} label="Today's Appts" value={data.todayAppointments} />
          <Kpi color={TEAL} icon={BadgeCheck} label="Attended / Booked" value={`${data.weekAttended}/${data.weekBooked}`} />
          <Kpi color={RED} icon={AlertTriangle} label="Urgent (Week)" value={data.weekUrgent} />
          <Kpi color={ORANGE} icon={CalendarX} label="Cancelled (Week)" value={data.weekCancelled} />
          <Kpi color={PURPLE} icon={TrendingUp} label="Total Visits" value={data.totalVisits} />
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
                <Activity className="h-4 w-4" /> Live Activity Feed
              </h3>
              <ul className="space-y-3">
                {data.recentActivity?.length ? (
                  data.recentActivity.map((a, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <ActivityIcon type={a.type} />
                      <div className="flex-1">
                        <p className="text-sm text-slate-200">{a.message}</p>
                        <p className="text-xs text-slate-500">{a.time}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500">No recent activity</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                <AlertTriangle className="h-4 w-4 text-red-400" /> Today's Urgent Cases
              </h3>
              <UrgentTable rows={data.urgentToday} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Appointments */}
      <TabsContent value="appointments" className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Kpi color={BLUE} icon={CalendarCheck} label="Week Booked" value={data.weekBooked} />
          <Kpi color={TEAL} icon={BadgeCheck} label="Week Attended" value={data.weekAttended} />
          <Kpi color={ORANGE} icon={CalendarX} label="Week Cancelled" value={data.weekCancelled} />
          <Kpi color={RED} icon={AlertTriangle} label="Urgent Flags" value={data.weekUrgent} />
          <Kpi color={PURPLE} icon={ClipboardList} label="Available Slots" value={Math.max(0, 140 - data.weekBooked)} />
        </div>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Appointment Trend — Last 7 Weeks
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.appointmentTrend}>
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
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Today's Urgent Cases — Details
            </h3>
            <UrgentTable rows={data.urgentToday} detailed />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Patients */}
      <TabsContent value="patients" className="mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi color={TEAL} icon={Users} label="Total Registered" value={data.totalPatients} />
          <Kpi color={BLUE} icon={UserPlus} label="New This Month" value={data.newThisMonth} />
          <Kpi color={PURPLE} icon={TrendingUp} label="Total Visits" value={data.totalVisits} />
          <Kpi color={YELLOW} icon={Bell} label="Notifications Sent" value={data.notificationsSent} />
        </div>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Monthly Registrations
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.registrationTrend}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="patients" stroke={TEAL} strokeWidth={3} dot={{ fill: TEAL, r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Blood Group Distribution
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bloodGroups} layout="vertical">
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="group" stroke="#94a3b8" fontSize={12} width={50} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                  <Bar dataKey="count" fill={BLUE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Clinical */}
      <TabsContent value="clinical" className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi color={PURPLE} icon={FileText} label="SOAP Notes Saved" value={data.totalVisits} />
          <Kpi color={TEAL} icon={Activity} label="Avg Consult Time" value="14 min" />
          <Kpi color={BLUE} icon={Database} label="Embeddings Indexed" value={data.totalVisits * 3} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Top Diagnoses
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.diagnosisBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {data.diagnosisBreakdown?.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
                  </PieChart>
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
                <ConfigRow label="Model" value="GPT-4o" />
                <ConfigRow label="Embeddings Model" value="text-embedding-3-small" />
                <ConfigRow label="Vector Dimensions" value="1536" />
                <ConfigRow label="Match Count" value="5" />
                <ConfigRow label="Temperature" value="0.2" />
                <ConfigRow label="Vector Store" value="Supabase pgvector" />
              </dl>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
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
          <Icon className="h-4 w-4" />
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

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    register: { icon: UserPlus, color: BLUE },
    booking: { icon: CalendarCheck, color: TEAL },
    cancellation: { icon: CalendarX, color: ORANGE },
    urgent: { icon: AlertTriangle, color: RED },
    soap: { icon: FileText, color: PURPLE },
  };
  const m = map[type] ?? { icon: Activity, color: "#64748b" };
  const Icon = m.icon;
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${m.color}20` }}
    >
      <Icon className={cn("h-4 w-4")} />
    </div>
  );
}

function UrgentTable({
  rows,
  detailed = false,
}: {
  rows: Analytics["urgentToday"];
  detailed?: boolean;
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
            <th className="pb-2 pr-3">Time</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-800/50">
              {detailed && <td className="py-2 pr-3 text-slate-400">{i + 1}</td>}
              <td className="py-2 pr-3 font-medium text-slate-100">{r.name}</td>
              <td className="py-2 pr-3 text-slate-300">{r.symptom}</td>
              <td className="py-2 pr-3 text-slate-400">{r.time}</td>
              <td className="py-2">
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">
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

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-mono text-slate-200">{value}</dd>
    </div>
  );
}

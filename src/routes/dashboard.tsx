import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — MediFlow" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-3 text-muted-foreground">Coming soon.</p>
      </div>
    </div>
  );
}

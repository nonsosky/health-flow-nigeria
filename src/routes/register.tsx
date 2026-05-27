import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — MediFlow" }] }),
  component: Register,
});

function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">New patient registration</h1>
        <p className="mt-3 text-muted-foreground">Coming soon.</p>
        <Link to="/" className="mt-6 inline-block text-primary font-medium">← Back home</Link>
      </div>
    </div>
  );
}

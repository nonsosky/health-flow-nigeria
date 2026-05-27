import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MediFlow" }] }),
  component: Login,
});

function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-3 text-muted-foreground">Coming soon.</p>
        <Link to="/" className="mt-6 inline-block text-primary font-medium">← Back home</Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_LOGINS, DEMO_MODE } from "@/lib/demo";
import { createClient } from "@/lib/supabase/client";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function signIn(withEmail: string, withPassword: string, key: string) {
    setLoading(key);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: withEmail, password: withPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Signed in.");
      router.push(next);
      router.refresh();
    } catch {
      toast.error("Something went wrong while signing in.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void signIn(email, password, "form");
        }}
        className="mt-6 space-y-3"
      >
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        <Button className="w-full" type="submit" isLoading={loading === "form"} loadingText="Signing in…">
          Log in
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-primary underline">Create an account</Link>
      </p>

      {DEMO_MODE ? (
        <section className="mt-8 rounded-xl border border-border p-4" aria-labelledby="demo-logins">
          <h2 id="demo-logins" className="text-sm font-semibold">Demo accounts</h2>
          <p className="mt-1 text-xs text-muted-foreground">Sample data. The demo admin can&apos;t remove roles or change the shared demo logins.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {DEMO_LOGINS.map((d) => (
              <Button
                key={d.email}
                variant="secondary"
                size="sm"
                onClick={() => signIn(d.email, d.password, d.email)}
                isLoading={loading === d.email}
                loadingText="Signing in…"
              >
                {d.label}
              </Button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

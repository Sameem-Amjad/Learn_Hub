"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <form onSubmit={handleLogin} className="mt-6 space-y-3">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button className="w-full" type="submit" isLoading={loading} loadingText="Signing in...">
          Login
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
        alert("password"+ email+" "+password);
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        toast.error(loginError.message);
        return;
      }

      toast.success("Signed in successfully.");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong while signing in.");
    } finally {
      setLoading(false);
    }
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
        <Button className="w-full" type="submit" isLoading={loading} loadingText="Signing in...">
          Login
        </Button>
      </form>
    </div>
  );
}

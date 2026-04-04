"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`
      }
    });

    setMessage(error ? error.message : "Check your email to verify your account.");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-3xl font-bold">Create your LearnHub account</h1>
      <form onSubmit={handleSignup} className="mt-6 space-y-3">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          minLength={8}
          required
        />
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button className="w-full">Sign up</Button>
      </form>
    </div>
  );
}

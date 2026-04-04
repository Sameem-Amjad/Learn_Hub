"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Account created. Check your email to verify your account.");
    } catch {
      toast.error("Something went wrong while creating your account.");
    } finally {
      setLoading(false);
    }
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
        <Button className="w-full" type="submit" isLoading={loading} loadingText="Creating account...">
          Sign up
        </Button>
      </form>
    </div>
  );
}

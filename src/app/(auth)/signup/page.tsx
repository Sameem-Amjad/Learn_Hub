"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { APP_TAG } from "@/lib/supabase/schema";

/** Only same-site paths are followed after sign-up. */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

function SignupForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { app: APP_TAG, full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success("Welcome to LearnHub.");
        router.push(next);
        router.refresh();
      } else {
        setCheckEmail(true);
      }
    } catch {
      toast.error("Something went wrong while creating your account.");
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="mt-3 text-muted-foreground">We sent a link to {email}. Open it to finish creating your account.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-3xl font-bold">Create your LearnHub account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Free to join. Preview lessons are open straight away; a plan unlocks full courses.</p>
      <form onSubmit={handleSignup} className="mt-6 space-y-3">
        <label className="block space-y-1 text-sm">
          <span>Full name</span>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required maxLength={80} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
          <span className="text-xs text-muted-foreground">At least 8 characters.</span>
        </label>
        <Button className="w-full" type="submit" isLoading={loading} loadingText="Creating account…">
          Sign up
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already a member? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-primary underline">Log in</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

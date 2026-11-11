import Link from "next/link";
import { redirect } from "next/navigation";

import { getProfile, getSubscription } from "@/lib/server/learning-data";
import { getCurrentUser } from "@/lib/supabase/server";
import { STATUS_LABEL, TIER_LABEL, shortDate } from "@/lib/utils/format";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [profile, sub] = await Promise.all([getProfile(user.id), getSubscription(user.id)]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Settings</h1>
      <section className="mt-6 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Profile</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{profile?.full_name ?? "Not set"}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="break-all">{user.email}</dd>
          <dt className="text-muted-foreground">Member since</dt>
          <dd>{shortDate(profile?.created_at ?? user.created_at)}</dd>
        </dl>
      </section>
      <section className="mt-4 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Plan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {sub ? `${TIER_LABEL[sub.tier]} · ${STATUS_LABEL[sub.status] ?? sub.status}` : "No plan"}
        </p>
        <Link href="/settings/billing" className="mt-3 inline-block text-sm font-medium text-primary underline">
          Billing and plan
        </Link>
      </section>
    </div>
  );
}

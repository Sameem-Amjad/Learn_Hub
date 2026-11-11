import type { User } from "@supabase/supabase-js";

/**
 * Demo mode: no Stripe account is connected. Choosing a plan switches it on
 * straight away (no card, nothing charged) and the billing portal is replaced
 * by the plan details.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** The public demo logins, shown on the login page in demo mode. */
export const DEMO_LOGINS = [
  { label: "Learner (Pro plan)", email: "omar.khan@demo.learnhub.dev", password: "LearnHub@2026" },
  { label: "Admin", email: "demo.admin@demo.learnhub.dev", password: "LearnHub@2026" }
] as const;

/**
 * A demo admin (app_metadata.no_delete) has the full admin view, but can't
 * remove admin roles and can only change plans and roles of the seeded
 * sample learners, so visitors can't lock each other out or hand themselves
 * admin rights.
 */
export function isNoDeleteUser(user: Pick<User, "app_metadata"> | null | undefined): boolean {
  return Boolean(user?.app_metadata?.no_delete);
}

const SAMPLE_DOMAIN = "@demo.learnhub.dev";
const PROTECTED = new Set<string>(DEMO_LOGINS.map((l) => l.email));

/** Accounts a demo admin may change: seeded sample learners, not the public logins or visitors. */
export function isEditableByDemoAdmin(email: string | null | undefined): boolean {
  const e = (email ?? "").toLowerCase();
  return e.endsWith(SAMPLE_DOMAIN) && !PROTECTED.has(e);
}

export const DEMO_ADMIN_BLOCKED =
  "This demo admin can change the sample learners only, not the public demo logins or visitors' accounts.";

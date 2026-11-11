import { PricingPlans, type PlanInfo } from "@/components/marketing/PricingPlans";
import { DEMO_MODE } from "@/lib/demo";
import { getUserTier } from "@/lib/server/learning-data";
import { createServiceRoleClient, getCurrentUser } from "@/lib/supabase/server";
import { TIER_LABEL } from "@/lib/utils/format";
import { tierLevels } from "@/lib/utils/tier-comparison";
import type { SubscriptionTier } from "@/types/subscription";

export const metadata = { title: "Pricing · LearnHub" };

const PRICES: Record<SubscriptionTier, number> = { insider: 29, core: 79, pro: 199 };
const BLURB: Record<SubscriptionTier, string> = {
  insider: "Start with the foundations.",
  core: "Go deeper into how senior people work.",
  pro: "Everything, including the leadership track."
};

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const [{ course }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const supabase = createServiceRoleClient();
  const [tier, coursesRes, mediaRes] = await Promise.all([
    user ? getUserTier(user.id) : Promise.resolve(null),
    supabase.from("courses").select("title,slug,required_tier").eq("is_published", true).order("order_index"),
    supabase.from("media_library").select("title,type,required_tier").order("created_at")
  ]);

  const courses = (coursesRes.data ?? []) as { title: string; slug: string; required_tier: SubscriptionTier }[];
  const media = (mediaRes.data ?? []) as { title: string; type: string; required_tier: SubscriptionTier }[];
  const tiers: SubscriptionTier[] = ["insider", "core", "pro"];

  const plans: PlanInfo[] = tiers.map((t, i) => ({
    key: t,
    name: TIER_LABEL[t],
    monthly: PRICES[t],
    blurb: BLURB[t],
    features: [
      ...(i > 0 ? [`Everything in ${TIER_LABEL[tiers[i - 1]]}`] : ["Progress tracking and private notes"]),
      ...courses.filter((c) => c.required_tier === t).map((c) => `${c.title} course`),
      ...media.filter((m) => m.required_tier === t).map((m) => `${m.title} (${m.type === "audio" ? "audio" : m.type.toUpperCase()})`)
    ]
  }));

  const wanted = course ? courses.find((c) => c.slug === course) : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16">
      <h1 className="text-4xl font-bold">Choose your plan</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Each tier includes everything below it. Preview lessons stay free for every signed-in learner.
      </p>
      {wanted ? (
        <p role="status" className="mt-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          {wanted.title} needs the {TIER_LABEL[wanted.required_tier]} plan or higher.
        </p>
      ) : null}
      <PricingPlans
        plans={plans}
        currentTier={tier}
        signedIn={Boolean(user)}
        demoMode={DEMO_MODE}
        highlight={wanted?.required_tier ?? "core"}
        levels={tierLevels}
      />
    </div>
  );
}

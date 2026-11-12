/**
 * Whether a plan gives access right now.
 *
 * Stripe plans are kept current by Stripe's webhooks (a lapsed card moves
 * them to past_due, a cancellation to canceled), so their status decides.
 * Plans switched on without Stripe (an admin grant, or a demo-mode checkout)
 * have nothing to end them, so their end date is enforced here.
 */
export function planIsLive(
  sub: { status: string; current_period_end: string | null; stripe_subscription_id?: string | null } | null | undefined,
  now = Date.now()
): boolean {
  if (!sub || (sub.status !== "active" && sub.status !== "trialing")) return false;
  const withoutStripe = /^(manual|demo)_/.test(sub.stripe_subscription_id ?? "");
  if (withoutStripe && sub.current_period_end && new Date(sub.current_period_end).getTime() < now) return false;
  return true;
}

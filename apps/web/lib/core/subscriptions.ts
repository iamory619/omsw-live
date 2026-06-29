import type { Subscription } from "./types";

export function isSubscriptionExpired(subscription: Subscription | null) {
  if (!subscription) return true;

  if (subscription.plan === "owner") return false;
  if (subscription.plan === "pro") return subscription.status !== "active";
  if (subscription.plan === "premium") return subscription.status !== "active";

  if (!subscription.expires_at) return false;

  return new Date(subscription.expires_at).getTime() < Date.now();
}

export function getTrialDaysLeft(subscription: Subscription | null) {
  if (!subscription?.expires_at) return 0;

  const diff = new Date(subscription.expires_at).getTime() - Date.now();

  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export function getPlanLabel(subscription: Subscription | null) {
  if (!subscription) return "Trial";

  if (subscription.plan === "owner") return "Owner";
  if (subscription.plan === "premium") return "Premium";
  if (subscription.plan === "pro") return "Pro";

  return "Trial";
}

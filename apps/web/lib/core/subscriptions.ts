import type { Subscription } from "./types";

export function isSubscriptionExpired(subscription: Subscription | null): boolean {
  if (!subscription) return true;
  if (subscription.plan === "owner") return false;
  if (subscription.status !== "active") return true;

  if (subscription.expires_at) {
    return new Date(subscription.expires_at).getTime() < Date.now();
  }

  return false;
}

export function getTrialDaysLeft(subscription: Subscription | null): number {
  if (!subscription?.expires_at) return 0;

  const diff = new Date(subscription.expires_at).getTime() - Date.now();

  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

export function getPlanLabel(subscription: Subscription | null): string {
  switch (subscription?.plan) {
    case "owner":
      return "Owner";
    case "pro":
      return "Pro";
    case "creator":
      return "Creator";
    default:
      return "Free";
  }
}
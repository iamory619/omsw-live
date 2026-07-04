import type { Subscription } from "./types";

export function isSubscriptionExpired(subscription: Subscription | null) {
  if (!subscription) return true;

  if (subscription.plan === "owner") return false;

  if (subscription.status !== "active") return true;

  // Creator Trial มีวันหมดอายุ
  if (subscription.plan === "creator") {
    if (!subscription.expires_at) return false;

    return (
      new Date(subscription.expires_at).getTime() <
      Date.now()
    );
  }

  // Pro ไม่มีวันหมดอายุ
  if (subscription.plan === "pro") {
    return false;
  }

  // Free Trial
  if (!subscription.expires_at) return false;

  return (
    new Date(subscription.expires_at).getTime() <
    Date.now()
  );
}

export function getTrialDaysLeft(subscription: Subscription | null) {
  if (!subscription?.expires_at) return 0;

  const diff =
    new Date(subscription.expires_at).getTime() -
    Date.now();

  return Math.max(
    Math.ceil(diff / (1000 * 60 * 60 * 24)),
    0
  );
}

export function getPlanLabel(subscription: Subscription | null) {
  if (!subscription) return "Free";

  switch (subscription.plan) {
    case "creator":
      return "Creator";
    case "pro":
      return "Pro";
    case "owner":
      return "Owner";
    default:
      return "Free";
  }
}
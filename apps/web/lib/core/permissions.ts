import type { AppPlan, Subscription, WidgetDefinition } from "./types";
import { isSubscriptionExpired } from "./subscriptions";

const PLAN_LEVEL: Record<AppPlan, number> = {
  trial: 0,
  pro: 1,
  premium: 2,
  owner: 99,
};

export function canUsePlatform(subscription: Subscription | null) {
  if (!subscription) return false;
  if (subscription.plan === "owner") return true;

  return subscription.status === "active" && !isSubscriptionExpired(subscription);
}

export function canConnectTikTok(subscription: Subscription | null) {
  return canUsePlatform(subscription);
}

export function canCopyOverlay(subscription: Subscription | null) {
  return canUsePlatform(subscription);
}

export function canTestWidget(subscription: Subscription | null) {
  return canUsePlatform(subscription);
}

export function canResetWidget(subscription: Subscription | null) {
  return canUsePlatform(subscription);
}

export function canSaveWidgetSettings(subscription: Subscription | null) {
  return canUsePlatform(subscription);
}

export function canUseWidget(
  subscription: Subscription | null,
  widget: WidgetDefinition,
) {
  if (!subscription) return false;
  if (!canUsePlatform(subscription)) return false;

  const userLevel = PLAN_LEVEL[subscription.plan] ?? 0;
  const requiredLevel = PLAN_LEVEL[widget.requiredPlan] ?? 0;

  return userLevel >= requiredLevel;
}

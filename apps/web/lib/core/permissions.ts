import type { AppPlan, Subscription, WidgetDefinition } from "./types";
import { isSubscriptionExpired } from "./subscriptions";

const PLAN_LEVEL: Record<AppPlan, number> = {
  free: 0,
  creator: 1,
  pro: 2,
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

export type Feature =
  | "giftPopup"
  | "giftGoal"
  | "magicLantern"
  | "giftVehicle"
  | "giftBasket"
  | "fortuneReading"
  | "petWidget"
  | "obsOverlay"
  | "analytics"
  | "marketplace";

const permissions: Record<AppPlan, Record<Feature, boolean>> = {
  free: {
    giftPopup: true,
    giftGoal: true,
    magicLantern: false,
    giftVehicle: false,
    giftBasket: false,
    fortuneReading: false,
    petWidget: false,
    obsOverlay: true,
    analytics: false,
    marketplace: false,
  },

  creator: {
    giftPopup: true,
    giftGoal: true,
    magicLantern: true,
    giftVehicle: true,
    giftBasket: true,
    fortuneReading: true,
    petWidget: true,
    obsOverlay: true,
    analytics: false,
    marketplace: false,
  },

  pro: {
    giftPopup: true,
    giftGoal: true,
    magicLantern: true,
    giftVehicle: true,
    giftBasket: true,
    fortuneReading: true,
    petWidget: true,
    obsOverlay: true,
    analytics: true,
    marketplace: true,
  },

  owner: {
    giftPopup: true,
    giftGoal: true,
    magicLantern: true,
    giftVehicle: true,
    giftBasket: true,
    fortuneReading: true,
    petWidget: true,
    obsOverlay: true,
    analytics: true,
    marketplace: true,
  },
};

export function canUse(plan: AppPlan, feature: Feature) {
  return permissions[plan][feature];
}
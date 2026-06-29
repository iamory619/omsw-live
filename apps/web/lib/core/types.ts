export type AppPlan = "trial" | "pro" | "premium" | "owner";
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "past_due";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  tiktok_username: string | null;
  overlay_id: string;
  created_at?: string;
};

export type Subscription = {
  id?: string;
  user_id: string;
  plan: AppPlan;
  status: SubscriptionStatus;
  started_at?: string;
  expires_at: string | null;
  created_at?: string;
};

export type WidgetSettings = {
  user_id: string;
  basket: string;
  vehicle: string;
  lantern: string;
  gift_goal_enabled: boolean;
  basket_enabled: boolean;
  vehicle_enabled: boolean;
  lantern_enabled: boolean;
  fortune_enabled: boolean;
};

export type WidgetPlan = "trial" | "pro" | "premium";

export type WidgetDefinition = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: "alert" | "animation" | "game" | "fortune" | "pet";
  requiredPlan: WidgetPlan;
  path: string;
  testEvent: string;
  resetEvent: string;
  enabled: boolean;
  comingSoon?: boolean;
};

export const APP_MODE =
  process.env.NEXT_PUBLIC_APP_MODE === "production"
    ? "production"
    : "development";

export const isDevelopmentMode = APP_MODE === "development";

export const FEATURES = {
  developerTools:
    process.env.NEXT_PUBLIC_FEATURE_DEVELOPER_TOOLS !== "false",
  analytics:
    process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === "true",
  marketplace:
    process.env.NEXT_PUBLIC_FEATURE_MARKETPLACE === "true",
  admin:
    process.env.NEXT_PUBLIC_FEATURE_ADMIN === "true",
  billing:
    process.env.NEXT_PUBLIC_FEATURE_BILLING !== "false",
};

export type AppPlan = "trial" | "pro" | "premium" | "owner";

export function canUseByPlan(plan: string | null | undefined, trialExpired: boolean) {
  if (plan === "owner") return true;
  if (plan === "pro") return true;
  if (plan === "premium") return true;
  if (plan === "trial") return !trialExpired;

  return false;
}

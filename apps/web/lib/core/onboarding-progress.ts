import type { SupabaseClient } from "@supabase/supabase-js";
import type { OnboardingStep } from "./onboarding";

export async function saveOnboardingStep(
  supabase: SupabaseClient,
  userId: string,
  step: OnboardingStep,
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_step: step,
      onboarding_completed: step === "finish",
    })
    .eq("id", userId);

  if (error) {
    console.error("Save onboarding step error:", error);
    throw error;
  }
}

export function getOnboardingHref(step?: string | null) {
  switch (step) {
    case "connect":
      return "/onboarding/connect";
    case "overlay":
      return "/onboarding/overlay";
    case "test":
      return "/onboarding/test";
    case "finish":
      return "/dashboard";
    case "creator":
    default:
      return "/dashboard";
  }
}
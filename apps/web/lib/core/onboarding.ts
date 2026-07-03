export type OnboardingStep =
  | "creator"
  | "connect"
  | "overlay"
  | "test"
  | "finish";

export const ONBOARDING_STEPS: {
  id: OnboardingStep;
  label: string;
  href: string;
}[] = [
  { id: "creator", label: "Creator", href: "/onboarding/creator" },
  { id: "connect", label: "Connect", href: "/onboarding/connect" },
  { id: "overlay", label: "Overlay", href: "/onboarding/overlay" },
  { id: "test", label: "Test", href: "/onboarding/test" },
  { id: "finish", label: "Finish", href: "/onboarding/finish" },
];

export function getNextOnboardingStep(step: OnboardingStep) {
  const index = ONBOARDING_STEPS.findIndex((item) => item.id === step);
  return ONBOARDING_STEPS[index + 1] || ONBOARDING_STEPS.at(-1)!;
}
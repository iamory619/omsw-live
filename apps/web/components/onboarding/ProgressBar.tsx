import type { OnboardingStep } from "@/lib/core/onboarding";
import { ONBOARDING_STEPS } from "@/lib/core/onboarding";

type Props = {
  currentStep: OnboardingStep;
};

export function ProgressBar({ currentStep }: Props) {
  const currentIndex = ONBOARDING_STEPS.findIndex(
    (step) => step.id === currentStep,
  );

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between text-xs font-black text-zinc-500">
        <span>
          Step {currentIndex + 1} / {ONBOARDING_STEPS.length}
        </span>
        <span>{Math.round(((currentIndex + 1) / ONBOARDING_STEPS.length) * 100)}%</span>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        {ONBOARDING_STEPS.map((step, index) => {
          const active = index <= currentIndex;

          return (
            <div
              key={step.id}
              className={`h-2 rounded-full ${
                active ? "bg-pink-500" : "bg-zinc-800"
              }`}
              title={step.label}
            />
          );
        })}
      </div>
    </div>
  );
}
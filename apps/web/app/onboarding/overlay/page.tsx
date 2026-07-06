import { StepFooter } from "@/components/onboarding/StepFooter";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";

export default function OverlayStepPage() {
  return (
    <>
      <StepHeader
        icon="🖥️"
        step="Step 3"
        title="Set Up Your OBS Overlay"
        description="You can copy your OBS overlay links after finishing setup."
      />

      <WizardCard>
        <div className="rounded-2xl bg-zinc-900 p-6">
          <h3 className="text-xl font-black text-white">
            How to Add Your Overlay
          </h3>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            <li>Finish this setup first.</li>
            <li>Go to Dashboard.</li>
            <li>Open OBS Overlays.</li>
            <li>Copy your overlay URL.</li>
            <li>Paste it into OBS Browser Source.</li>
          </ol>
        </div>

        <StepFooter
          backHref="/onboarding/connect"
          nextHref="/onboarding/test"
        />
      </WizardCard>
    </>
  );
}
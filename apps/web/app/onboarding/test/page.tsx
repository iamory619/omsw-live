import { StepFooter } from "@/components/onboarding/StepFooter";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";
import { Button } from "@/components/ui/Button";

export default function TestStepPage() {
  return (
    <>
      <StepHeader
        icon="🎁"
        step="Step 4"
        title="Test Your Widgets"
        description="Send a test event to make sure your OMSW Live overlay appears correctly before going live."
      />

      <WizardCard>
        <div className="rounded-2xl bg-zinc-900 p-6">
          <h3 className="text-xl font-black text-white">
            Run a Quick Test
          </h3>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            <li>Open the Live Widgets page.</li>
            <li>Choose Gift Goal or another widget.</li>
            <li>Click the Test button.</li>
            <li>Make sure the overlay appears in OBS Studio.</li>
          </ol>

          <Button
            href="/dashboard/widgets"
            variant="upgrade"
            className="mt-6"
          >
            Open Live Widgets
          </Button>
        </div>

        <StepFooter
          backHref="/onboarding/overlay"
          nextHref="/onboarding/finish"
          nextLabel="Finish Setup →"
        />
      </WizardCard>
    </>
  );
}
import { StepFooter } from "@/components/onboarding/StepFooter";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";

export default function TestStepPage() {
  return (
    <>
      <StepHeader
        icon="🎁"
        step="Step 4"
        title="Test Your Widgets"
        description="After completing setup, you can test your OMSW Live widgets from the Dashboard."
      />

      <WizardCard>
        <div className="rounded-2xl bg-zinc-900 p-6">
          <h3 className="text-xl font-black text-white">
            You're Almost Ready!
          </h3>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            <li>Complete the onboarding process.</li>
            <li>Open your Dashboard.</li>
            <li>Go to Live Widgets.</li>
            <li>Connect your TikTok LIVE.</li>
            <li>Click Test to verify everything works.</li>
          </ol>
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
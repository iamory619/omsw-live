import { StepFooter } from "@/components/onboarding/StepFooter";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";
import { Button } from "@/components/ui/Button";

export default function ConnectStepPage() {
  return (
    <>
      <StepHeader
        icon="📱"
        step="Step 2"
        title="Connect TikTok LIVE"
        description="Start your TikTok LIVE first, then connect OMSW Live using the Live Widgets page."
      />

      <WizardCard>
        <div className="rounded-2xl bg-zinc-900 p-6">
          <h3 className="text-xl font-black text-white">How to Connect</h3>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            <li>Start your TikTok LIVE.</li>
            <li>Open the Live Widgets page.</li>
            <li>Make sure your Creator Username is configured.</li>
            <li>Click the Connect button.</li>
            <li>Wait until OMSW Live shows "Connected".</li>
          </ol>

          <Button href="/dashboard/widgets" variant="upgrade" className="mt-6">
            Open Live Widgets
          </Button>
        </div>

        <StepFooter
          backHref="/onboarding/creator"
          nextHref="/onboarding/overlay"
        />
      </WizardCard>
    </>
  );
}
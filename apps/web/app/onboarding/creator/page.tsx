import { StepFooter } from "@/components/onboarding/StepFooter";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";
import { Button } from "@/components/ui/Button";

export default function CreatorStepPage() {
  return (
    <>
      <StepHeader
        icon="👤"
        step="Step 1"
        title="Set Your Creator Username"
        description="Add your TikTok LIVE username so OMSW Live knows which live account to connect to."
      />

      <WizardCard>
        <div className="rounded-2xl bg-zinc-900 p-6">
          <div className="font-black text-white">Where to set it</div>

          <div className="mt-2 text-sm text-zinc-400">
            Go to My Profile and enter your TikTok LIVE username.
          </div>

          <Button href="/profile" variant="upgrade" className="mt-5">
            Open My Profile
          </Button>
        </div>

        <StepFooter nextHref="/onboarding/connect" />
      </WizardCard>
    </>
  );
}
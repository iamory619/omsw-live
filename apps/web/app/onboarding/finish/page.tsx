"use client";

import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";
import { Button } from "@/components/ui/Button";

export default function FinishStepPage() {
  return (
    <>
      <StepHeader
        icon="🎉"
        step="Complete"
        title="You're Ready to Go Live!"
        description="Your OMSW Live setup is complete. You can now start streaming with widgets and OBS overlays."
      />

      <WizardCard>
        <div className="rounded-2xl bg-pink-500/10 p-8 text-center">
          <div className="text-6xl">🎊</div>

          <h3 className="mt-4 text-3xl font-black text-pink-200">
            Congratulations!
          </h3>

          <p className="mx-auto mt-4 max-w-xl text-zinc-300">
            Your Creator Account, TikTok LIVE connection, OBS Overlay, and
            widget setup are complete.
          </p>

          <div className="mt-8 rounded-2xl border border-pink-500/30 bg-black/30 p-5 text-left">
            <div className="font-black text-white">What's Next?</div>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
              <li>Go to Login.</li>
              <li>Sign in to your account.</li>
              <li>Open Dashboard, Live Widgets, or OBS Overlays.</li>
              <li>Enjoy your live stream!</li>
            </ul>
          </div>

          <div className="mt-8 flex justify-center">
            <Button href="/login" variant="upgrade">
              Go to Login
            </Button>
          </div>
        </div>
      </WizardCard>
    </>
  );
}
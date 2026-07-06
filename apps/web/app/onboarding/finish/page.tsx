"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { saveOnboardingStep } from "@/lib/core/onboarding-progress";

export default function FinishStepPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  const completeOnboarding = async (href: string) => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login");
        return;
      }

      await saveOnboardingStep(supabase, session.user.id, "finish");

      window.location.href = href;
    } catch (error) {
      console.error("Complete onboarding error:", error);
      alert("Unable to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              <li>Start your TikTok LIVE.</li>
              <li>Connect OMSW Live from the Live Widgets page.</li>
              <li>Open OBS Studio with your overlay.</li>
              <li>Enjoy your live stream!</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => completeOnboarding("/dashboard")}
              disabled={loading}
              variant="upgrade"
            >
              {loading ? "Finishing setup..." : "Open Dashboard"}
            </Button>

            <Button
              onClick={() => completeOnboarding("/dashboard/widgets")}
              disabled={loading}
              variant="secondary"
            >
              Open Live Widgets
            </Button>
          </div>
        </div>
      </WizardCard>
    </>
  );
}
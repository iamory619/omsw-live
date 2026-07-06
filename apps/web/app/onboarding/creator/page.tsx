"use client";

import { useState } from "react";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { saveOnboardingStep } from "@/lib/core/onboarding-progress";

export default function CreatorStepPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const goNext = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    await saveOnboardingStep(supabase, session.user.id, "connect");
    window.location.href = "/onboarding/connect";
  };

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

        <div className="mt-6 flex justify-end">
          <button
            onClick={goNext}
            disabled={loading}
            className="rounded-xl bg-pink-600 px-5 py-3 font-black transition hover:bg-pink-500 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Next →"}
          </button>
        </div>
      </WizardCard>
    </>
  );
}
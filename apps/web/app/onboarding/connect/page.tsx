"use client";

import { useState } from "react";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { saveOnboardingStep } from "@/lib/core/onboarding-progress";

export default function ConnectStepPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const next = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    await saveOnboardingStep(supabase, session.user.id, "overlay");
    window.location.href = "/onboarding/overlay";
  };

  const back = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    await saveOnboardingStep(supabase, session.user.id, "creator");
    window.location.href = "/onboarding/creator";
  };

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
          <h3 className="text-xl font-black text-white">
            How to Connect
          </h3>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            <li>Start your TikTok LIVE.</li>
            <li>Open the Live Widgets page.</li>
            <li>Make sure your Creator Username is configured.</li>
            <li>Click the Connect button.</li>
            <li>Wait until OMSW Live shows "Connected".</li>
          </ol>

          <Button
            href="/dashboard/widgets"
            variant="upgrade"
            className="mt-6"
          >
            Open Live Widgets
          </Button>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={back}
            disabled={loading}
            className="rounded-xl bg-zinc-700 px-5 py-3 font-black transition hover:bg-zinc-600 disabled:opacity-60"
          >
            ← Back
          </button>

          <button
            onClick={next}
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
"use client";

import { useState } from "react";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function FinishStepPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const completeOnboarding = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("Session not found. Please login again.");
      window.location.href = "/login";
      return;
    }

    const res = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      alert(data.error || "Unable to complete setup.");
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <>
      <StepHeader
        icon="🎉"
        step="Complete"
        title="You're Ready to Go Live!"
        description="Your OMSW Live setup is complete."
      />

      <WizardCard>
        <div className="rounded-2xl bg-pink-500/10 p-8 text-center">
          <div className="text-6xl">🎊</div>

          <h3 className="mt-4 text-3xl font-black text-pink-200">
            Congratulations!
          </h3>

          <p className="mx-auto mt-4 max-w-xl text-zinc-300">
            Your setup is complete. Click below to finish and open your dashboard.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={completeOnboarding}
              disabled={loading}
              variant="upgrade"
            >
              {loading ? "Finishing..." : "Finish & Open Dashboard"}
            </Button>
          </div>
        </div>
      </WizardCard>
    </>
  );
}
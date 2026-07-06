"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { saveOnboardingStep } from "@/lib/core/onboarding-progress";
import type { OnboardingStep } from "@/lib/core/onboarding";

type Props = {
  backHref?: string;
  nextHref?: string;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
};

function hrefToStep(href?: string): OnboardingStep | null {
  if (href === "/onboarding/creator") return "creator";
  if (href === "/onboarding/connect") return "connect";
  if (href === "/onboarding/overlay") return "overlay";
  if (href === "/onboarding/test") return "test";
  if (href === "/onboarding/finish") return "finish";
  return null;
}

export function StepFooter({
  backHref,
  nextHref,
  nextLabel = "Continue →",
  backLabel = "← Back",
  nextDisabled = false,
}: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const goTo = async (href?: string) => {
    if (!href || loading) return;

    try {
      setLoading(true);

      const step = hrefToStep(href);

      if (step) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          window.location.href = "/login";
          return;
        }

        await saveOnboardingStep(supabase, session.user.id, step);
      }

      window.location.href = href;
    } catch (error) {
      console.error("Save onboarding step error:", error);
      alert("Unable to save onboarding progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
      {backHref ? (
        <Button
          onClick={() => goTo(backHref)}
          disabled={loading}
          variant="secondary"
        >
          {backLabel}
        </Button>
      ) : (
        <div />
      )}

      {nextHref ? (
        <Button
          onClick={() => goTo(nextHref)}
          disabled={loading || nextDisabled}
          variant="upgrade"
          className={nextDisabled ? "pointer-events-none opacity-50" : ""}
        >
          {loading ? "Saving..." : nextLabel}
        </Button>
      ) : null}
    </div>
  );
}
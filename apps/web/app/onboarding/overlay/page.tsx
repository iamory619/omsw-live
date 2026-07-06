"use client";

import { useState } from "react";
import { StepFooter } from "@/components/onboarding/StepFooter";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { WizardCard } from "@/components/onboarding/WizardCard";

export default function OverlayStepPage() {
  const [loading, setLoading] = useState(false);

  const openOverlays = () => {
    setLoading(true);
    window.location.href = "/dashboard/overlays";
  };

  return (
    <>
      <StepHeader
        icon="🖥️"
        step="Step 3"
        title="Set Up Your OBS Overlay"
        description="Copy your OMSW Live overlay URL and add it as a Browser Source in OBS Studio."
      />

      <WizardCard>
        <div className="rounded-2xl bg-zinc-900 p-6">
          <h3 className="text-xl font-black text-white">
            How to Add Your Overlay
          </h3>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            <li>Open OBS Studio.</li>
            <li>Add a new Browser Source.</li>
            <li>Copy your OMSW Live overlay URL.</li>
            <li>Paste the URL into the Browser Source settings.</li>
            <li>
              Click <strong>OK</strong> to save.
            </li>
          </ol>

          <button
            type="button"
            onClick={openOverlays}
            disabled={loading}
            className="mt-6 rounded-xl bg-pink-600 px-5 py-3 font-black transition hover:bg-pink-500 disabled:opacity-60"
          >
            {loading ? "Opening..." : "Open OBS Overlays"}
          </button>
        </div>

        <StepFooter
          backHref="/onboarding/connect"
          nextHref="/onboarding/test"
        />
      </WizardCard>
    </>
  );
}
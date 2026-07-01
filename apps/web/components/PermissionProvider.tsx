"use client";

import { createContext, useContext } from "react";
import type { Subscription } from "@/lib/core/types";
import type { Feature } from "@/lib/core/permissions";
import { canUse } from "@/lib/core/permissions";

type PermissionContextValue = {
  subscription: Subscription | null;
  canUseFeature: (feature: Feature) => boolean;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

type Props = {
  subscription: Subscription | null;
  children: React.ReactNode;
};

export function PermissionProvider({ subscription, children }: Props) {
  const plan = subscription?.plan || "trial";

  const canUseFeature = (feature: Feature) => {
    return canUse(plan, feature);
  };

  return (
    <PermissionContext.Provider
      value={{
        subscription,
        canUseFeature,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error("usePermission must be used inside PermissionProvider");
  }

  return context;
}
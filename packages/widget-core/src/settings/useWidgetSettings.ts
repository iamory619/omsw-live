"use client";

import { useCallback, useEffect, useState } from "react";
import type { WidgetSettingsState } from "../types";

type UseWidgetSettingsOptions<TSettings> = {
  endpoint: string;
  fallback: TSettings;
  enabled?: boolean;
  transform?: (data: unknown) => TSettings;
};

export function useWidgetSettings<TSettings>({
  endpoint,
  fallback,
  enabled = true,
  transform,
}: UseWidgetSettingsOptions<TSettings>): WidgetSettingsState<TSettings> {
  const [settings, setSettings] = useState<TSettings>(fallback);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !endpoint) {
      setSettings(fallback);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(endpoint, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load widget settings (${response.status})`,
        );
      }

      const data: unknown = await response.json();
      const nextSettings = transform
        ? transform(data)
        : ({ ...fallback, ...(data as object) } as TSettings);

      setSettings(nextSettings);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load widget settings.";

      setError(message);
      setSettings(fallback);
    } finally {
      setLoading(false);
    }
  }, [enabled, endpoint, fallback, transform]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    settings,
    loading,
    error,
    reload,
  };
}

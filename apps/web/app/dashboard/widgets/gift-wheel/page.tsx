"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

type WheelTheme =
  | "classic"
  | "neon"
  | "casino"
  | "japanese"
  | "christmas"
  | "halloween";

type WheelSettings = {
  id: string;
  user_id: string;
  gift_per_spin: number;
  theme: WheelTheme;
  tick_sound_enabled: boolean;
  confetti_enabled: boolean;
  stop_burst_enabled: boolean;
  jackpot_enabled: boolean;
};

type WheelReward = {
  id: string;
  setting_id: string;
  emoji: string;
  label: string;
  weight: number;
  color: string;
  is_jackpot: boolean;
  is_enabled: boolean;
  sort_order: number;
};

type EditableReward = WheelReward & {
  isNew?: boolean;
};

const DEFAULT_REWARDS: Omit<
  EditableReward,
  "id" | "setting_id" | "sort_order"
>[] = [
  {
    emoji: "😊",
    label: "Happy Face",
    weight: 24,
    color: "#ec4899",
    is_jackpot: false,
    is_enabled: true,
  },
  {
    emoji: "💃",
    label: "Dance 10 sec",
    weight: 20,
    color: "#8b5cf6",
    is_jackpot: false,
    is_enabled: true,
  },
  {
    emoji: "🎤",
    label: "Sing a Song",
    weight: 18,
    color: "#06b6d4",
    is_jackpot: false,
    is_enabled: true,
  },
  {
    emoji: "🎁",
    label: "Mystery Gift",
    weight: 16,
    color: "#f59e0b",
    is_jackpot: false,
    is_enabled: true,
  },
  {
    emoji: "😂",
    label: "Funny Face",
    weight: 14,
    color: "#22c55e",
    is_jackpot: false,
    is_enabled: true,
  },
  {
    emoji: "⭐",
    label: "JACKPOT",
    weight: 8,
    color: "#ef4444",
    is_jackpot: true,
    is_enabled: true,
  },
];

const THEMES: { id: WheelTheme; name: string }[] = [
  { id: "classic", name: "Classic" },
  { id: "neon", name: "Neon" },
  { id: "casino", name: "Casino" },
  { id: "japanese", name: "Japanese" },
  { id: "christmas", name: "Christmas" },
  { id: "halloween", name: "Halloween" },
];

function temporaryId() {
  return `temp-${crypto.randomUUID()}`;
}

export default function GiftWheelSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  const [settings, setSettings] = useState<WheelSettings | null>(null);
  const [rewards, setRewards] = useState<EditableReward[]>([]);
  const [message, setMessage] = useState("");

  const totalWeight = useMemo(
    () =>
      rewards
        .filter((reward) => reward.is_enabled)
        .reduce(
          (sum, reward) => sum + Math.max(0, Number(reward.weight) || 0),
          0,
        ),
    [rewards],
  );

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      let { data: settingData, error: settingError } = await supabase
        .from("gift_wheel_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settingError) {
        console.error("Load gift wheel settings error:", settingError);
        setMessage("Unable to load Gift Wheel settings.");
        setLoading(false);
        return;
      }

      if (!settingData) {
        const { data: createdSetting, error: createSettingError } =
          await supabase
            .from("gift_wheel_settings")
            .insert({
              user_id: user.id,
              gift_per_spin: 10,
              theme: "classic",
              tick_sound_enabled: true,
              confetti_enabled: true,
              stop_burst_enabled: true,
              jackpot_enabled: true,
            })
            .select("*")
            .single();

        if (createSettingError || !createdSetting) {
          console.error(
            "Create gift wheel settings error:",
            createSettingError,
          );
          setMessage("Unable to create Gift Wheel settings.");
          setLoading(false);
          return;
        }

        settingData = createdSetting;
      }

      setSettings(settingData as WheelSettings);

      const { data: rewardData, error: rewardError } = await supabase
        .from("gift_wheel_rewards")
        .select("*")
        .eq("setting_id", settingData.id)
        .order("sort_order", { ascending: true });

      if (rewardError) {
        console.error("Load wheel rewards error:", rewardError);
        setMessage("Unable to load Wheel rewards.");
        setLoading(false);
        return;
      }

      if (!rewardData || rewardData.length === 0) {
        const defaultRows = DEFAULT_REWARDS.map((reward, index) => ({
          setting_id: settingData.id,
          ...reward,
          sort_order: index,
        }));

        const { data: createdRewards, error: createRewardsError } =
          await supabase
            .from("gift_wheel_rewards")
            .insert(defaultRows)
            .select("*");

        if (createRewardsError) {
          console.error(
            "Create default wheel rewards error:",
            createRewardsError,
          );
          setMessage("Unable to create default Wheel rewards.");
          setLoading(false);
          return;
        }

        setRewards((createdRewards ?? []) as EditableReward[]);
      } else {
        setRewards(rewardData as EditableReward[]);
      }

      setLoading(false);
    };

    void loadSettings();
  }, [router, supabase]);

  const updateSetting = <K extends keyof WheelSettings>(
    key: K,
    value: WheelSettings[K],
  ) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    );
  };

  const updateReward = <K extends keyof EditableReward>(
    id: string,
    key: K,
    value: EditableReward[K],
  ) => {
    setRewards((current) =>
      current.map((reward) =>
        reward.id === id
          ? {
              ...reward,
              [key]: value,
            }
          : reward,
      ),
    );
  };

  const addReward = () => {
    if (!settings) return;

    setRewards((current) => [
      ...current,
      {
        id: temporaryId(),
        setting_id: settings.id,
        emoji: "🎁",
        label: "New Reward",
        weight: 10,
        color: "#ec4899",
        is_jackpot: false,
        is_enabled: true,
        sort_order: current.length,
        isNew: true,
      },
    ]);
  };

  const removeReward = async (reward: EditableReward) => {
    if (rewards.length <= 2) {
      setMessage("The wheel must have at least 2 rewards.");
      return;
    }

    if (!reward.isNew) {
      const { error } = await supabase
        .from("gift_wheel_rewards")
        .delete()
        .eq("id", reward.id);

      if (error) {
        console.error("Delete wheel reward error:", error);
        setMessage("Unable to delete this reward.");
        return;
      }
    }

    setRewards((current) =>
      current
        .filter((item) => item.id !== reward.id)
        .map((item, index) => ({
          ...item,
          sort_order: index,
        })),
    );
  };

  const moveReward = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= rewards.length) return;

    setRewards((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

      return next.map((reward, rewardIndex) => ({
        ...reward,
        sort_order: rewardIndex,
      }));
    });
  };

  const saveSettings = async () => {
    if (!settings || !userId) return;

    if (rewards.length < 2) {
      setMessage("Please keep at least 2 rewards.");
      return;
    }

    if (rewards.some((reward) => !reward.label.trim())) {
      setMessage("Every reward needs a name.");
      return;
    }

    if (totalWeight <= 0) {
      setMessage("The total weight must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const { error: settingError } = await supabase
        .from("gift_wheel_settings")
        .update({
          gift_per_spin: Math.max(1, Number(settings.gift_per_spin) || 1),
          theme: settings.theme,
          tick_sound_enabled: settings.tick_sound_enabled,
          confetti_enabled: settings.confetti_enabled,
          stop_burst_enabled: settings.stop_burst_enabled,
          jackpot_enabled: settings.jackpot_enabled,
        })
        .eq("id", settings.id)
        .eq("user_id", userId);

      if (settingError) {
        throw settingError;
      }

      const existingRewards = rewards.filter((reward) => !reward.isNew);
      const newRewards = rewards.filter((reward) => reward.isNew);

      for (const reward of existingRewards) {
        const { error } = await supabase
          .from("gift_wheel_rewards")
          .update({
            emoji: reward.emoji.trim() || "🎁",
            label: reward.label.trim(),
            weight: Math.max(0, Number(reward.weight) || 0),
            color: reward.color,
            is_jackpot: reward.is_jackpot,
            is_enabled: reward.is_enabled,
            sort_order: reward.sort_order,
          })
          .eq("id", reward.id)
          .eq("setting_id", settings.id);

        if (error) throw error;
      }

      if (newRewards.length > 0) {
        const { data: insertedRewards, error } = await supabase
          .from("gift_wheel_rewards")
          .insert(
            newRewards.map((reward) => ({
              setting_id: settings.id,
              emoji: reward.emoji.trim() || "🎁",
              label: reward.label.trim(),
              weight: Math.max(0, Number(reward.weight) || 0),
              color: reward.color,
              is_jackpot: reward.is_jackpot,
              is_enabled: reward.is_enabled,
              sort_order: reward.sort_order,
            })),
          )
          .select("*");

        if (error) throw error;

        const insertedByOrder = new Map<number, EditableReward>(
          ((insertedRewards ?? []) as EditableReward[]).map(
            (reward: EditableReward) => [reward.sort_order, reward],
          ),
        );

        setRewards((current) =>
          current.map((reward) => {
            if (!reward.isNew) return reward;

            const inserted = insertedByOrder.get(reward.sort_order);

            return inserted ? (inserted as EditableReward) : reward;
          }),
        );
      }

      setMessage("Gift Wheel settings saved successfully.");
    } catch (error) {
      console.error("Save Gift Wheel settings error:", error);
      setMessage("Unable to save Gift Wheel settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white lg:p-8">
        <div className="mx-auto max-w-5xl">
          <LoadingCard />
        </div>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Card>
            <div className="text-xl font-black">Gift Wheel unavailable</div>
            <p className="mt-2 text-sm text-zinc-400">{message}</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <SectionHeader
            badge="Widget Settings"
            title="🎡 Gift Jackpot Wheel"
            description="Customize spins, rewards, chances and visual effects."
          />

          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard">Back to Dashboard</Button>
            <Button
              onClick={() => void saveSettings()}
              disabled={saving}
              variant="upgrade"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm font-bold text-zinc-200">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-black">Spin Rules</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Gifts are accumulated. Every completed threshold creates one
                spin.
              </p>

              <label className="mt-5 block">
                <span className="text-sm font-bold text-zinc-300">
                  Gifts per spin
                </span>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={settings.gift_per_spin}
                  onChange={(event) =>
                    updateSetting(
                      "gift_per_spin",
                      Math.max(1, Number(event.target.value) || 1),
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold outline-none focus:border-pink-500"
                />
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-bold text-zinc-300">Theme</span>
                <select
                  value={settings.theme}
                  onChange={(event) =>
                    updateSetting("theme", event.target.value as WheelTheme)
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold outline-none focus:border-pink-500"
                >
                  {THEMES.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </label>
            </Card>

            <Card>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black">Reward List</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Higher weight means the reward is more likely to be
                    selected.
                  </p>
                </div>

                <Button onClick={addReward}>+ Add Reward</Button>
              </div>

              <div className="mt-6 space-y-4">
                {rewards.map((reward, index) => {
                  const chance =
                    totalWeight > 0 && reward.is_enabled
                      ? (Math.max(0, Number(reward.weight) || 0) /
                          totalWeight) *
                        100
                      : 0;

                  return (
                    <div
                      key={reward.id}
                      className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[72px_1fr_120px_92px]">
                        <label>
                          <span className="text-xs font-bold text-zinc-400">
                            Emoji
                          </span>
                          <input
                            value={reward.emoji}
                            maxLength={32}
                            onChange={(event) =>
                              updateReward(
                                reward.id,
                                "emoji",
                                event.target.value,
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-center text-2xl outline-none focus:border-pink-500"
                          />
                        </label>

                        <label>
                          <span className="text-xs font-bold text-zinc-400">
                            Reward name
                          </span>
                          <input
                            value={reward.label}
                            maxLength={80}
                            onChange={(event) =>
                              updateReward(
                                reward.id,
                                "label",
                                event.target.value,
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 font-bold outline-none focus:border-pink-500"
                          />
                        </label>

                        <label>
                          <span className="text-xs font-bold text-zinc-400">
                            Weight
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="0.1"
                            value={reward.weight}
                            onChange={(event) =>
                              updateReward(
                                reward.id,
                                "weight",
                                Math.max(0, Number(event.target.value) || 0),
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 font-bold outline-none focus:border-pink-500"
                          />
                        </label>

                        <label>
                          <span className="text-xs font-bold text-zinc-400">
                            Color
                          </span>
                          <input
                            type="color"
                            value={reward.color}
                            onChange={(event) =>
                              updateReward(
                                reward.id,
                                "color",
                                event.target.value,
                              )
                            }
                            className="mt-2 h-[50px] w-full cursor-pointer rounded-xl border border-zinc-700 bg-zinc-950 p-2"
                          />
                        </label>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-bold">
                          <input
                            type="checkbox"
                            checked={reward.is_enabled}
                            onChange={(event) =>
                              updateReward(
                                reward.id,
                                "is_enabled",
                                event.target.checked,
                              )
                            }
                          />
                          Enabled
                        </label>

                        <label className="flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-bold">
                          <input
                            type="checkbox"
                            checked={reward.is_jackpot}
                            disabled={!settings.jackpot_enabled}
                            onChange={(event) =>
                              updateReward(
                                reward.id,
                                "is_jackpot",
                                event.target.checked,
                              )
                            }
                          />
                          Jackpot
                        </label>

                        <span className="rounded-xl bg-pink-500/15 px-3 py-2 text-sm font-black text-pink-200">
                          Chance {chance.toFixed(1)}%
                        </span>

                        <div className="ml-auto flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveReward(index, -1)}
                            disabled={index === 0}
                            className="rounded-lg bg-zinc-800 px-3 py-2 font-black disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveReward(index, 1)}
                            disabled={index === rewards.length - 1}
                            className="rounded-lg bg-zinc-800 px-3 py-2 font-black disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeReward(reward)}
                            disabled={rewards.length <= 2}
                            className="rounded-lg bg-red-600 px-3 py-2 font-black disabled:opacity-30"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-black">Effects</h2>

              <div className="mt-5 space-y-3">
                <ToggleRow
                  label="Tick Sound"
                  description="Play a tick as the wheel passes each segment."
                  checked={settings.tick_sound_enabled}
                  onChange={(checked) =>
                    updateSetting("tick_sound_enabled", checked)
                  }
                />

                <ToggleRow
                  label="Confetti"
                  description="Show confetti after the result appears."
                  checked={settings.confetti_enabled}
                  onChange={(checked) =>
                    updateSetting("confetti_enabled", checked)
                  }
                />

                <ToggleRow
                  label="Stop Burst"
                  description="Add a bright bounce when the wheel stops."
                  checked={settings.stop_burst_enabled}
                  onChange={(checked) =>
                    updateSetting("stop_burst_enabled", checked)
                  }
                />

                <ToggleRow
                  label="Jackpot Mode"
                  description="Allow rewards marked as Jackpot."
                  checked={settings.jackpot_enabled}
                  onChange={(checked) =>
                    updateSetting("jackpot_enabled", checked)
                  }
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-black">Summary</h2>

              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow
                  label="Gifts per spin"
                  value={String(settings.gift_per_spin)}
                />
                <SummaryRow label="Rewards" value={String(rewards.length)} />
                <SummaryRow
                  label="Enabled rewards"
                  value={String(
                    rewards.filter((reward) => reward.is_enabled).length,
                  )}
                />
                <SummaryRow
                  label="Total weight"
                  value={totalWeight.toFixed(1)}
                />
                <SummaryRow label="Theme" value={settings.theme} />
              </div>
            </Card>

            <Button
              onClick={() => void saveSettings()}
              disabled={saving}
              variant="upgrade"
              className="w-full"
            >
              {saving ? "Saving..." : "Save Gift Wheel"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div>
        <div className="font-black">{label}</div>
        <div className="mt-1 text-xs leading-relaxed text-zinc-400">
          {description}
        </div>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-950 px-4 py-3">
      <span className="text-zinc-400">{label}</span>
      <span className="font-black capitalize text-white">{value}</span>
    </div>
  );
}

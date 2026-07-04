"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { PermissionProvider } from "@/components/PermissionProvider";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Subscription } from "@/lib/core/types";
import type { Feature } from "@/lib/core/permissions";
import {
  canConnectTikTok,
  canCopyOverlay,
  canResetWidget,
  canSaveWidgetSettings,
  canTestWidget,
  canUse,
} from "@/lib/core/permissions";
import {
  getTrialDaysLeft,
  isSubscriptionExpired,
} from "@/lib/core/subscriptions";

const SERVER_URL = "https://server-production-b88b.up.railway.app";

function normalizePlan(plan?: string | null) {
  if (plan === "creator") return "creator";
  if (plan === "pro") return "pro";
  if (plan === "owner") return "owner";
  return "free";
}

const BASKETS = [
  { id: "basket-1", name: "Basket 1", image: "/assets/baskets/basket-1.png" },
  { id: "basket-2", name: "Basket 2", image: "/assets/baskets/basket-2.png" },
  {
    id: "chest-1",
    name: "Treasure Chest",
    image: "/assets/baskets/chest-1.png",
  },
];

const VEHICLES = [
  { id: "tuktuk", name: "Tuk Tuk", image: "/assets/vehicles/tuktuk.png" },
  { id: "pickup", name: "Pickup", image: "/assets/vehicles/pickup.png" },
  { id: "car", name: "Car", image: "/assets/vehicles/car.png" },
  { id: "vespa", name: "Vespa", image: "/assets/vehicles/vespa.png" },
];

const LANTERNS = [
  { id: "phoenix", name: "Phoenix", image: "/assets/lantern/phoenix-back.png" },
  { id: "rat", name: "Rat", image: "/assets/lantern/rat-back.png" },
  { id: "cat", name: "Cat", image: "/assets/lantern/cat-back.png" },
  { id: "rabbit", name: "Rabbit", image: "/assets/lantern/rabbit-back.png" },
];

type WidgetItem = {
  name: string;
  description: string;
  url: string;
  requiredFeature: Feature;
  active: boolean;
  testEvent: string;
  resetEvent: string;
  testLabel: string;
  resetLabel: string;
  testButtonClass: string;
  resetButtonClass: string;
  basketPicker?: boolean;
  vehiclePicker?: boolean;
  lanternPicker?: boolean;
};

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  overlay_id: string;
  tiktok_username: string | null;
};

type WidgetSettings = {
  user_id: string;
  basket: string;
  vehicle: string;
  lantern: string;
  gift_goal_enabled: boolean;
  basket_enabled: boolean;
  vehicle_enabled: boolean;
  lantern_enabled: boolean;
  fortune_enabled: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const socket = useMemo(
    () =>
      io(SERVER_URL, {
        autoConnect: false,
      }),
    [],
  );

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [username, setUsername] = useState("");
  const [overlayId, setOverlayId] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedBasket, setSelectedBasket] = useState("basket-1");
  const [selectedVehicle, setSelectedVehicle] = useState("tuktuk");
  const [selectedLantern, setSelectedLantern] = useState("phoenix");
  const [status, setStatus] = useState<
    "idle" | "not-live" | "success" | "server-error"
  >("idle");

  const currentPlan = normalizePlan(subscription?.plan);

  const trialDaysLeft = useMemo(
    () => getTrialDaysLeft(subscription),
    [subscription],
  );

  const trialExpired = useMemo(
    () => isSubscriptionExpired(subscription),
    [subscription],
  );

  const creatorTrialLabel = useMemo(() => {
    if (currentPlan === "creator") {
      if (subscription?.expires_at) {
        return trialExpired ? "Trial Ended" : `${trialDaysLeft} days left`;
      }

      return "Active";
    }

    if (currentPlan === "pro") return "Active";
    if (currentPlan === "owner") return "Unlimited";

    return trialExpired ? "Ended" : `${trialDaysLeft} days`;
  }, [currentPlan, subscription, trialExpired, trialDaysLeft]);

  const creatorTrialTone =
    creatorTrialLabel === "Trial Ended" || creatorTrialLabel === "Ended"
      ? "text-red-300"
      : "text-green-300";

  const canConnect = canConnectTikTok(subscription);
  const canCopy = canCopyOverlay(subscription);
  const canTest = canTestWidget(subscription);
  const canReset = canResetWidget(subscription);
  const canSaveSettings = canSaveWidgetSettings(subscription);

  useEffect(() => {
    setOrigin(window.location.origin);

    const loadProfile = async () => {
      setProfileLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setProfileLoading(false);
        router.replace("/login");
        return;
      }

      const user = session.user;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,display_name,overlay_id,tiktok_username")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setProfile(profileData);
      setOverlayId(profileData.overlay_id);

      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("id,user_id,plan,status,started_at,expires_at,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (subscriptionError) {
        console.error("Load subscription error:", subscriptionError);
      }

      setSubscription(subscriptionData ?? null);

      setProfileLoading(false);

      const { data: settings, error: settingsError } = await supabase
        .from("widget_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settingsError || !settings) {
        const { data: createdSettings, error: createError } = await supabase
          .from("widget_settings")
          .insert({ user_id: user.id })
          .select("*")
          .single();

        if (createError) {
          console.error("Create widget settings error:", createError);
        }

        if (createdSettings) {
          setSelectedBasket(createdSettings.basket);
          setSelectedVehicle(createdSettings.vehicle);
          setSelectedLantern(createdSettings.lantern);
        }
      } else {
        setSelectedBasket(settings.basket);
        setSelectedVehicle(settings.vehicle);
        setSelectedLantern(settings.lantern);
      }

      setSettingsLoading(false);
    };

    loadProfile();

    return () => {
      socket.disconnect();
    };
  }, [router, supabase, socket]);

  const connectTikTok = async () => {
    if (!canConnect) {
      setUpgradeModalOpen(true);
      return;
    }

    const savedCreatorUsername = profile?.tiktok_username?.trim();

    if (!savedCreatorUsername) {
      alert("Creator Username not set. Please update it in My Profile.");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.replace("/login");
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    try {
      setLoading(true);

      const res = await fetch(`${SERVER_URL}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.code === "USER_OFFLINE" ? "not-live" : "server-error");
        return;
      }

      setOverlayId(profile?.overlay_id || data.overlayId);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("server-error");
    } finally {
      setLoading(false);
    }
  };

  const createTestOverlay = () => {
    if (!canTest) {
      setUpgradeModalOpen(true);
      return;
    }

    setOverlayId(profile?.overlay_id || overlayId || self.crypto.randomUUID());
    setUsername("TEST MODE");
    setStatus("success");
  };

  const copy = async (url: string) => {
    if (!canCopy) {
      setUpgradeModalOpen(true);
      return;
    }

    await navigator.clipboard.writeText(url);
    alert("Overlay link copied successfully!");
  };

  const emitWidgetEvent = (eventName: string) => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(eventName, {
      overlayId,
    });
  };

  const saveWidgetSettings = async (settings: Partial<WidgetSettings>) => {
    if (!canSaveSettings) {
      setUpgradeModalOpen(true);
      return;
    }

    if (!userId) return;

    try {
      setSavingSettings(true);

      const { error } = await supabase.from("widget_settings").upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Save widget settings error:", error);
        alert("Unable to save your live widget preferences. Please try again.");
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const selectBasket = (basketId: string) => {
    setSelectedBasket(basketId);
    saveWidgetSettings({ basket: basketId });
  };

  const selectVehicle = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    saveWidgetSettings({ vehicle: vehicleId });
  };

  const selectLantern = (lanternId: string) => {
    setSelectedLantern(lanternId);
    saveWidgetSettings({ lantern: lanternId });
  };

  const widgets: WidgetItem[] =
    overlayId && origin
      ? [
          {
            name: "🎁 Gift Goal",
            description: "Set a gift goal, such as Rose 0/100.",
            url: `${origin}/widget/gift-goal/${overlayId}`,
            requiredFeature: "giftGoal",
            active: true,
            testEvent: "test-goal",
            resetEvent: "reset-goal",
            testLabel: "🎯 Test Goal",
            resetLabel: "🔄 Reset Goal",
            testButtonClass: "bg-pink-600 hover:bg-pink-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
          {
            name: "🧙🏻‍♀️ Magic Lantern",
            description: "Collect gifts inside a magical lantern.",
            url: `${origin}/widget/magic-lantern/${overlayId}?lantern=${selectedLantern}`,
            requiredFeature: "magicLantern",
            active: true,
            lanternPicker: true,
            testEvent: "test-lantern",
            resetEvent: "reset-lantern",
            testLabel: "🧙 Test Lantern",
            resetLabel: "🔄 Reset Lantern",
            testButtonClass: "bg-purple-600 hover:bg-purple-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
          {
            name: "🛺 Gift Vehicle",
            description: "A vehicle drives across a carpet of roses.",
            url: `${origin}/widget/gift-vehicle/${overlayId}?vehicle=${selectedVehicle}`,
            requiredFeature: "giftVehicle",
            active: true,
            vehiclePicker: true,
            testEvent: "test-vehicle",
            resetEvent: "reset-vehicle",
            testLabel: "🛺 Test Vehicle",
            resetLabel: "🔄 Reset Vehicle",
            testButtonClass: "bg-yellow-600 hover:bg-yellow-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
          {
            name: "🧺 Gift Basket",
            description:
              "Watch gifts fall into a basket and pile up on screen.",
            url: `${origin}/widget/gift-plane/${overlayId}?basket=${selectedBasket}`,
            requiredFeature: "giftBasket",
            active: true,
            basketPicker: true,
            testEvent: "test-basket",
            resetEvent: "reset-basket",
            testLabel: "🧺 Test Basket",
            resetLabel: "🔄 Reset Basket",
            testButtonClass: "bg-emerald-600 hover:bg-emerald-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
          {
            name: "🙏🏻 Fortune Reading",
            description:
              "Send a 99-coin gift or higher to receive your fortune.",
            url: `${origin}/widget/fortune-stick/${overlayId}`,
            requiredFeature: "fortuneReading",
            active: true,
            testEvent: "test-fortune",
            resetEvent: "reset-fortune",
            testLabel: "🙏 Test Fortune",
            resetLabel: "🔄 Reset Fortune",
            testButtonClass: "bg-orange-600 hover:bg-orange-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
        ]
      : [];

  return (
    <PermissionProvider subscription={subscription}>
      <main className="min-h-screen bg-zinc-950 p-6 text-white lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <SectionHeader
              badge="Make Every Live Unforgettable."
              title={profile?.display_name || "OMSW Live Dashboard"}
              description={profile?.email || "Loading account..."}
            />

            <div className="flex flex-wrap gap-3">
              <Button href="/profile">My Profile</Button>
              <Button href="/logout" variant="secondary">
                Logout
              </Button>
            </div>
          </div>

          {profileLoading ? (
            <LoadingCard />
          ) : (
            <>
              <section className="mb-8 grid gap-4 md:grid-cols-5">
                <Card>
                  <div className="text-sm text-zinc-400">Current Plan</div>
                  <div className="mt-3">
                    <PlanBadge plan={currentPlan} />
                  </div>
                </Card>

                <Card>
                  <div className="text-sm text-zinc-400">Creator Trial</div>

                  <div
                    className={`mt-3 text-2xl font-black ${creatorTrialTone}`}
                  >
                    {creatorTrialLabel}
                  </div>
                </Card>

                <Card>
                  <div className="text-sm text-zinc-400">Creator Username</div>
                  <div className="mt-3 break-all text-2xl font-black text-yellow-300">
                    {profile?.tiktok_username
                      ? `@${profile.tiktok_username}`
                      : "Not set"}
                  </div>
                </Card>

                <Card className="md:col-span-2">
                  <div className="text-sm text-zinc-400">Creator ID</div>
                  <div className="mt-3 break-all rounded-xl bg-zinc-950 p-3 text-sm font-bold text-zinc-200">
                    {profile?.overlay_id || overlayId || "-"}
                  </div>
                </Card>
              </section>

              {trialExpired && subscription?.plan === "free" && (
                <Card className="mb-8 border-pink-500 bg-pink-500/10">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-pink-200">
                        ✨ Your Creator Trial Has Ended
                      </h2>
                      <p className="mt-2 text-sm text-pink-100/80">
                        You're now on the Free plan. Upgrade to Creator to
                        unlock all widgets, live effects, and premium overlays.
                      </p>
                    </div>
                    <Button href="/dashboard/billing" variant="upgrade">
                      Upgrade to Creator
                    </Button>
                  </div>
                </Card>
              )}

              <Card className="mb-8">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-xl font-black">Live Connection</h2>
                  <div className="text-sm text-zinc-400">
                    {settingsLoading
                      ? "Loading live widget preferences..."
                      : savingSettings
                        ? "Saving preferences..."
                        : "Live widget preferences saved automatically"}
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
                    <div className="text-sm text-zinc-400">
                      Creator Username
                    </div>
                    <div className="mt-1 text-xl font-black text-white">
                      {profile?.tiktok_username
                        ? `@${profile.tiktok_username}`
                        : "Not set"}
                    </div>
                    {!profile?.tiktok_username && (
                      <a
                        href="/profile"
                        className="mt-2 inline-block text-sm font-bold text-pink-400 hover:text-pink-300"
                      >
                        Set Creator Username
                      </a>
                    )}
                  </div>

                  <Button
                    onClick={connectTikTok}
                    disabled={
                      loading || !profile?.tiktok_username || !canConnect
                    }
                  >
                    {loading ? "Connecting..." : "Connect"}
                  </Button>

                  <Button
                    onClick={createTestOverlay}
                    disabled={!canTest}
                    variant="secondary"
                  >
                    🧪 Test Overlay
                  </Button>
                </div>

                <div className="mt-6">
                  {status === "idle" && (
                    <StatusBox
                      icon="⚪"
                      title="Not connected"
                      description="Set your Creator Username, then connect."
                    />
                  )}
                  {status === "not-live" && (
                    <StatusBox
                      icon="🟡"
                      title="No active live session found"
                      description="Start your live, then try connecting again."
                      tone="yellow"
                    />
                  )}
                  {status === "success" && (
                    <StatusBox
                      icon="🟢"
                      title="Connected successfully"
                      description={`Account: @${profile?.tiktok_username || username}`}
                      tone="green"
                    />
                  )}
                  {status === "server-error" && (
                    <StatusBox
                      icon="🔴"
                      title="Unable to connect to server"
                      description="Please try again."
                      tone="red"
                    />
                  )}
                </div>
              </Card>

              {overlayId && (
                <section>
                  <h2 className="mb-6 text-2xl font-black">Live Widgets</h2>

                  <div className="space-y-6">
                    {widgets.map((widget) => {
                      const widgetUnlocked = canUse(
                        currentPlan,
                        widget.requiredFeature,
                      );

                      return (
                        <Card key={widget.name}>
                          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-2xl font-black">
                                {widget.name}
                              </h3>
                              <p className="mt-1 text-sm text-zinc-400">
                                {widget.description}
                              </p>
                            </div>
                            {widget.active && widgetUnlocked ? (
                              <span className="w-fit rounded-full bg-green-600 px-3 py-1 text-sm font-bold">
                                Unlocked
                              </span>
                            ) : widget.active ? (
                              <span className="w-fit rounded-full bg-pink-600/80 px-3 py-1 text-sm font-bold">
                                🔒 Creator Feature
                              </span>
                            ) : (
                              <span className="w-fit rounded-full bg-zinc-700 px-3 py-1 text-sm">
                                Coming Soon
                              </span>
                            )}
                          </div>

                          {widget.basketPicker && (
                            <PickerGrid
                              title="Choose Basket"
                              items={BASKETS}
                              selectedId={selectedBasket}
                              onSelect={selectBasket}
                              disabled={!canSaveSettings || !widgetUnlocked}
                              selectedClassName="border-pink-500 bg-pink-500/20"
                            />
                          )}

                          {widget.vehiclePicker && (
                            <PickerGrid
                              title="Choose Vehicle"
                              items={VEHICLES}
                              selectedId={selectedVehicle}
                              onSelect={selectVehicle}
                              disabled={!canSaveSettings || !widgetUnlocked}
                              selectedClassName="border-yellow-500 bg-yellow-500/20"
                            />
                          )}

                          {widget.lanternPicker && (
                            <PickerGrid
                              title="Choose Lantern"
                              items={LANTERNS}
                              selectedId={selectedLantern}
                              onSelect={selectLantern}
                              disabled={!canSaveSettings || !widgetUnlocked}
                              selectedClassName="border-purple-500 bg-purple-500/20"
                            />
                          )}

                          {widgetUnlocked ? (
                            <div className="mb-4 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950">
                              <iframe
                                key={widget.url}
                                src={widget.url}
                                className="h-[560px] w-full"
                              />
                            </div>
                          ) : (
                            <div className="mb-4 rounded-2xl border border-pink-500/30 bg-pink-500/10 p-8 text-center">
                              <div className="text-4xl">🔒</div>
                              <h4 className="mt-3 text-2xl font-black">
                                Creator Feature
                              </h4>
                              <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-300">
                                Upgrade to Creator to unlock this widget,
                                overlay link, test controls and live effects.
                              </p>
                              <Button
                                onClick={() => setUpgradeModalOpen(true)}
                                variant="upgrade"
                                className="mt-5"
                              >
                                Upgrade to Creator
                              </Button>
                            </div>
                          )}

                          <input
                            readOnly
                            value={
                              widgetUnlocked
                                ? widget.url
                                : "🔒 Upgrade to Creator to unlock this overlay"
                            }
                            className="mb-4 w-full rounded-xl bg-zinc-800 p-3 text-sm text-zinc-200"
                          />

                          <div className="flex flex-wrap gap-3">
                            <Button
                              onClick={() => copy(widget.url)}
                              disabled={!widgetUnlocked || !canCopy}
                              variant="secondary"
                            >
                              {widgetUnlocked ? "Copy Link" : "🔒 Copy Link"}
                            </Button>

                            <Button
                              onClick={() => {
                                if (!widgetUnlocked) {
                                  setUpgradeModalOpen(true);
                                  return;
                                }

                                window.open(
                                  widget.url,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                              variant="secondary"
                            >
                              Open Preview
                            </Button>

                            {widget.active && (
                              <>
                                <button
                                  onClick={() => {
                                    if (!canTest || !widgetUnlocked) {
                                      setUpgradeModalOpen(true);
                                      return;
                                    }

                                    emitWidgetEvent(widget.testEvent);
                                  }}
                                  disabled={!canTest || !widgetUnlocked}
                                  className={`rounded-xl px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${widget.testButtonClass}`}
                                >
                                  {widget.testLabel}
                                </button>

                                <button
                                  onClick={() => {
                                    if (!canReset || !widgetUnlocked) {
                                      setUpgradeModalOpen(true);
                                      return;
                                    }

                                    emitWidgetEvent(widget.resetEvent);
                                  }}
                                  disabled={!canReset || !widgetUnlocked}
                                  className={`rounded-xl px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${widget.resetButtonClass}`}
                                >
                                  {widget.resetLabel}
                                </button>
                              </>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </PermissionProvider>
  );
}

type PickerItem = {
  id: string;
  name: string;
  image: string;
};

type PickerGridProps = {
  title: string;
  items: PickerItem[];
  selectedId: string;
  disabled: boolean;
  selectedClassName: string;
  onSelect: (id: string) => void;
};

function PickerGrid({
  title,
  items,
  selectedId,
  disabled,
  selectedClassName,
  onSelect,
}: PickerGridProps) {
  return (
    <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-3 font-bold">{title}</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            disabled={disabled}
            className={`rounded-2xl border p-3 transition disabled:cursor-not-allowed disabled:opacity-50 ${
              selectedId === item.id
                ? selectedClassName
                : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
            }`}
          >
            <Image
              src={item.image}
              alt={item.name}
              width={80}
              height={80}
              className="mx-auto mb-2 object-contain"
            />
            <div className="text-sm font-bold">{item.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

type StatusBoxProps = {
  icon: string;
  title: string;
  description: string;
  tone?: "default" | "yellow" | "green" | "red";
};

function StatusBox({
  icon,
  title,
  description,
  tone = "default",
}: StatusBoxProps) {
  const className =
    tone === "yellow"
      ? "border-yellow-500 bg-yellow-500/20 text-yellow-200"
      : tone === "green"
        ? "border-green-500 bg-green-500/20 text-green-200"
        : tone === "red"
          ? "border-red-500 bg-red-500/20 text-red-200"
          : "border-zinc-800 bg-zinc-800 text-zinc-300";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${className}`}>
      {icon} {title}
      <div className="mt-1 text-sm opacity-90">{description}</div>
    </div>
  );
}

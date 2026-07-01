"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Subscription } from "@/lib/core/types";
import { PermissionProvider } from "@/components/PermissionProvider";
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

const BASKETS = [
  {
    id: "basket-1",
    name: "Basket 1",
    image: "/assets/baskets/basket-1.png",
  },
  {
    id: "basket-2",
    name: "Basket 2",
    image: "/assets/baskets/basket-2.png",
  },
  {
    id: "chest-1",
    name: "Treasure Chest",
    image: "/assets/baskets/chest-1.png",
  },
  // {
  //   id: "cat-basket",
  //   name: "Cat Basket",
  //   image: "/assets/baskets/cat-basket.png",
  // },
];

const VEHICLES = [
  {
    id: "tuktuk",
    name: "Tuk Tuk",
    image: "/assets/vehicles/tuktuk.png",
  },
  {
    id: "pickup",
    name: "Pickup",
    image: "/assets/vehicles/pickup.png",
  },
  {
    id: "car",
    name: "Car",
    image: "/assets/vehicles/car.png",
  },
  {
    id: "vespa",
    name: "Vespa",
    image: "/assets/vehicles/vespa.png",
  },
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
  plan: string;
  trial_start: string;
  trial_end: string;
  overlay_id: string;
  tiktok_username: string | null;
  created_at: string;
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
function getPlanLabel(plan?: string | null) {
  switch (plan) {
    case "trial":
      return "🎁 Trial";
    case "pro":
      return "⭐ Creator";
    case "premium":
      return "💎 Pro";
    case "owner":
      return "👑 Owner";
    default:
      return "🎁 Trial";
  }
}


export default function DashboardPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [overlayId, setOverlayId] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState("basket-1");
  const [selectedVehicle, setSelectedVehicle] = useState("tuktuk");
  const [selectedLantern, setSelectedLantern] = useState("phoenix");

  const socket = useMemo(() => {
    return io("https://server-production-b88b.up.railway.app");
  }, []);

  const supabase = useMemo(() => createClient(), []);

  const trialDaysLeft = useMemo(() => {
    return getTrialDaysLeft(subscription);
  }, [subscription]);

  const trialExpired = useMemo(() => {
    return isSubscriptionExpired(subscription);
  }, [subscription]);

  const canConnect = canConnectTikTok(subscription);
  const canCopy = canCopyOverlay(subscription);
  const canTest = canTestWidget(subscription);
  const canReset = canResetWidget(subscription);
  const canSaveSettings = canSaveWidgetSettings(subscription);

  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setProfile(data);
      setOverlayId(data.overlay_id);

      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("id,user_id,plan,status,started_at,expires_at,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

      if (subscriptionError) {
        console.error("Load subscription error:", subscriptionError);
      }

      setSubscription(subscriptionData as Subscription | null);
      setProfileLoading(false);

      const { data: settings, error: settingsError } = await supabase
        .from("widget_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settingsError || !settings) {
        const { data: createdSettings, error: createError } = await supabase
          .from("widget_settings")
          .insert({
            user_id: user.id,
          })
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
  }, [router, supabase]);

  const [status, setStatus] = useState<
    "idle" | "not-live" | "success" | "server-error"
  >("idle");

  const connectTikTok = async () => {
    if (!canConnect) {
      alert("Your trial has ended. Become a Founder to continue.");
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

    try {
      setLoading(true);

      const res = await fetch(
        "https://server-production-b88b.up.railway.app/connect",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "USER_OFFLINE") {
          setStatus("not-live");
        } else {
          setStatus("server-error");
        }

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
      alert("Your trial has ended. Become a Founder to continue.");
      return;
    }

    setOverlayId(profile?.overlay_id || overlayId || self.crypto.randomUUID());
    setUsername("TEST MODE");
    setStatus("success");
  };

  const copy = async (url: string) => {
    if (!canCopy) {
      alert("Your trial has ended. Become a Founder to unlock overlay links.");
      return;
    }

    await navigator.clipboard.writeText(url);
    alert("Overlay link copied successfully!");
  };

  const saveWidgetSettings = async (settings: Partial<WidgetSettings>) => {
    if (!canSaveSettings) {
      alert(
        "Your trial has ended. Become a Founder to save your widget preferences.",
      );
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
        alert("Unable to save your widget preferences. Please try again.");
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

  const widgets: WidgetItem[] = overlayId
    ? [
        {
          name: "🎁 Gift Goal",
          description: "Set a gift goal, such as Rose 0/100.",
          url: `${window.location.origin}/widget/gift-goal/${overlayId}`,
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
          url: `${window.location.origin}/widget/magic-lantern/${overlayId}?lantern=${selectedLantern}`,
          requiredFeature: "giftGoal",
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
          url: `${window.location.origin}/widget/gift-vehicle/${overlayId}?vehicle=${selectedVehicle}`,
          requiredFeature: "giftGoal",
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
          description: "Watch gifts fall into a basket and pile up on screen.",
          url: `${window.location.origin}/widget/gift-plane/${overlayId}?basket=${selectedBasket}`,
          requiredFeature: "giftGoal",
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
          description: "Send a 99-coin gift or higher to receive your fortune.",
          url: `${window.location.origin}/widget/fortune-stick/${overlayId}`,
          requiredFeature: "giftGoal",
          active: true,
          testEvent: "test-fortune",
          resetEvent: "reset-fortune",
          testLabel: "🙏 Test Fortune",
          resetLabel: "🔄 Reset Fortune",
          testButtonClass: "bg-orange-600 hover:bg-orange-500",
          resetButtonClass: "bg-red-600 hover:bg-red-500",
        },
        // {
        //   name: "🐱 Evolution Pet",
        //   description: "สัตว์เลี้ยงโตตามจำนวนของขวัญ",
        //   url: `${window.location.origin}/widget/pet/${overlayId}`,
        //   active: false,
        // },
        // {
        //   name: "🏆 Top Gifter",
        //   description: "จัดอันดับคนส่งของขวัญสูงสุด",
        //   url: `${window.location.origin}/widget/top-gifter/${overlayId}`,
        //   active: false,
        // },
      ]
    : [];

  return (
    <PermissionProvider subscription={subscription}>
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 text-sm font-bold text-pink-400">
              Make Every Live Unforgettable.
            </div>

            <h1 className="text-4xl font-bold">
              {profile?.display_name || "OMSW Live Dashboard"}
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              {profile?.email || "Loading account..."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/profile"
              className="w-fit rounded-xl bg-pink-600 px-4 py-2 font-bold transition hover:bg-pink-500"
            >
              My Profile
            </a>

            <a
              href="/logout"
              className="w-fit rounded-xl bg-zinc-700 px-4 py-2 font-bold transition hover:bg-zinc-600"
            >
              Logout
            </a>
          </div>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">Membership</div>
            <div className="mt-2 text-2xl font-black text-pink-300">
              {profileLoading ? "..." : getPlanLabel(subscription?.plan)}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">Days Remaining</div>
            <div className="mt-2 text-2xl font-black text-green-300">
              {profileLoading
                ? "..."
                : trialExpired
                  ? "Expired"
                  : `${trialDaysLeft} days`}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="text-sm text-zinc-400">Creator Username</div>
            <div className="mt-2 break-all text-2xl font-black text-yellow-300">
              {profileLoading
                ? "..."
                : profile?.tiktok_username
                  ? `@${profile.tiktok_username}`
                  : "Not set"}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 md:col-span-2">
            <div className="text-sm text-zinc-400">Creator ID</div>
            <div className="mt-2 break-all rounded-xl bg-zinc-950 p-3 text-sm font-bold text-zinc-200">
              {profileLoading
                ? "Loading Creator ID..."
                : profile?.overlay_id || overlayId || "-"}
            </div>
          </div>
        </section>

        {trialExpired && subscription?.plan === "trial" && (
          <section className="mb-8 rounded-3xl border border-red-500 bg-red-500/10 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-red-200">
                  🎁 Your Trial Has Ended
                </h2>

                <p className="mt-2 text-sm text-red-100/80">
                  Become a Founder today and continue using all OMSW Live
                  features.
                </p>
              </div>

              <a
                href="/pricing"
                className="w-fit rounded-xl bg-pink-600 px-5 py-3 font-bold transition hover:bg-pink-500"
              >
                Become a Founder
              </a>
            </div>
          </section>
        )}

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold"> Live Connection</h2>

            <div className="text-sm text-zinc-400">
              {settingsLoading
                ? "Loading widget preferences..."
                : savingSettings
                  ? "Saving preferences..."
                  : "Preferences saved automatically"}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Creator Username</div>
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

            <button
              onClick={connectTikTok}
              disabled={loading || !profile?.tiktok_username || !canConnect}
              className="rounded-xl bg-pink-600 px-6 py-4 font-bold transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Connect"}
            </button>

            <button
              onClick={createTestOverlay}
              disabled={!canTest}
              className="rounded-xl bg-zinc-700 px-6 py-4 font-bold transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              🧪 Test Overlay
            </button>
          </div>

          <div className="mt-6">
            {status === "idle" && (
              <div className="rounded-2xl bg-zinc-800 px-4 py-3">
                ⚪ Not connected
                <div className="mt-1 text-sm text-zinc-400">
                  Set your Creator Username, then connect.
                </div>
              </div>
            )}

            {status === "not-live" && (
              <div className="rounded-2xl border border-yellow-500 bg-yellow-500/20 px-4 py-3">
                🟡 No active live session found
                <div className="mt-1 text-sm text-yellow-200">
                  Start your live, then try connecting again.
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="rounded-2xl border border-green-500 bg-green-500/20 px-4 py-3">
                🟢 Connected successfully
                <div className="mt-1 text-sm text-green-200">
                  Account: @{profile?.tiktok_username || username}
                </div>
              </div>
            )}

            {status === "server-error" && (
              <div className="rounded-2xl border border-red-500 bg-red-500/20 px-4 py-3">
                🔴 Unable to connect to server
                <div className="mt-1 text-sm text-red-200">
                  Please try again.
                </div>
              </div>
            )}
          </div>
        </section>

        {overlayId && (
          <section>
            <h2 className="mb-6 text-2xl font-bold">Widgets</h2>

            <div className="space-y-6">
              {widgets.map((widget) => {
                const widgetUnlocked =
                  canCopy &&
                  canUse(subscription?.plan || "trial", widget.requiredFeature);

                return (
                <div
                  key={widget.name}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
                >
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{widget.name}</h3>

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
                        🔒 Locked
                      </span>
                    ) : (
                      <span className="w-fit rounded-full bg-zinc-700 px-3 py-1 text-sm">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {widget.basketPicker && (
                    <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="mb-3 font-bold">Choose Basket</div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {BASKETS.map((basket) => (
                          <button
                            key={basket.id}
                            onClick={() => selectBasket(basket.id)}
                            disabled={!canSaveSettings || !widgetUnlocked}
                            className={`rounded-2xl border p-3 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              selectedBasket === basket.id
                                ? "border-pink-500 bg-pink-500/20"
                                : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                            }`}
                          >
                            <img
                              src={basket.image}
                              alt={basket.name}
                              className="mx-auto mb-2 h-20 object-contain"
                            />

                            <div className="text-sm font-bold">
                              {basket.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {widget.vehiclePicker && (
                    <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="mb-3 font-bold">Choose Vehicle</div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {VEHICLES.map((vehicle) => (
                          <button
                            key={vehicle.id}
                            onClick={() => selectVehicle(vehicle.id)}
                            disabled={!canSaveSettings || !widgetUnlocked}
                            className={`rounded-2xl border p-3 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              selectedVehicle === vehicle.id
                                ? "border-yellow-500 bg-yellow-500/20"
                                : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                            }`}
                          >
                            <img
                              src={vehicle.image}
                              alt={vehicle.name}
                              className="mx-auto mb-2 h-20 object-contain"
                            />

                            <div className="text-sm font-bold">
                              {vehicle.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {widget.lanternPicker && (
                    <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="mb-3 font-bold">Choose Lantern</div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {LANTERNS.map((lantern) => (
                          <button
                            key={lantern.id}
                            onClick={() => selectLantern(lantern.id)}
                            disabled={!canSaveSettings || !widgetUnlocked}
                            className={`rounded-2xl border p-3 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              selectedLantern === lantern.id
                                ? "border-purple-500 bg-purple-500/20"
                                : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                            }`}
                          >
                            <img
                              src={lantern.image}
                              alt={lantern.name}
                              className="mx-auto mb-2 h-20 object-contain"
                            />

                            <div className="text-sm font-bold">
                              {lantern.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
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
                      <h4 className="mt-3 text-2xl font-black">Upgrade Required</h4>
                      <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-300">
                        This widget is not included in your current membership.
                        Upgrade to Creator to unlock widgets, overlays and live effects.
                      </p>
                      <a
                        href="/dashboard/billing"
                        className="mt-5 inline-block rounded-xl bg-pink-600 px-5 py-3 font-black transition hover:bg-pink-500"
                      >
                        Upgrade Membership
                      </a>
                    </div>
                  )}

                  <input
                    readOnly
                    value={
                      widgetUnlocked
                        ? widget.url
                        : "🔒 Become a Founder to unlock this overlay"
                    }
                    className="mb-4 w-full rounded-xl bg-zinc-800 p-3 text-sm text-zinc-200"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => copy(widget.url)}
                      disabled={!widgetUnlocked}
                      className="rounded-xl bg-purple-600 px-4 py-2 font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {widgetUnlocked ? "Copy Link" : "🔒 Copy Link"}
                    </button>

                    <button
                      onClick={() => {
                        if (!widgetUnlocked) {
                          alert("Upgrade your membership to unlock this widget.");
                          return;
                        }

                        window.open(widget.url, "_blank");
                      }}
                      className="rounded-xl bg-zinc-700 px-4 py-2 font-bold transition hover:bg-zinc-600"
                    >
                      Open Preview
                    </button>

                    {widget.active && (
                      <>
                        <button
                          onClick={() => {
                            if (!canTest || !widgetUnlocked) {
                              alert(
                                "Upgrade your membership to unlock this widget.",
                              );
                              return;
                            }

                            socket.emit(widget.testEvent, {
                              overlayId,
                            });
                          }}
                          disabled={!canTest || !widgetUnlocked}
                          className={`rounded-xl px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${widget.testButtonClass}`}
                        >
                          {widget.testLabel}
                        </button>

                        <button
                          onClick={() => {
                            if (!canReset || !widgetUnlocked) {
                              alert(
                                "Upgrade your membership to unlock this widget.",
                              );
                              return;
                            }

                            socket.emit(widget.resetEvent, {
                              overlayId,
                            });
                          }}
                          disabled={!canReset || !widgetUnlocked}
                          className={`rounded-xl px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${widget.resetButtonClass}`}
                        >
                          {widget.resetLabel}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
      </main>
    </PermissionProvider>
  );
}

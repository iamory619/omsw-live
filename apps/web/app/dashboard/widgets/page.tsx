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
import { SERVER_URL } from "@/lib/core/server-url";
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

function normalizePlan(plan?: string | null) {
  if (plan === "creator") return "creator";
  if (plan === "pro") return "pro";
  if (plan === "owner") return "owner";
  return "free";
}

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

const PETS = [
  { id: "cat", name: "Cat", emoji: "🐱" },
  { id: "husky", name: "Siberian Husky", emoji: "🐺" },
  // { id: "trex", name: "Tiny T-Rex", emoji: "🦖" },
  { id: "pony", name: "Magic Pony", emoji: "🦄" },
] as const;

type PetType = (typeof PETS)[number]["id"];

type WidgetCategory = "creator" | "seller";
type WidgetReleaseStatus = "stable" | "beta" | "new";

type WidgetItem = {
  id: string;
  name: string;
  description: string;
  url: string;
  requiredFeature: Feature;
  active: boolean;
  category: WidgetCategory;
  releaseStatus: WidgetReleaseStatus;
  version: string;
  previewZoom: number;
  configureHref?: string;
  badge?: string;
  testEvent: string;
  resetEvent: string;
  testLabel: string;
  resetLabel: string;
  testButtonClass: string;
  resetButtonClass: string;
  basketPicker?: boolean;
  vehiclePicker?: boolean;
  lanternPicker?: boolean;
  petPicker?: boolean;
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
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      }),
    [],
  );

  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Dashboard socket connected:", socket.id);
    };

    const handleDisconnect = (reason: string) => {
      console.warn("⚠️ Dashboard socket disconnected:", reason);
    };

    const handleConnectError = (error: Error) => {
      console.warn("Dashboard socket reconnecting:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket]);

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
  const [selectedVehicle, setSelectedVehicle] = useState("tuktuk");
  const [selectedLantern, setSelectedLantern] = useState("phoenix");
  const [selectedPet, setSelectedPet] = useState<PetType>("cat");
  const [status, setStatus] = useState<
    "idle" | "not-live" | "success" | "server-error"
  >("idle");
  const [mobilePreviewId, setMobilePreviewId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | WidgetCategory>(
    "all",
  );
  const [favoriteWidgetIds, setFavoriteWidgetIds] = useState<string[]>([]);

  useEffect(() => {
    const savedPet = window.localStorage.getItem("omsw-evolution-pet");

    if (
      savedPet === "cat" ||
      savedPet === "husky" ||
      // savedPet === "trex" ||
      savedPet === "pony"
    ) {
      setSelectedPet(savedPet);
    }
  }, []);

  useEffect(() => {
    const savedFavorites = window.localStorage.getItem("omsw-widget-favorites");

    if (!savedFavorites) return;

    try {
      const parsed = JSON.parse(savedFavorites) as unknown;

      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === "string")
      ) {
        setFavoriteWidgetIds(parsed);
      }
    } catch {
      window.localStorage.removeItem("omsw-widget-favorites");
    }
  }, []);

  const toggleFavorite = (widgetId: string) => {
    setFavoriteWidgetIds((current) => {
      const next = current.includes(widgetId)
        ? current.filter((id) => id !== widgetId)
        : [...current, widgetId];

      window.localStorage.setItem(
        "omsw-widget-favorites",
        JSON.stringify(next),
      );

      return next;
    });
  };

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
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error(userError);
        setProfileLoading(false);
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,display_name,overlay_id,tiktok_username")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData) {
        console.error("Load profile error:", profileError);

        setProfileLoading(false);
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
          setSelectedVehicle(createdSettings.vehicle);
          setSelectedLantern(createdSettings.lantern);
        }
      } else {
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
      alert("Session not found. Please refresh the page and try again.");
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
    if (!overlayId) {
      alert("Overlay ID not found. Please refresh the page.");
      return;
    }

    /*
     * Use a short-lived socket for widget controls.
     * This avoids sending through a stale Dashboard connection and remains
     * compatible with both older and newer server payload handlers.
     */
    const controlSocket = io(SERVER_URL, {
      autoConnect: true,
      transports: ["polling", "websocket"],
      reconnection: false,
      timeout: 20000,
      forceNew: true,
    });

    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;

      window.clearTimeout(disconnectTimer);
      controlSocket.removeAllListeners();
      controlSocket.disconnect();
    };

    const disconnectTimer = window.setTimeout(() => {
      console.warn("Widget control socket timed out:", {
        eventName,
        overlayId,
      });

      finish();
    }, 5000);

    controlSocket.on("connect", () => {
      console.log("📤 Widget event sending:", {
        eventName,
        overlayId,
        socketId: controlSocket.id,
        transport: controlSocket.io.engine.transport.name,
        serverUrl: SERVER_URL,
      });

      // Send a string for maximum compatibility with deployed server versions.
      controlSocket.emit(eventName, overlayId);

      /*
       * Keep the socket alive briefly so the Socket.IO packet can be flushed,
       * especially when the Render server falls back to HTTP polling.
       */
      window.setTimeout(() => {
        console.log("✅ Widget event sent:", eventName, overlayId);
        finish();
      }, 1200);
    });

    controlSocket.on("connect_error", (error: Error) => {
      console.error("Widget control socket failed:", {
        eventName,
        overlayId,
        message: error.message,
        serverUrl: SERVER_URL,
      });

      finish();

      alert(
        "Unable to reach the widget server. Please wait a moment, refresh the page, and try again.",
      );
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

  const selectVehicle = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    saveWidgetSettings({ vehicle: vehicleId });
  };

  const selectLantern = (lanternId: string) => {
    setSelectedLantern(lanternId);
    saveWidgetSettings({ lantern: lanternId });
  };

  const selectPet = (petType: PetType) => {
    setSelectedPet(petType);
    window.localStorage.setItem("omsw-evolution-pet", petType);
  };

  const widgets: WidgetItem[] =
    overlayId && origin
      ? [
          {
            id: "gift-goal",
            name: "🎁 Gift Goal",
            description: "Set a gift goal, such as Rose 0/100.",
            url: `${origin}/widget/gift-goal/${overlayId}`,
            requiredFeature: "giftGoal",
            active: true,
            category: "creator",
            releaseStatus: "stable",
            version: "v1.0",
            previewZoom: 0.8,
            badge: "Creator",
            configureHref: "/dashboard/widgets/gift-goal",

            testEvent: "test-goal",
            resetEvent: "reset-goal",
            testLabel: "🎯 Test Goal",
            resetLabel: "🔄 Reset Goal",
            testButtonClass: "bg-pink-600 hover:bg-pink-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
          {
            id: "magic-lantern",
            name: "🧙🏻‍♀️ Magic Lantern",
            description: "Collect gifts inside a magical lantern.",
            url: `${origin}/widget/magic-lantern/${overlayId}?lantern=${selectedLantern}`,
            requiredFeature: "magicLantern",
            active: true,
            category: "creator",
            releaseStatus: "stable",
            version: "v1.0",
            previewZoom: 0.6,
            badge: "Creator",
            configureHref: "/dashboard/widgets/magic-lantern",

            lanternPicker: true,
            testEvent: "test-lantern",
            resetEvent: "reset-lantern",
            testLabel: "🧙 Test Lantern",
            resetLabel: "🔄 Reset Lantern",
            testButtonClass: "bg-purple-600 hover:bg-purple-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
          {
            id: "gift-vehicle",
            name: "🛺 Gift Vehicle",
            description: "A vehicle drives across a carpet of roses.",
            url: `${origin}/widget/gift-vehicle/${overlayId}?vehicle=${selectedVehicle}`,
            requiredFeature: "giftVehicle",
            active: true,
            category: "creator",
            releaseStatus: "stable",
            version: "v1.0",
            previewZoom: 0.6,
            badge: "Creator",
            vehiclePicker: true,
            testEvent: "test-vehicle",
            resetEvent: "reset-vehicle",
            testLabel: "🛺 Test Vehicle",
            resetLabel: "🔄 Reset Vehicle",
            testButtonClass: "bg-yellow-600 hover:bg-yellow-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
          // {
          //   name: "🧺 Gift Basket",
          //   description:
          //     "Watch gifts fall into your selected theme and pile up on screen.",
          //   url: `${origin}/widget/gift-plane/${overlayId}?basket=${selectedBasket}`,
          //   requiredFeature: "giftBasket",
          //   active: true,
          //   basketPicker: true,
          //   testEvent: "test-basket",
          //   resetEvent: "reset-basket",
          //   testLabel: "🧺 Test Basket",
          //   resetLabel: "🔄 Reset Basket",
          //   testButtonClass: "bg-emerald-600 hover:bg-emerald-500",
          //   resetButtonClass: "bg-red-600 hover:bg-red-500",
          // },
          {
            id: "fortune-reading",
            name: "🙏🏻 Fortune Reading",
            description:
              "Send a 99-coin gift or higher to receive your fortune.",
            url: `${origin}/widget/fortune-stick/${overlayId}`,
            requiredFeature: "fortuneReading",
            active: true,
            category: "creator",
            releaseStatus: "beta",
            version: "v1.0",
            previewZoom: 0.6,
            badge: "Creator",
            testEvent: "test-fortune",
            resetEvent: "reset-fortune",
            testLabel: "🙏 Test Fortune",
            resetLabel: "🔄 Reset Fortune",
            testButtonClass: "bg-orange-600 hover:bg-orange-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
          {
            id: "evolution-pet",
            name: "🐱 Evolution Pet",
            description: "Raise and evolve a living pet with viewer gifts.",
            url: `${origin}/widget/pet/${overlayId}?pet=${selectedPet}`,
            petPicker: true,
            // ใช้สิทธิ์ Creator เดิมชั่วคราว เพื่อไม่ให้ TypeScript ขึ้นแดง
            // หลังจากเพิ่ม evolutionPet ใน permissions แล้วค่อยเปลี่ยนเป็น "evolutionPet"
            requiredFeature: "magicLantern",
            active: true,
            category: "creator",
            releaseStatus: "new",
            version: "v1.0",
            previewZoom: 0.62,
            badge: "Creator",
            testEvent: "test-pet",
            resetEvent: "reset-pet",
            testLabel: "🐾 Test Pet",
            resetLabel: "🔄 Reset Pet",
            testButtonClass: "bg-cyan-600 hover:bg-cyan-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
          {
            id: "gift-wheel",
            name: "🎡 Gift Jackpot Wheel",
            description:
              "Spin the lucky wheel whenever viewers send gifts and reveal exciting rewards.",
            url: `${origin}/widget/gift-wheel/${overlayId}`,
            requiredFeature: "giftWheel",
            active: true,
            category: "creator",
            releaseStatus: "new",
            version: "v2.0",
            previewZoom: 0.55,
            badge: "Creator",
            configureHref: "/dashboard/widgets/gift-wheel",

            testEvent: "test-wheel",
            resetEvent: "reset-wheel",

            testLabel: "🎡 Test Wheel",
            resetLabel: "🔄 Reset Wheel",

            testButtonClass: "bg-fuchsia-600 hover:bg-fuchsia-500",
            resetButtonClass: "bg-red-600 hover:bg-red-500",
          },
        ]
      : [];

  const filteredWidgets = widgets
    .filter((widget) => {
      const normalizedSearch = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        widget.name.toLowerCase().includes(normalizedSearch) ||
        widget.description.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "all" || widget.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((first, second) => {
      const firstFavorite = favoriteWidgetIds.includes(first.id) ? 1 : 0;
      const secondFavorite = favoriteWidgetIds.includes(second.id) ? 1 : 0;

      if (firstFavorite !== secondFavorite) {
        return secondFavorite - firstFavorite;
      }

      return first.name.localeCompare(second.name);
    });

  return (
    <PermissionProvider subscription={subscription}>
      <main className="min-h-screen bg-zinc-950 px-3 py-5 text-white sm:px-5 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <SectionHeader
              badge="Make Every Live Unforgettable."
              title={profile?.display_name || "OMSW Live Dashboard"}
              description={profile?.email || "Loading account..."}
            />

            <div className="flex flex-wrap gap-3">
              <Button href="/profile">My Profile</Button>
              <a
                href="/logout"
                className="rounded-xl bg-zinc-800 px-4 py-3 font-bold transition hover:bg-zinc-700"
              >
                Logout
              </a>
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
                <>
                  <section>
                    <div className="mb-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <div className="text-sm font-black uppercase tracking-[0.2em] text-pink-300">
                            Widget Center V3
                          </div>
                          <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                            Creator Widgets
                          </h2>
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                            Preview, configure and control every overlay from
                            one responsive workspace.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                          Showing{" "}
                          <span className="font-black text-white">
                            {filteredWidgets.length}
                          </span>{" "}
                          of{" "}
                          <span className="font-black text-white">
                            {widgets.length}
                          </span>{" "}
                          widgets
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-3 sm:grid-cols-[1fr_auto] sm:p-4">
                        <label className="relative block">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            🔎
                          </span>
                          <input
                            value={searchQuery}
                            onChange={(event) =>
                              setSearchQuery(event.target.value)
                            }
                            placeholder="Search widgets..."
                            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 py-3 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-pink-500"
                          />
                        </label>

                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              ["all", "All"],
                              ["creator", "Creator"],
                              ["seller", "Seller"],
                            ] as const
                          ).map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setCategoryFilter(value)}
                              className={`rounded-2xl px-3 py-3 text-xs font-black transition ${
                                categoryFilter === value
                                  ? "bg-pink-600 text-white"
                                  : "bg-zinc-950 text-zinc-400 hover:text-white"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {filteredWidgets.length === 0 ? (
                      <Card className="py-14 text-center">
                        <div className="text-5xl">🔍</div>
                        <h3 className="mt-4 text-xl font-black">
                          No widgets found
                        </h3>
                        <p className="mt-2 text-sm text-zinc-400">
                          Try another search or category.
                        </p>
                      </Card>
                    ) : (
                      <div className="grid gap-5 xl:grid-cols-2">
                        {filteredWidgets.map((widget) => {
                          const widgetUnlocked = canUse(
                            currentPlan,
                            widget.requiredFeature,
                          );
                          const isFavorite = favoriteWidgetIds.includes(
                            widget.id,
                          );
                          const mobilePreviewOpen =
                            mobilePreviewId === widget.id;

                          return (
                            <Card
                              key={widget.id}
                              className="flex min-h-[640px] flex-col overflow-hidden"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-xl font-black sm:text-2xl">
                                      {widget.name}
                                    </h3>

                                    <span className="rounded-full bg-violet-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-violet-200">
                                      {widget.badge}
                                    </span>

                                    <ReleaseBadge
                                      status={widget.releaseStatus}
                                    />

                                    <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[10px] font-black text-zinc-400">
                                      {widget.version}
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                                    {widget.description}
                                  </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleFavorite(widget.id)}
                                    aria-label={
                                      isFavorite
                                        ? "Remove from favorites"
                                        : "Add to favorites"
                                    }
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-lg transition ${
                                      isFavorite
                                        ? "border-yellow-400/50 bg-yellow-400/15"
                                        : "border-zinc-700 bg-zinc-900 grayscale hover:grayscale-0"
                                    }`}
                                  >
                                    ⭐
                                  </button>

                                  {widgetUnlocked ? (
                                    <span className="rounded-full bg-green-600 px-3 py-1 text-[10px] font-black">
                                      LIVE
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-pink-600/80 px-3 py-1 text-[10px] font-black">
                                      LOCKED
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-5">
                                {widget.vehiclePicker && (
                                  <PickerGrid
                                    title="Choose Vehicle"
                                    items={VEHICLES}
                                    selectedId={selectedVehicle}
                                    onSelect={selectVehicle}
                                    disabled={
                                      !canSaveSettings || !widgetUnlocked
                                    }
                                    selectedClassName="border-yellow-500 bg-yellow-500/20"
                                  />
                                )}

                                {widget.petPicker && (
                                  <PetPicker
                                    selectedPet={selectedPet}
                                    onSelect={selectPet}
                                    disabled={!widgetUnlocked}
                                  />
                                )}
                              </div>

                              {widgetUnlocked ? (
                                <>
                                  <div className="mt-1 hidden md:block">
                                    <WidgetPreview
                                      widget={widget}
                                      mode="desktop"
                                    />
                                  </div>

                                  <div className="mt-1 md:hidden">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMobilePreviewId((current) =>
                                          current === widget.id
                                            ? ""
                                            : widget.id,
                                        )
                                      }
                                      className="flex w-full items-center justify-between rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-left font-black"
                                    >
                                      <span>
                                        👁️{" "}
                                        {mobilePreviewOpen
                                          ? "ซ่อนตัวอย่าง"
                                          : "ดูตัวอย่าง Widget"}
                                      </span>
                                      <span className="text-zinc-400">
                                        {mobilePreviewOpen ? "▲" : "▼"}
                                      </span>
                                    </button>

                                    {mobilePreviewOpen && (
                                      <div className="mt-3">
                                        <WidgetPreview
                                          widget={widget}
                                          mode="mobile"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="mt-5 rounded-3xl border border-pink-500/30 bg-pink-500/10 p-8 text-center">
                                  <div className="text-4xl">🔒</div>
                                  <div className="mt-3 text-xl font-black">
                                    Creator Feature
                                  </div>
                                  <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-300">
                                    Upgrade to unlock the live preview, settings
                                    and OBS controls.
                                  </p>
                                  <Button
                                    onClick={() => setUpgradeModalOpen(true)}
                                    variant="upgrade"
                                    className="mt-5"
                                  >
                                    Upgrade
                                  </Button>
                                </div>
                              )}

                              <div className="mt-auto pt-5">
                                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
                                  <div className="mb-1 flex items-center justify-between gap-3">
                                    <span className="font-black text-zinc-300">
                                      OBS Overlay URL
                                    </span>
                                    <span className="rounded-full bg-zinc-800 px-2 py-1 text-[9px] font-black text-zinc-500">
                                      1920×1080
                                    </span>
                                  </div>
                                  <div className="truncate">
                                    {widgetUnlocked
                                      ? widget.url
                                      : "Upgrade to unlock this overlay"}
                                  </div>
                                </div>

                                {widgetUnlocked && (
                                  <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                                    {widget.configureHref ? (
                                      <Button
                                        href={widget.configureHref}
                                        variant="upgrade"
                                        className="w-full sm:w-auto"
                                      >
                                        ⚙️ Configure
                                      </Button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled
                                        title="Settings page coming soon"
                                        className="w-full cursor-not-allowed rounded-xl bg-zinc-800 px-4 py-2 font-bold text-zinc-500 sm:w-auto"
                                      >
                                        ⚙️ Configure
                                      </button>
                                    )}

                                    <Button
                                      onClick={() =>
                                        window.open(
                                          widget.url,
                                          "_blank",
                                          "noopener,noreferrer",
                                        )
                                      }
                                      variant="secondary"
                                      className="w-full sm:w-auto"
                                    >
                                      Open Overlay
                                    </Button>

                                    <Button
                                      onClick={() => copy(widget.url)}
                                      disabled={!canCopy}
                                      variant="secondary"
                                      className="w-full sm:w-auto"
                                    >
                                      Copy OBS
                                    </Button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        emitWidgetEvent(widget.testEvent)
                                      }
                                      disabled={!canTest}
                                      className={`w-full rounded-xl px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${widget.testButtonClass}`}
                                    >
                                      {widget.testLabel}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        emitWidgetEvent(widget.resetEvent)
                                      }
                                      disabled={!canReset}
                                      className={`w-full rounded-xl px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${widget.resetButtonClass}`}
                                    >
                                      {widget.resetLabel}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section className="mt-10">
                    <div className="mb-6">
                      <div className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">
                        Seller Mode
                      </div>
                      <h2 className="mt-2 text-3xl font-black">
                        Seller Widgets
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                        Tools designed for live sellers. These cards prepare the
                        structure for the Seller plan.
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      <ComingSoonWidgetCard
                        icon="🔥"
                        title="Flash Sale"
                        description="Show a product, sale price and countdown timer during your live."
                      />
                      <ComingSoonWidgetCard
                        icon="💬"
                        title="Comment Picker"
                        description="Pick comments and customer codes directly from the live audience."
                      />
                      <ComingSoonWidgetCard
                        icon="🏆"
                        title="Lucky Buyer"
                        description="Celebrate a selected buyer with rewards, coupons or free shipping."
                      />
                    </div>
                  </section>
                </>
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
              style={{ width: 80, height: "auto" }}
            />
            <div className="text-sm font-bold">{item.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

type PetPickerProps = {
  selectedPet: PetType;
  disabled: boolean;
  onSelect: (petType: PetType) => void;
};

function PetPicker({ selectedPet, disabled, onSelect }: PetPickerProps) {
  return (
    <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-3 font-bold">Choose Pet</div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {PETS.map((pet) => (
          <button
            key={pet.id}
            type="button"
            onClick={() => onSelect(pet.id)}
            disabled={disabled}
            className={`rounded-2xl border p-4 text-center transition disabled:cursor-not-allowed disabled:opacity-50 ${
              selectedPet === pet.id
                ? "border-cyan-500 bg-cyan-500/20"
                : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
            }`}
          >
            <div className="text-4xl">{pet.emoji}</div>
            <div className="mt-2 text-sm font-black">{pet.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

type WidgetPreviewProps = {
  widget: WidgetItem;
  mode: "desktop" | "mobile";
};

function WidgetPreview({ widget, mode }: WidgetPreviewProps) {
  const heightClass = mode === "desktop" ? "h-[330px]" : "h-[390px]";

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-700 bg-black shadow-inner">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_9px_rgba(74,222,128,0.9)]" />
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200">
            OBS Preview
          </span>
        </div>

        <span className="rounded-full bg-zinc-800 px-2 py-1 text-[9px] font-black text-zinc-400">
          {mode === "desktop" ? "DESKTOP" : "MOBILE"}
        </span>
      </div>

      <div className={`relative overflow-hidden bg-[#050505] ${heightClass}`}>
        <iframe
          key={`${mode}-${widget.url}`}
          src={widget.url}
          title={`${widget.name} ${mode} preview`}
          loading="lazy"
          className="absolute left-1/2 top-1/2 border-0"
          style={{
            width: `${100 / widget.previewZoom}%`,
            height: `${100 / widget.previewZoom}%`,
            transform: `translate(-50%, -50%) scale(${widget.previewZoom})`,
            transformOrigin: "center",
          }}
        />

        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
      </div>
    </div>
  );
}

function ReleaseBadge({ status }: { status: WidgetReleaseStatus }) {
  const className =
    status === "new"
      ? "bg-pink-500/20 text-pink-200"
      : status === "beta"
        ? "bg-amber-500/20 text-amber-200"
        : "bg-emerald-500/15 text-emerald-200";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${className}`}
    >
      {status}
    </span>
  );
}

type ComingSoonWidgetCardProps = {
  icon: string;
  title: string;
  description: string;
};

function ComingSoonWidgetCard({
  icon,
  title,
  description,
}: ComingSoonWidgetCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 text-[120px] opacity-[0.04]">
        {icon}
      </div>

      <div className="relative">
        <div className="text-4xl">{icon}</div>
        <h3 className="mt-4 text-xl font-black">{title}</h3>
        <p className="mt-2 min-h-16 text-sm leading-relaxed text-zinc-400">
          {description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-200">
            Seller Plan
          </span>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-black text-zinc-400">
            Coming Soon
          </span>
        </div>
      </div>
    </Card>
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
"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Subscription } from "@/lib/core/types";
import {
  canConnectTikTok,
  canCopyOverlay,
  canResetWidget,
  canSaveWidgetSettings,
  canTestWidget,
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
    name: "vespa",
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

      const { data: subscriptionData, error: subscriptionError } = await supabase
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
      alert("Trial ของคุณหมดแล้ว กรุณา Upgrade เพื่อใช้งานต่อ");
      return;
    }

    const savedCreatorUsername = profile?.tiktok_username?.trim();

    if (!savedCreatorUsername) {
      alert("ยังไม่ได้ตั้งค่า Creator Account กรุณาไปที่ My Profile");
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
      alert("Trial ของคุณหมดแล้ว กรุณา Upgrade เพื่อใช้งานต่อ");
      return;
    }

    setOverlayId(profile?.overlay_id || overlayId || self.crypto.randomUUID());
    setUsername("TEST MODE");
    setStatus("success");
  };

  const copy = async (url: string) => {
    if (!canCopy) {
      alert("Trial ของคุณหมดแล้ว กรุณา Upgrade เพื่อคัดลอก Overlay URL");
      return;
    }

    await navigator.clipboard.writeText(url);
    alert("คัดลอก URL แล้ว");
  };

  const saveWidgetSettings = async (settings: Partial<WidgetSettings>) => {
    if (!canSaveSettings) {
      alert("Trial ของคุณหมดแล้ว กรุณา Upgrade เพื่อบันทึก Widget Settings");
      return;
    }

    if (!userId) return;

    try {
      setSavingSettings(true);

      const { error } = await supabase
        .from("widget_settings")
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Save widget settings error:", error);
        alert("บันทึก Widget Settings ไม่สำเร็จ");
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
          description: "เป้าหมายของขวัญ เช่น Rose 0/100",
          url: `${window.location.origin}/widget/gift-goal/${overlayId}`,
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
          description: "ของขวัญลอยสะสมในโคมเวทมนตร์",
          url: `${window.location.origin}/widget/magic-lantern/${overlayId}?lantern=${selectedLantern}`,
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
          description: "รถวิ่งผ่านบนพรมกุหลาบ",
          url: `${window.location.origin}/widget/gift-vehicle/${overlayId}?vehicle=${selectedVehicle}`,
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
          description: "ของขวัญตกลงตะกร้าและกองสะสมบนจอ",
          url: `${window.location.origin}/widget/gift-plane/${overlayId}?basket=${selectedBasket}`,
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
          name: "🙏🏻 Sathu 99",
          description: "ส่งของขวัญ 99 เหรียญขึ้นไป เพื่อรับคำทำนาย",
          url: `${window.location.origin}/widget/fortune-stick/${overlayId}`,
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
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 text-sm font-bold text-pink-400">
              Ready to create an amazing live today?
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
            <div className="text-sm text-zinc-400">Plan</div>
            <div className="mt-2 text-2xl font-black capitalize text-pink-300">
              {profileLoading ? "..." : subscription?.plan || "trial"}
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
            <div className="text-sm text-zinc-400">TikTok</div>
            <div className="mt-2 break-all text-2xl font-black text-yellow-300">
              {profileLoading
                ? "..."
                : profile?.tiktok_username
                  ? `@${profile.tiktok_username}`
                  : "Not set"}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 md:col-span-2">
            <div className="text-sm text-zinc-400">Your Overlay ID</div>
            <div className="mt-2 break-all rounded-xl bg-zinc-950 p-3 text-sm font-bold text-zinc-200">
              {profileLoading ? "Loading..." : profile?.overlay_id || overlayId || "-"}
            </div>
          </div>
        </section>

        {trialExpired && subscription?.plan === "trial" && (
          <section className="mb-8 rounded-3xl border border-red-500 bg-red-500/10 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-red-200">
                  Trial ของคุณหมดอายุแล้ว
                </h2>

                <p className="mt-2 text-sm text-red-100/80">
                  ตอนนี้ปุ่ม Connect และ Test Widget ถูกปิดไว้ชั่วคราว
                  กรุณาอัปเกรดแพ็กเกจเพื่อใช้งาน OMSW Live ต่อ
                </p>
              </div>

              <a
                href="/pricing"
                className="w-fit rounded-xl bg-pink-600 px-5 py-3 font-bold transition hover:bg-pink-500"
              >
                Upgrade Plan
              </a>
            </div>
          </section>
        )}

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold"> Live Connection</h2>

            <div className="text-sm text-zinc-400">
              {settingsLoading
                ? "กำลังโหลด Widget Settings..."
                : savingSettings
                  ? "กำลังบันทึก Settings..."
                  : "Widget Settings บันทึกอัตโนมัติแล้ว"}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 p-4">
              <div className="text-sm text-zinc-400">Creator Username</div>
              <div className="mt-1 text-xl font-black text-white">
                {profile?.tiktok_username ? `@${profile.tiktok_username}` : "ยังไม่ได้ตั้งค่า"}
              </div>

              {!profile?.tiktok_username && (
                <a
                  href="/profile"
                  className="mt-2 inline-block text-sm font-bold text-pink-400 hover:text-pink-300"
                >
                  ไปตั้งค่า Creator Account
                </a>
              )}
            </div>

            <button
              onClick={connectTikTok}
              disabled={loading || !profile?.tiktok_username || !canConnect}
              className="rounded-xl bg-pink-600 px-6 py-4 font-bold transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "กำลังเชื่อมต่อ..." : "Connect"}
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
                ⚪ ยังไม่ได้เชื่อมต่อ
                <div className="mt-1 text-sm text-zinc-400">
                  กรอก Creator Username แล้วกด Connect
                </div>
              </div>
            )}

            {status === "not-live" && (
              <div className="rounded-2xl border border-yellow-500 bg-yellow-500/20 px-4 py-3">
                🟡 ไม่พบบัญชีที่กำลัง Live
                <div className="mt-1 text-sm text-yellow-200">
                  กรุณาเริ่ม Live แล้วกด Connect อีกครั้ง
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="rounded-2xl border border-green-500 bg-green-500/20 px-4 py-3">
                🟢 เชื่อมต่อสำเร็จ
                <div className="mt-1 text-sm text-green-200">
                  บัญชี: @{profile?.tiktok_username || username}
                </div>
              </div>
            )}

            {status === "server-error" && (
              <div className="rounded-2xl border border-red-500 bg-red-500/20 px-4 py-3">
                🔴 ไม่สามารถเชื่อมต่อ Server ได้
                <div className="mt-1 text-sm text-red-200">
                  กรุณาลองใหม่อีกครั้ง
                </div>
              </div>
            )}
          </div>
        </section>

        {overlayId && (
          <section>
            <h2 className="mb-6 text-2xl font-bold">Widgets</h2>

            <div className="space-y-6">
              {widgets.map((widget) => (
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

                    {widget.active ? (
                      <span className="w-fit rounded-full bg-green-600 px-3 py-1 text-sm">
                        Active
                      </span>
                    ) : (
                      <span className="w-fit rounded-full bg-zinc-700 px-3 py-1 text-sm">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {widget.basketPicker && (
                    <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="mb-3 font-bold">เลือกตะกร้า</div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {BASKETS.map((basket) => (
                          <button
                            key={basket.id}
                            onClick={() => selectBasket(basket.id)}
                            disabled={!canSaveSettings}
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
                      <div className="mb-3 font-bold">เลือกรถ</div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {VEHICLES.map((vehicle) => (
                          <button
                            key={vehicle.id}
                            onClick={() => selectVehicle(vehicle.id)}
                            disabled={!canSaveSettings}
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
                      <div className="mb-3 font-bold">เลือกโคม</div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {LANTERNS.map((lantern) => (
                          <button
                            key={lantern.id}
                            onClick={() => selectLantern(lantern.id)}
                            disabled={!canSaveSettings}
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

                  <div className="mb-4 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950">
                    <iframe
                      key={widget.url}
                      src={widget.url}
                      className="h-[560px] w-full"
                    />
                  </div>

                  <input
                    readOnly
                    value={canCopy ? widget.url : "🔒 Upgrade to view Overlay URL"}
                    className="mb-4 w-full rounded-xl bg-zinc-800 p-3 text-sm text-zinc-200"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => copy(widget.url)}
                      disabled={!canCopy}
                      className="rounded-xl bg-purple-600 px-4 py-2 font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {canCopy ? "คัดลอก" : "🔒 คัดลอก"}
                    </button>

                    <button
                      onClick={() => window.open(widget.url, "_blank")}
                      className="rounded-xl bg-zinc-700 px-4 py-2 font-bold transition hover:bg-zinc-600"
                    >
                      Preview
                    </button>

                    {widget.active && (
                      <>
                        <button
                          onClick={() => {
                            if (!canTest) {
                              alert("Trial ของคุณหมดแล้ว กรุณา Upgrade เพื่อใช้งานต่อ");
                              return;
                            }

                            socket.emit(widget.testEvent, {
                              overlayId,
                            });
                          }}
                          disabled={!canTest}
                          className={`rounded-xl px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${widget.testButtonClass}`}
                        >
                          {widget.testLabel}
                        </button>

                        <button
                          onClick={() => {
                            if (!canReset) {
                              alert("Trial ของคุณหมดแล้ว กรุณา Upgrade เพื่อใช้งานต่อ");
                              return;
                            }

                            socket.emit(widget.resetEvent, {
                              overlayId,
                            });
                          }}
                          disabled={!canReset}
                          className={`rounded-xl px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${widget.resetButtonClass}`}
                        >
                          {widget.resetLabel}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

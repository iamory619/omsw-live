"use client";

import { useMemo, useState } from "react";
import { io } from "socket.io-client";

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

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [overlayId, setOverlayId] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState("basket-1");
  const [selectedVehicle, setSelectedVehicle] = useState("tuktuk");

  const socket = useMemo(() => {
    return io("https://server-production-b88b.up.railway.app");
  }, []);

  const [status, setStatus] = useState<
    "idle" | "not-live" | "success" | "server-error"
  >("idle");

  const connectTikTok = async () => {
    if (!username.trim()) {
      alert("กรุณากรอก TikTok Username");
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
          },
          body: JSON.stringify({ username }),
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

      setOverlayId(data.overlayId);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("server-error");
    } finally {
      setLoading(false);
    }
  };

  const createTestOverlay = () => {
    const testId = self.crypto.randomUUID();

    setOverlayId(testId);
    setUsername("TEST MODE");
    setStatus("success");
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    alert("คัดลอก URL แล้ว");
  };

  const widgets = overlayId
    ? [
        {
          name: "🎁 Gift Goal",
          description: "เป้าหมายของขวัญ เช่น Rose 0/100",
          url: `${window.location.origin}/widget/gift-goal/${overlayId}`,
          active: true,
        },
        {
          name: "🔮 Magic Lantern",
          description: "ของขวัญลอยสะสมในโคมเวทมนตร์",
          url: `${window.location.origin}/widget/magic-lantern/${overlayId}`,
          active: true,
        },
        {
          name: "🛺 Gift Vehicle",
          description: "รถวิ่งผ่านบนพรมกุหลาบ",
          url: `${window.location.origin}/widget/gift-vehicle/${overlayId}?vehicle=${selectedVehicle}`,
          active: true,
          vehiclePicker: true,
        },
        {
          name: "🧺 Gift Basket",
          description: "ของขวัญตกลงตะกร้าและกองสะสมบนจอ",
          url: `${window.location.origin}/widget/gift-plane/${overlayId}?basket=${selectedBasket}`,
          active: true,
          basketPicker: true,
        },
        {
          name: "🐱 Evolution Pet",
          description: "สัตว์เลี้ยงโตตามจำนวนของขวัญ",
          url: `${window.location.origin}/widget/pet/${overlayId}`,
          active: false,
        },
        {
          name: "🏆 Top Gifter",
          description: "จัดอันดับคนส่งของขวัญสูงสุด",
          url: `${window.location.origin}/widget/top-gifter/${overlayId}`,
          active: false,
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-4xl font-bold">OMSW Live Dashboard</h1>

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">TikTok Connection</h2>

          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              placeholder="TikTok Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 p-4"
            />

            <button
              onClick={connectTikTok}
              disabled={loading}
              className="rounded-xl bg-pink-600 px-6 py-4 font-bold"
            >
              {loading ? "กำลังเชื่อมต่อ..." : "Connect"}
            </button>

            <button
              onClick={createTestOverlay}
              className="rounded-xl bg-zinc-700 px-6 py-4 font-bold"
            >
              🧪 Test Overlay
            </button>
          </div>

          <div className="mt-6">
            {status === "idle" && (
              <div className="rounded-2xl bg-zinc-800 px-4 py-3">
                ⚪ ยังไม่ได้เชื่อมต่อ
                <div className="mt-1 text-sm text-zinc-400">
                  กรอก TikTok Username แล้วกด Connect
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
                  บัญชี: {username}
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
                            onClick={() => setSelectedBasket(basket.id)}
                            className={`rounded-2xl border p-3 transition ${
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
                            onClick={() => setSelectedVehicle(vehicle.id)}
                            className={`rounded-2xl border p-3 transition ${
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

                  <div className="mb-4 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950">
                    <iframe
                      key={widget.url}
                      src={widget.url}
                      className="h-[560px] w-full"
                    />
                  </div>

                  <input
                    readOnly
                    value={widget.url}
                    className="mb-4 w-full rounded-xl bg-zinc-800 p-3 text-sm text-zinc-200"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => copy(widget.url)}
                      className="rounded-xl bg-purple-600 px-4 py-2"
                    >
                      คัดลอก
                    </button>

                    <button
                      onClick={() => window.open(widget.url, "_blank")}
                      className="rounded-xl bg-zinc-700 px-4 py-2"
                    >
                      Preview
                    </button>

                    {widget.active && (
                      <>
                        <button
                          onClick={() => {
                            socket.emit("test-gift", overlayId);
                          }}
                          className="rounded-xl bg-pink-600 px-4 py-2 font-bold"
                        >
                          🌹 Test Rose
                        </button>

                        <button
                          onClick={() => {
                            socket.emit("reset-gift", overlayId);
                          }}
                          className="rounded-xl bg-red-600 px-4 py-2"
                        >
                          🔄 Reset
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

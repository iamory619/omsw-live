import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { WebcastPushConnection } from "tiktok-live-connector";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const app = express();

app.use(cors());
app.use(express.json());

const connections = new Map<string, WebcastPushConnection>();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn("⚠️ Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    "⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Gift Goal will use fallback settings.",
  );
}

const createSupabaseForUser = (accessToken: string) => {
  return createClient(supabaseUrl!, supabasePublishableKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

type TestPayload = {
  overlayId: string;
};

type GiftGoalSettings = {
  giftName: string;
  giftEmoji: string;
  giftImage: string;
  startValue: number;
  goalAmount: number;
};

type CachedGiftGoalSettings = {
  settings: GiftGoalSettings;
  expiresAt: number;
};

const DEFAULT_GIFT_GOAL_SETTINGS: GiftGoalSettings = {
  giftName: "Rose",
  giftEmoji: "🌹",
  giftImage: "/assets/rose.png",
  startValue: 0,
  goalAmount: 100,
};

const GIFT_GOAL_CACHE_TTL_MS = 30_000;
const giftGoalSettingsCache = new Map<string, CachedGiftGoalSettings>();

const getOverlayId = (payload: string | TestPayload) => {
  if (typeof payload === "string") {
    return payload;
  }

  return payload?.overlayId;
};

const normalizeGiftName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const createGiftPayload = ({
  user = "Mimi",
  uniqueId = "mimi",
  giftName = "Rose",
  amount = 1,
  repeatCount = amount,
  diamond = 1,
  giftImage = "/assets/rose.png",
}: {
  user?: string;
  uniqueId?: string;
  giftName?: string;
  amount?: number;
  repeatCount?: number;
  diamond?: number;
  giftImage?: string;
}) => {
  return {
    user,
    uniqueId,
    giftName,
    amount,
    repeatCount,
    diamond,
    giftImage,
  };
};

const createRosePayload = (
  repeatCount = 1,
  diamond = 1,
) => {
  return createGiftPayload({
    user: "Mimi",
    uniqueId: "mimi",
    giftName: "Rose",
    amount: repeatCount,
    repeatCount,
    diamond,
    giftImage: "/assets/rose.png",
  });
};

const getGiftGoalSettings = async (
  overlayId: string,
  forceRefresh = false,
): Promise<GiftGoalSettings> => {
  const cached = giftGoalSettingsCache.get(overlayId);

  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.settings;
  }

  if (!supabaseAdmin) {
    return DEFAULT_GIFT_GOAL_SETTINGS;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("overlay_id", overlayId)
    .maybeSingle();

  if (profileError) {
    console.error("Gift Goal profile lookup error:", profileError);
    return DEFAULT_GIFT_GOAL_SETTINGS;
  }

  if (!profile) {
    console.warn("Gift Goal profile not found for overlay:", overlayId);
    return DEFAULT_GIFT_GOAL_SETTINGS;
  }

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("gift_goal_settings")
    .select(
      "gift_name,gift_emoji,gift_image,start_value,goal_amount,updated_at",
    )
    .eq("user_id", profile.id)
    .maybeSingle();

  if (settingsError) {
    console.error("Gift Goal settings lookup error:", settingsError);
    return DEFAULT_GIFT_GOAL_SETTINGS;
  }

  const resolvedSettings: GiftGoalSettings = {
    giftName:
      typeof settings?.gift_name === "string" && settings.gift_name.trim()
        ? settings.gift_name.trim()
        : DEFAULT_GIFT_GOAL_SETTINGS.giftName,
    giftEmoji:
      typeof settings?.gift_emoji === "string" && settings.gift_emoji.trim()
        ? settings.gift_emoji.trim()
        : DEFAULT_GIFT_GOAL_SETTINGS.giftEmoji,
    giftImage:
      typeof settings?.gift_image === "string" && settings.gift_image.trim()
        ? settings.gift_image.trim()
        : DEFAULT_GIFT_GOAL_SETTINGS.giftImage,
    startValue: Math.max(0, Number(settings?.start_value) || 0),
    goalAmount: Math.max(1, Number(settings?.goal_amount) || 100),
  };

  giftGoalSettingsCache.set(overlayId, {
    settings: resolvedSettings,
    expiresAt: Date.now() + GIFT_GOAL_CACHE_TTL_MS,
  });

  return resolvedSettings;
};

app.post("/connect", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const accessToken = authHeader.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({
      code: "NO_TOKEN",
      error: "Missing access token",
    });
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    return res.status(500).json({
      code: "SUPABASE_CONFIG_MISSING",
      error: "Server configuration is incomplete",
    });
  }

  const supabase = createSupabaseForUser(accessToken);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return res.status(401).json({
      code: "INVALID_TOKEN",
      error: "Invalid session",
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,display_name,tiktok_username,overlay_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({
      code: "PROFILE_NOT_FOUND",
      error: "ไม่พบข้อมูลโปรไฟล์",
    });
  }

  const username = profile.tiktok_username;

  if (!username) {
    return res.status(400).json({
      code: "NO_TIKTOK_USERNAME",
      error: "ยังไม่ได้ตั้งค่า Creator Account",
    });
  }

  const overlayId = profile.overlay_id || crypto.randomUUID();

  const oldConnection = connections.get(overlayId);

  if (oldConnection) {
    try {
      oldConnection.disconnect();
    } catch {
      // Ignore disconnect errors.
    }

    connections.delete(overlayId);
  }

  const tiktok = new WebcastPushConnection(username);

  try {
    await tiktok.connect();

    connections.set(overlayId, tiktok);

    // Refresh the selected Gift Goal when a creator connects.
    void getGiftGoalSettings(overlayId, true);

    tiktok.on("gift", async (data: any) => {
      /*
       * TikTok streak gifts can fire repeatedly before the streak ends.
       * Wait for repeatEnd so the final repeatCount is counted only once.
       */
      if (data.giftType === 1 && !data.repeatEnd) {
        return;
      }

      const repeatCount = Math.max(
        1,
        Number(data.repeatCount) || 1,
      );

      const giftPayload = createGiftPayload({
        user: data.nickname || "Someone",
        uniqueId: data.uniqueId || "",
        giftName: data.giftName || "Gift",
        amount: repeatCount,
        repeatCount,
        diamond: Math.max(0, Number(data.diamondCount) || 0),
        giftImage:
          data.giftPictureUrl ||
          data.giftDetails?.giftImage?.url?.[0] ||
          "/assets/gift-box.png",
      });

      const goalSettings = await getGiftGoalSettings(overlayId);

      if (
        normalizeGiftName(giftPayload.giftName) ===
        normalizeGiftName(goalSettings.giftName)
      ) {
        io.to(overlayId).emit("goal-gift", giftPayload);

        console.log("🎯 Gift Goal counted:", {
          overlayId,
          giftName: giftPayload.giftName,
          amount: giftPayload.amount,
          selectedGift: goalSettings.giftName,
        });
      } else {
        console.log("⏭️ Gift Goal ignored:", {
          overlayId,
          receivedGift: giftPayload.giftName,
          selectedGift: goalSettings.giftName,
        });
      }

      io.to(overlayId).emit("lantern-gift", giftPayload);
      io.to(overlayId).emit("vehicle-gift", giftPayload);
      io.to(overlayId).emit("basket-gift", giftPayload);
      io.to(overlayId).emit("fortune-gift", giftPayload);
      io.to(overlayId).emit("wheel-gift", giftPayload);
      io.to(overlayId).emit("pet-gift", giftPayload);
    });

    tiktok.on("chat", (data: any) => {
      io.to(overlayId).emit("chat-alert", {
        user: data.nickname || "Someone",
        comment: data.comment || "",
      });
    });

    tiktok.on("follow", (data: any) => {
      io.to(overlayId).emit("follow-alert", {
        user: data.nickname || "Someone",
      });
    });

    res.json({
      overlayId,
      username,
      displayName: profile.display_name,
      status: "connected",
    });
  } catch (err: any) {
    console.error("Account Connect Error:", err);

    const message = err?.message || "";

    if (message.includes("isn't online") || message.includes("offline")) {
      return res.status(400).json({
        code: "USER_OFFLINE",
        error: "บัญชีนี้ยังไม่ได้ Live",
      });
    }

    return res.status(500).json({
      code: "SERVER_ERROR",
      error: message || "Connect failed",
    });
  }
});

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("join-overlay", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("❌ Missing overlayId when joining room:", payload);
      return;
    }

    socket.join(overlayId);

    console.log("📺 Overlay joined:", {
      overlayId,
      socketId: socket.id,
      roomSize: io.sockets.adapter.rooms.get(overlayId)?.size ?? 0,
    });
  });

  socket.on("test-goal", async (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    const goalSettings = await getGiftGoalSettings(overlayId, true);

    io.to(overlayId).emit(
      "goal-gift",
      createGiftPayload({
        user: "Mimi",
        giftName: goalSettings.giftName,
        amount: 1,
        diamond: 1,
        giftImage: goalSettings.giftImage,
      }),
    );

    console.log("🧪 Test Gift Goal:", {
      overlayId,
      giftName: goalSettings.giftName,
      roomSize: io.sockets.adapter.rooms.get(overlayId)?.size ?? 0,
    });
  });

  socket.on("reset-goal", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("reset-goal");

    console.log("🔄 Reset Gift Goal:", {
      overlayId,
      roomSize: io.sockets.adapter.rooms.get(overlayId)?.size ?? 0,
    });
  });

  socket.on("test-lantern", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    /*
     * Test Legendary mode directly.
     * The widget also listens to "test-lantern", so emit only once
     * to avoid duplicate gifts appearing in the lantern.
     */
    const testGift = createGiftPayload({
      user: "Mimi",
      uniqueId: "mimi",
      giftName: "Legendary Rose",
      amount: 1,
      repeatCount: 1,
      diamond: 1,
      giftImage: "/assets/rose.png",
    });

    io.to(overlayId).emit("test-lantern", testGift);

    console.log("🧪 Test Magic Lantern:", {
      overlayId,
      giftName: testGift.giftName,
      diamond: testGift.diamond,
      repeatCount: testGift.repeatCount,
      roomSize: io.sockets.adapter.rooms.get(overlayId)?.size ?? 0,
    });
  });

  socket.on("reset-lantern", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("reset-lantern");
  });

  socket.on("test-vehicle", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("test-vehicle", createRosePayload(1));
    io.to(overlayId).emit("vehicle-gift", createRosePayload(1));
  });

  socket.on("reset-vehicle", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("reset-vehicle");
  });

  socket.on("test-basket", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("test-basket", createRosePayload(1));
    io.to(overlayId).emit("basket-gift", createRosePayload(1));
  });

  socket.on("reset-basket", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("reset-basket");
  });

  socket.on("test-fortune", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("test-fortune", createRosePayload(1, 99));
    io.to(overlayId).emit("fortune-gift", createRosePayload(1, 99));
  });

  socket.on("reset-fortune", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("reset-fortune");
  });

  socket.on("test-wheel", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    console.log("🎡 Server received test-wheel:", {
      overlayId,
      socketId: socket.id,
      roomSize: overlayId
        ? (io.sockets.adapter.rooms.get(overlayId)?.size ?? 0)
        : 0,
    });

    if (!overlayId) return;

    io.to(overlayId).emit(
      "test-wheel",
      createGiftPayload({
        user: "Mimi",
        giftName: "Rose",
        amount: 10,
        diamond: 10,
        giftImage: "/assets/rose.png",
      }),
    );
  });

  socket.on("reset-wheel", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("reset-wheel");
  });

  socket.on("test-pet", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("❌ Missing overlayId for test-pet:", payload);
      return;
    }

    const petTestPayload = {
      user: "Mimi",
      uniqueId: "mimi",
      giftName: "Rose",
      diamond: 1,
      repeatCount: 1,
      amount: 1,
      giftImage: "/assets/rose.png",
    };

    // ส่งผ่าน Event เดียวกับของขวัญจริง
    io.to(overlayId).emit("pet-gift", petTestPayload);

    console.log("🐾 Test Evolution Pet:", {
      overlayId,
      roomSize: io.sockets.adapter.rooms.get(overlayId)?.size ?? 0,
    });
  });

  socket.on("reset-pet", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("reset-pet");

    console.log("🔄 Reset Evolution Pet:", {
      overlayId,
      roomSize: io.sockets.adapter.rooms.get(overlayId)?.size ?? 0,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("⚠️ Socket disconnected:", socket.id, reason);
  });
});

app.get("/", (_, res) => {
  res.json({
    status: "ok",
    service: "OMSW Live Server",
  });
});

const PORT = Number(process.env.PORT) || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 OMSW Live Server running on port ${PORT}`);
});

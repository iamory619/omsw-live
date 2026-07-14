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

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn("⚠️ Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");
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

let testRose = 0;

type TestPayload = {
  overlayId: string;
};

const getOverlayId = (payload: string | TestPayload) => {
  if (typeof payload === "string") {
    return payload;
  }

  return payload?.overlayId;
};

const createRosePayload = (amount = 1) => {
  return {
    user: "Mimi",
    giftName: "Rose",
    amount,
    diamond: amount,
    giftImage: "/assets/rose.png",
  };
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

    tiktok.on("gift", (data: any) => {
      const giftPayload = {
        user: data.nickname || "Someone",
        giftName: data.giftName || "Gift",
        amount: data.repeatCount || 1,
        diamond: data.diamondCount || 0,
        giftImage:
          data.giftPictureUrl ||
          data.giftDetails?.giftImage?.url?.[0] ||
          "/assets/gift-box.png",
      };

      io.to(overlayId).emit("goal-gift", giftPayload);
      io.to(overlayId).emit("lantern-gift", giftPayload);
      io.to(overlayId).emit("vehicle-gift", giftPayload);
      io.to(overlayId).emit("basket-gift", giftPayload);
      io.to(overlayId).emit("fortune-gift", giftPayload);
      io.to(overlayId).emit("wheel-gift", giftPayload);
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

    res.status(500).json({
      code: "SERVER_ERROR",
      error: message || "Connect failed",
    });
  }
});

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("join-overlay", (overlayId: string) => {
    console.log("📺 Overlay joined:", overlayId, socket.id);
    socket.join(overlayId);
  });

  socket.on("test-goal", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    testRose++;

    io.to(overlayId).emit("gift-progress", testRose);
    io.to(overlayId).emit("goal-gift", createRosePayload(1));
  });

  socket.on("reset-goal", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    testRose = 0;

    io.to(overlayId).emit("gift-progress", 0);
    io.to(overlayId).emit("reset-goal");
  });

  socket.on("test-lantern", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("test-lantern", createRosePayload(1));
    io.to(overlayId).emit("lantern-gift", createRosePayload(1));
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

    io.to(overlayId).emit("test-fortune", createRosePayload(99));
    io.to(overlayId).emit("fortune-gift", createRosePayload(99));
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

    io.to(overlayId).emit("test-wheel", {
      user: "Mimi",
      giftName: "Rose",
      amount: 10,
      diamond: 10,
      giftImage: "/assets/rose.png",
    });
  });

  socket.on("reset-wheel", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) return;

    io.to(overlayId).emit("reset-wheel");
  });

  socket.on("disconnect", () => {});
});

app.get("/", (_, res) => {
  res.json({
    status: "ok",
    service: "OMSW Live Server",
  });
});

const PORT = Number(process.env.PORT) || 4000;

httpServer.listen(PORT, () => {});

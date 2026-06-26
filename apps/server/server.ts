import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { WebcastPushConnection } from "tiktok-live-connector";
import crypto from "crypto";

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
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      error: "username required",
    });
  }

  const overlayId = crypto.randomUUID();
  const tiktok = new WebcastPushConnection(username);

  try {
    await tiktok.connect();

    connections.set(overlayId, tiktok);

    tiktok.on("gift", (data: any) => {
      console.log("GIFT DATA:", JSON.stringify(data, null, 2));

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

      io.to(overlayId).emit(
        "gift-alert",
        `🎁 ${giftPayload.user} sent ${giftPayload.giftName} x${giftPayload.amount}`,
      );

      // ของจริงจาก TikTok ยังส่งให้ Widget หลักตามเดิม
      io.to(overlayId).emit("gift-plane", giftPayload);
      io.to(overlayId).emit("gift-progress", giftPayload.amount);
    });

    tiktok.on("chat", (data: any) => {
      io.to(overlayId).emit(
        "gift-alert",
        `💬 ${data.nickname}: ${data.comment}`,
      );
    });

    tiktok.on("follow", (data: any) => {
      io.to(overlayId).emit("gift-alert", `❤️ ${data.nickname} followed`);
    });

    res.json({
      overlayId,
    });
  } catch (err: any) {
    console.error("TikTok Connect Error:", err);

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
  console.log("✅ Client connected:", socket.id);

  socket.on("join-overlay", (overlayId: string) => {
    socket.join(overlayId);
    console.log(`📺 Overlay joined room: ${overlayId}`);
  });

  socket.on("test-goal", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ test-goal missing overlayId:", payload);
      return;
    }

    testRose++;

    console.log("🎯 Test Goal:", overlayId, testRose);

    io.to(overlayId).emit("gift-progress", testRose);
  });

  socket.on("reset-goal", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ reset-goal missing overlayId:", payload);
      return;
    }

    testRose = 0;

    console.log("🔄 Reset Goal:", overlayId);

    io.to(overlayId).emit("gift-progress", 0);
  });

  socket.on("test-lantern", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ test-lantern missing overlayId:", payload);
      return;
    }

    console.log("🧙 Test Lantern:", overlayId);

    // ส่งเฉพาะ Lantern เท่านั้น
    io.to(overlayId).emit("test-lantern", createRosePayload(1));
  });

  socket.on("reset-lantern", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ reset-lantern missing overlayId:", payload);
      return;
    }

    console.log("🔄 Reset Lantern:", overlayId);

    io.to(overlayId).emit("reset-lantern");
  });

  socket.on("test-vehicle", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ test-vehicle missing overlayId:", payload);
      return;
    }

    console.log("🛺 Test Vehicle:", overlayId);

    // ส่งเฉพาะ Vehicle เท่านั้น
    io.to(overlayId).emit("test-vehicle", createRosePayload(1));
  });

  socket.on("reset-vehicle", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ reset-vehicle missing overlayId:", payload);
      return;
    }

    console.log("🔄 Reset Vehicle:", overlayId);

    io.to(overlayId).emit("reset-vehicle");
  });

  socket.on("test-basket", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ test-basket missing overlayId:", payload);
      return;
    }

    console.log("🧺 Test Basket:", overlayId);

    // ส่งเฉพาะ Basket เท่านั้น
    // ใช้ test-basket เป็นหลัก เพื่อไม่ให้ไปปลุก Widget อื่น
    io.to(overlayId).emit("test-basket", createRosePayload(1));
  });

  socket.on("reset-basket", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ reset-basket missing overlayId:", payload);
      return;
    }

    console.log("🔄 Reset Basket:", overlayId);

    io.to(overlayId).emit("reset-basket");
  });

  socket.on("test-fortune", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ test-fortune missing overlayId:", payload);
      return;
    }

    console.log("🙏 Test Fortune:", overlayId);

    // ส่งเฉพาะ Sathu 99 เท่านั้น
    io.to(overlayId).emit("test-fortune", createRosePayload(99));
  });

  socket.on("reset-fortune", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    if (!overlayId) {
      console.log("⚠️ reset-fortune missing overlayId:", payload);
      return;
    }

    console.log("🔄 Reset Fortune:", overlayId);

    io.to(overlayId).emit("reset-fortune");
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
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

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

  return payload.overlayId;
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

      io.to(overlayId).emit("gift-plane", giftPayload);
      io.to(overlayId).emit("gift-basket", giftPayload);
      io.to(overlayId).emit("gift-vehicle", giftPayload);
      io.to(overlayId).emit("gift-lantern", giftPayload);
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

    testRose++;

    console.log("🎯 Test Goal:", testRose);

    const giftPayload = {
      user: "Mimi",
      giftName: "Rose",
      amount: 1,
      diamond: 1,
      giftImage: "/assets/rose.png",
    };

    io.to(overlayId).emit("gift-alert", "🎯 Test Goal: Rose x1");
    io.to(overlayId).emit("gift-progress", testRose);
  });

  socket.on("reset-goal", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    testRose = 0;

    console.log("🔄 Reset Goal");

    io.to(overlayId).emit("gift-progress", 0);
    io.to(overlayId).emit("reset-goal");
  });

  socket.on("test-lantern", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    console.log("🧙 Test Lantern");

    const giftPayload = {
      user: "Mimi",
      giftName: "Rose",
      amount: 1,
      diamond: 1,
      giftImage: "/assets/rose.png",
    };

    io.to(overlayId).emit("test-lantern", giftPayload);
    io.to(overlayId).emit("gift-lantern", giftPayload);
  });

  socket.on("reset-lantern", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    console.log("🔄 Reset Lantern");

    io.to(overlayId).emit("reset-lantern");
  });

  socket.on("test-vehicle", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    console.log("🛺 Test Vehicle");

    const giftPayload = {
      user: "Mimi",
      giftName: "Rose",
      amount: 1,
      diamond: 1,
      giftImage: "/assets/rose.png",
    };

    io.to(overlayId).emit("test-vehicle", giftPayload);
    io.to(overlayId).emit("gift-vehicle", giftPayload);
  });

  socket.on("reset-vehicle", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    console.log("🔄 Reset Vehicle");

    io.to(overlayId).emit("reset-vehicle");
  });

  socket.on("test-basket", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    console.log("🧺 Test Basket");

    const giftPayload = {
      user: "Mimi",
      giftName: "Rose",
      amount: 1,
      diamond: 1,
      giftImage: "/assets/rose.png",
    };

    io.to(overlayId).emit("test-basket", giftPayload);
    io.to(overlayId).emit("gift-plane", giftPayload);
    io.to(overlayId).emit("gift-basket", giftPayload);
  });

  socket.on("reset-basket", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    console.log("🔄 Reset Basket");

    io.to(overlayId).emit("reset-basket");
  });

  socket.on("test-fortune", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    console.log("🙏 Test Fortune");

    io.to(overlayId).emit("test-fortune", {
      user: "Mimi",
      giftName: "Rose",
      amount: 99,
      diamond: 99,
      giftImage: "/assets/rose.png",
    });
  });

  socket.on("reset-fortune", (payload: string | TestPayload) => {
    const overlayId = getOverlayId(payload);

    console.log("🔄 Reset Fortune");

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

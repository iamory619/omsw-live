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
        `🎁 ${giftPayload.user} sent ${giftPayload.giftName} x${giftPayload.amount}`
      );

      io.to(overlayId).emit("gift-plane", giftPayload);
    });

    tiktok.on("chat", (data: any) => {
      io.to(overlayId).emit(
        "gift-alert",
        `💬 ${data.nickname}: ${data.comment}`
      );
    });

    tiktok.on("follow", (data: any) => {
      io.to(overlayId).emit(
        "gift-alert",
        `❤️ ${data.nickname} followed`
      );
    });

    res.json({
      overlayId,
    });
  } catch (err: any) {
    console.error("TikTok Connect Error:", err);

    const message = err?.message || "";

    if (
      message.includes("isn't online") ||
      message.includes("offline")
    ) {
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

  socket.on("test-gift", (overlayId: string) => {
    testRose++;

    console.log("🌹 Test Rose:", testRose);

    const giftPayload = {
      user: "Mimi",
      giftName: "Rose",
      amount: 1,
      diamond: 1,
      giftImage: "/assets/rose.png",
    };

    io.to(overlayId).emit("gift-alert", "🌹 Rose x1");
    io.to(overlayId).emit("gift-progress", testRose);
    io.to(overlayId).emit("gift-plane", giftPayload);
  });

  socket.on("reset-gift", (overlayId: string) => {
    testRose = 0;

    console.log("🔄 Reset Gift");

    io.to(overlayId).emit("gift-progress", 0);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });

  socket.on("test-lantern", (overlayId) => {
  io.to(overlayId).emit("test-lantern");
});

socket.on("reset-lantern", (overlayId) => {
  io.to(overlayId).emit("reset-lantern");
});

socket.on("test-vehicle", (overlayId) => {
  io.to(overlayId).emit("test-vehicle");
});

socket.on("reset-vehicle", (overlayId) => {
  io.to(overlayId).emit("reset-vehicle");
});

socket.on("test-basket", (overlayId) => {
  io.to(overlayId).emit("test-basket");
});

socket.on("reset-basket", (overlayId) => {
  io.to(overlayId).emit("reset-basket");
});

socket.on("test-fortune", (overlayId) => {
  io.to(overlayId).emit("test-fortune");
});

socket.on("reset-fortune", (overlayId) => {
  io.to(overlayId).emit("reset-fortune");
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
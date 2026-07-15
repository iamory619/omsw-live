"use client";

import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  WidgetSocketOptions,
  WidgetSocketStatus,
} from "../types";
import { WIDGET_EVENTS } from "../events/widget-events";

export function useWidgetSocket({
  serverUrl,
  overlayId,
  autoConnect = true,
  reconnection = true,
  reconnectionAttempts = 10,
  reconnectionDelay = 1000,
  timeout = 20000,
}: WidgetSocketOptions) {
  const [status, setStatus] =
    useState<WidgetSocketStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const socket = useMemo<Socket>(
    () =>
      io(serverUrl, {
        autoConnect: false,
        reconnection,
        reconnectionAttempts,
        reconnectionDelay,
        timeout,
      }),
    [
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      serverUrl,
      timeout,
    ],
  );

  useEffect(() => {
    if (!overlayId) return;

    const joinOverlay = () => {
      socket.emit(WIDGET_EVENTS.JOIN_OVERLAY, overlayId);
      setStatus("connected");
      setError(null);
    };

    const handleConnecting = () => {
      setStatus("connecting");
    };

    const handleDisconnect = () => {
      setStatus("disconnected");
    };

    const handleConnectError = (connectError: Error) => {
      setStatus("error");
      setError(connectError.message);
    };

    socket.on("connect", joinOverlay);
    socket.on("reconnect_attempt", handleConnecting);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (autoConnect && !socket.connected) {
      setStatus("connecting");
      socket.connect();
    }

    return () => {
      socket.off("connect", joinOverlay);
      socket.off("reconnect_attempt", handleConnecting);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [autoConnect, overlayId, socket]);

  return {
    socket,
    status,
    error,
    connect: () => socket.connect(),
    disconnect: () => socket.disconnect(),
  };
}

"use client";

import { useEffect } from "react";

type ToastType = "success" | "error" | "info";

export type ToastMessage = {
  id: string;
  type: ToastType;
  message: string;
};

type Props = {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
};

export function ToastStack({ toasts, removeToast }: Props) {
  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        removeToast(toast.id);
      }, 3500),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, removeToast]);

  return (
    <div className="fixed right-4 top-4 z-[9999] space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[280px] rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl backdrop-blur ${
            toast.type === "success"
              ? "border-green-500 bg-green-500/20 text-green-100"
              : toast.type === "error"
                ? "border-red-500 bg-red-500/20 text-red-100"
                : "border-zinc-500 bg-zinc-900/90 text-zinc-100"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function createToast(
  message: string,
  type: ToastType = "success",
): ToastMessage {
  return {
    id: crypto.randomUUID(),
    type,
    message,
  };
}

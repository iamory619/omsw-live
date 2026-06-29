import { isDevelopmentMode } from "@/lib/config/app";

export function DevModeBadge() {
  if (!isDevelopmentMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] rounded-full border border-green-500 bg-green-500/20 px-4 py-2 text-xs font-black text-green-200 shadow-2xl backdrop-blur">
      🟢 DEV MODE
    </div>
  );
}

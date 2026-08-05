import Link from "next/link";

export default function LiveDecorationsPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-black">
          Live Decorations
        </h1>

        <p className="mt-3 text-zinc-400">
          ตกแต่งห้องไลฟ์ด้วยเอฟเฟกต์ต่าง ๆ
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Link
            href="/dashboard/live-decorations/room-light"
            className="rounded-3xl border border-pink-500/30 bg-pink-500/10 p-6 transition hover:border-pink-500"
          >
            <div className="text-4xl">💡</div>

            <h2 className="mt-4 text-2xl font-black">
              Studio Room Light
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              จัดไฟสตูดิโอ RGB และ Aurora สำหรับใช้ใน OBS
            </p>

            <div className="mt-6 font-bold text-pink-200">
              เปิดการตั้งค่า →
            </div>
          </Link>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 opacity-60">
            <div className="text-4xl">🖼️</div>

            <h2 className="mt-4 text-2xl font-black">
              Neon Frame
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              กรอบนีออนสำหรับตกแต่งหน้าจอไลฟ์
            </p>

            <div className="mt-6 font-bold text-zinc-500">
              Coming Soon
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
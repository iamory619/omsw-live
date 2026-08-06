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

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Room Light */}
          <Link
            href="/dashboard/live-decorations/room-light"
            className="group rounded-3xl border border-pink-500/30 bg-pink-500/10 p-6 transition-all duration-300 hover:border-pink-400 hover:bg-pink-500/15 hover:shadow-[0_0_35px_rgba(236,72,153,.25)]"
          >
            <div className="text-4xl">💡</div>

            <h2 className="mt-4 text-2xl font-black">
              Studio Room Light
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              จัดไฟสตูดิโอ RGB และ Aurora สำหรับใช้ใน OBS
            </p>

            <div className="mt-6 flex items-center justify-between">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                Available
              </span>

              <span className="font-bold text-pink-200 transition group-hover:translate-x-1">
                เปิดการตั้งค่า →
              </span>
            </div>
          </Link>

          {/* Neon Frame */}
          <Link
            href="/dashboard/live-decorations/neon-frame"
            className="group rounded-3xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-6 transition-all duration-300 hover:border-fuchsia-400 hover:bg-fuchsia-500/15 hover:shadow-[0_0_35px_rgba(217,70,239,.25)]"
          >
            <div className="text-4xl">🖼️</div>

            <h2 className="mt-4 text-2xl font-black">
              Neon Frame
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              กรอบนีออนเรืองแสงสำหรับตกแต่งหน้าจอไลฟ์ รองรับหลายรูปแบบ
              และหลาย Preset
            </p>

            <div className="mt-6 flex items-center justify-between">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                Available
              </span>

              <span className="font-bold text-fuchsia-200 transition group-hover:translate-x-1">
                เปิดการตั้งค่า →
              </span>
            </div>
          </Link>

          {/* Floating Particles */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 opacity-60">
            <div className="text-4xl">✨</div>

            <h2 className="mt-4 text-2xl font-black">
              Floating Particles
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              เอฟเฟกต์อนุภาคลอย เช่น ดาว หิมะ หัวใจ และประกายไฟ
            </p>

            <div className="mt-6 flex items-center justify-between">
              <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-black text-yellow-300">
                Coming Soon
              </span>

              <span className="font-bold text-zinc-500">
                อยู่ระหว่างพัฒนา
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
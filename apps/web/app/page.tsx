import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 rounded-full border border-white/20 px-4 py-1 text-sm text-gray-300">
          OMSW Live • TikTok Interactive Platform
        </span>

        <h1 className="text-5xl font-bold md:text-7xl">
          Make Every TikTok Live
          <br />
          More Interactive
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-400">
          สร้าง Alert, เกม, Evolution Pet และ Overlay
          สำหรับ OBS ได้ในไม่กี่คลิก
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:scale-105"
          >
            เปิด Dashboard
          </Link>

          <Link
            href="/overlay/demo"
            className="rounded-xl border border-white/30 px-6 py-3 transition hover:bg-white/10"
          >
            ดู Overlay Demo
          </Link>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold">
              🎁 Gift Alerts
            </h3>

            <p className="mt-2 text-gray-400">
              แจ้งเตือนของขวัญแบบเรียลไทม์
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold">
              🐱 Evolution Pets
            </h3>

            <p className="mt-2 text-gray-400">
              สัตว์เลี้ยงโตตาม Gift เพื่อเพิ่ม Engagement
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold">
              🎮 Mini Games
            </h3>

            <p className="mt-2 text-gray-400">
              เกมและกิจกรรมเพื่อดึงคนดูให้อยู่ในไลฟ์นานขึ้น
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1 text-sm text-pink-300">
          ✨ OMSW Live • TikTok Interactive Platform
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

        <div className="mt-6 rounded-2xl border border-pink-500/30 bg-pink-500/10 px-6 py-4 text-center">
          <p className="text-xl font-bold text-pink-300">
            🎉 ทดลองใช้งานฟรี 9 วัน
          </p>

          <p className="mt-2 text-sm text-gray-300">
            ไม่ต้องใช้บัตรเครดิต • สมัครแล้วเริ่มใช้งานได้ทันที
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:scale-105"
          >
            🔐 Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-pink-500 bg-pink-500/10 px-6 py-3 font-semibold text-pink-300 transition hover:bg-pink-500/20"
          >
            🚀 Create Account
          </Link>

          <Link
            href="/overlay/demo"
            className="rounded-xl border border-white/30 px-6 py-3 transition hover:bg-white/10"
          >
            🎥 Overlay Demo
          </Link>
        </div>

        <div className="mt-16 grid gap-4 text-left md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            ✅ รองรับ TikTok Live
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            ✅ Overlay สำหรับ OBS
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            ✅ Evolution Pets
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            ✅ Mini Games
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            ✅ Gift Basket
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            ✅ Magic Lantern
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            ✅ Gift Vehicle
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            ✅ Fortune Stick
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 p-6 transition hover:border-pink-500">
            <h3 className="text-xl font-semibold">
              🎁 Gift Alerts
            </h3>

            <p className="mt-2 text-gray-400">
              แจ้งเตือนของขวัญแบบเรียลไทม์ พร้อมเอฟเฟกต์สวยงาม
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-6 transition hover:border-pink-500">
            <h3 className="text-xl font-semibold">
              🐱 Evolution Pets
            </h3>

            <p className="mt-2 text-gray-400">
              สัตว์เลี้ยงจะเติบโตตามยอด Gift เพื่อเพิ่ม Engagement
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-6 transition hover:border-pink-500">
            <h3 className="text-xl font-semibold">
              🎮 Interactive Widgets
            </h3>

            <p className="mt-2 text-gray-400">
              เกมและ Widget ที่ช่วยให้คนดูอยู่ใน Live นานขึ้น
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
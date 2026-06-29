import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <Link href="/" className="text-sm font-bold text-pink-400">
            ← กลับหน้าแรก
          </Link>

          <h1 className="mt-4 text-5xl font-black">Pricing</h1>

          <p className="mt-3 text-zinc-400">
            เริ่มต้นใช้งาน OMSW Live Everything you need to power your live stream.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            <h2 className="text-2xl font-black">Trial</h2>

            <div className="mt-4 text-4xl font-black text-green-300">
              ฟรี 9 วัน
            </div>

            <p className="mt-3 text-zinc-400">
              ทดลองใช้ทุก Widget ก่อนตัดสินใจ
            </p>

            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              <li>✅ Gift Goal</li>
              <li>✅ Magic Lantern</li>
              <li>✅ Gift Vehicle</li>
              <li>✅ Gift Basket</li>
              <li>✅ Fortune Stick</li>
            </ul>

            <div className="mt-8 space-y-3">
              <Link
                href="/register"
                className="block rounded-xl bg-zinc-700 px-5 py-3 text-center font-bold transition hover:bg-zinc-600"
              >
                สมัครใหม่ / Start Free Trial
              </Link>

              <Link
                href="/login"
                className="block rounded-xl border border-zinc-700 px-5 py-3 text-center font-bold transition hover:bg-zinc-900"
              >
                มีบัญชีแล้ว Login
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-pink-500 bg-pink-500/10 p-8 shadow-2xl shadow-pink-500/10">
            <div className="mb-3 w-fit rounded-full bg-pink-600 px-3 py-1 text-xs font-bold">
              Recommended
            </div>

            <h2 className="text-2xl font-black">Pro</h2>

            <div className="mt-4 text-4xl font-black text-pink-300">
              ฿299
              <span className="text-base font-normal text-zinc-400">
                /เดือน
              </span>
            </div>

            <p className="mt-3 text-zinc-400">
              สำหรับไลฟ์จริง ใช้งาน Widget หลักครบ
            </p>

            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              <li>✅ ใช้งาน Widget ครบ</li>
              <li>✅ Overlay URL ส่วนตัว</li>
              <li>✅ บันทึก Widget Settings</li>
              <li>✅ Dashboard สมาชิก</li>
              <li>✅ อัปเดต Widget ใหม่</li>
            </ul>

            <button
              disabled
              className="mt-8 block w-full cursor-not-allowed rounded-xl bg-pink-600 px-5 py-3 text-center font-bold opacity-60"
            >
              Coming Soon
            </button>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
            <h2 className="text-2xl font-black">Premium</h2>

            <div className="mt-4 text-4xl font-black text-yellow-300">
              เร็ว ๆ นี้
            </div>

            <p className="mt-3 text-zinc-400">
              สำหรับ Creator ที่ต้องการ Widget พิเศษและระบบขั้นสูง
            </p>

            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              <li>✅ Premium Widgets</li>
              <li>✅ Advanced Effects</li>
              <li>✅ Analytics</li>
              <li>✅ Priority Support</li>
              <li>✅ Custom Branding</li>
            </ul>

            <button
              disabled
              className="mt-8 block w-full cursor-not-allowed rounded-xl bg-zinc-700 px-5 py-3 text-center font-bold opacity-60"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

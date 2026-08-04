import Link from "next/link";

type DecorationStatus = "Available" | "Coming Soon";

type DecorationItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  status: DecorationStatus;
};

const DECORATIONS: DecorationItem[] = [
  {
    id: "room-light",
    title: "Room Light Effect",
    description:
      "เอฟเฟกต์แสงสีสำหรับตกแต่งห้องไลฟ์และแสดงผ่าน OBS โดยไม่เกี่ยวกับการส่งของขวัญ",
    icon: "💡",
    href: "/dashboard/live-decorations/room-light",
    status: "Available",
  },
  {
    id: "neon-frame",
    title: "Neon Frame",
    description:
      "กรอบนีออนสำหรับตกแต่งบริเวณรอบหน้าจอไลฟ์",
    icon: "🖼️",
    href: "#",
    status: "Coming Soon",
  },
  {
    id: "floating-particles",
    title: "Floating Particles",
    description:
      "เพิ่มประกายดาว หัวใจ หรืออนุภาคลอยบนหน้าจอ",
    icon: "✨",
    href: "#",
    status: "Coming Soon",
  },
];

export default function LiveDecorationsPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black sm:text-4xl">
              Live Decorations
            </h1>

            <span className="rounded-full border border-pink-500/30 bg-pink-500/15 px-3 py-1 text-xs font-black text-pink-200">
              NEW
            </span>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            ตกแต่งไลฟ์ด้วยแสง สี กรอบ และเอฟเฟกต์ต่าง ๆ
            โดยไม่ต้องเชื่อมกับการส่งของขวัญ
          </p>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {DECORATIONS.map((decoration) => {
            const available = decoration.status === "Available";

            const cardClassName =
              "group rounded-3xl border border-white/10 bg-zinc-950 p-5 transition";

            if (!available) {
              return (
                <div
                  key={decoration.id}
                  aria-disabled="true"
                  className={`${cardClassName} cursor-not-allowed opacity-60`}
                >
                  <DecorationCard
                    icon={decoration.icon}
                    title={decoration.title}
                    description={decoration.description}
                    status={decoration.status}
                    available={false}
                  />
                </div>
              );
            }

            return (
              <Link
                key={decoration.id}
                href={decoration.href}
                prefetch={false}
                className={`${cardClassName} hover:-translate-y-1 hover:border-pink-500/40 hover:bg-pink-500/5`}
              >
                <DecorationCard
                  icon={decoration.icon}
                  title={decoration.title}
                  description={decoration.description}
                  status={decoration.status}
                  available
                />
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function DecorationCard({
  icon,
  title,
  description,
  status,
  available,
}: {
  icon: string;
  title: string;
  description: string;
  status: DecorationStatus;
  available: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/10 text-3xl">
          {icon}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
            available
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {status}
        </span>
      </div>

      <h2 className="mt-6 text-xl font-black">{title}</h2>

      <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">
        {description}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-bold">
        <span className={available ? "text-pink-200" : "text-zinc-500"}>
          {available ? "เปิดการตั้งค่า" : "เร็ว ๆ นี้"}
        </span>

        {available && (
          <span className="text-pink-300 transition group-hover:translate-x-1">
            →
          </span>
        )}
      </div>
    </>
  );
}
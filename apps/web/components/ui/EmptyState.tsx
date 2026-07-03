import Link from "next/link";

type Props = {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  icon = "✨",
  title,
  description,
  actionLabel,
  actionHref,
}: Props) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black p-8 text-center">
      <div className="text-5xl">{icon}</div>

      <h3 className="mt-4 text-2xl font-black text-white">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-block rounded-xl bg-pink-600 px-5 py-3 font-black text-white transition hover:bg-pink-500"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
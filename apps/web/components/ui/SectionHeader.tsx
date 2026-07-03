type Props = {
  badge?: string;
  title: string;
  description?: string;
};

export function SectionHeader({
  badge,
  title,
  description,
}: Props) {
  return (
    <div className="mb-8">
      {badge && (
        <div className="text-sm font-black text-pink-400">
          {badge}
        </div>
      )}

      <h1 className="mt-2 text-4xl font-black md:text-5xl">
        {title}
      </h1>

      {description && (
        <p className="mt-3 max-w-2xl text-zinc-400">
          {description}
        </p>
      )}
    </div>
  );
}
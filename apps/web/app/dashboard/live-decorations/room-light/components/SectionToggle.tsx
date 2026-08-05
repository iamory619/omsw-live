"use client";

type SectionToggleProps = {
  title: string;
  description: string;
  open: boolean;
  onClick: () => void;
};

export function SectionToggle({
  title,
  description,
  open,
  onClick,
}: SectionToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>

      <span
        className={`shrink-0 text-xl transition ${
          open ? "rotate-180" : ""
        }`}
      >
        ⌄
      </span>
    </button>
  );
}

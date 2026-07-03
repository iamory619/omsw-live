type Props = {
  icon: string;
  step: string;
  title: string;
  description: string;
};

export function StepHeader({ icon, step, title, description }: Props) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-7xl">{icon}</div>

      <div className="mt-6 text-sm font-black uppercase tracking-[0.3em] text-pink-400">
        {step}
      </div>

      <h2 className="mt-3 text-4xl font-black">{title}</h2>

      <p className="mt-4 text-zinc-400">{description}</p>
    </div>
  );
}
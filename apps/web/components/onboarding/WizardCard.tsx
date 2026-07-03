type Props = {
  children: React.ReactNode;
};

export function WizardCard({ children }: Props) {
  return (
    <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-white/10 bg-zinc-950 p-8 shadow-2xl">
      {children}
    </div>
  );
}
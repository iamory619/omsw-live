type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-zinc-950 p-6 ${className}`}
    >
      {children}
    </div>
  );
}
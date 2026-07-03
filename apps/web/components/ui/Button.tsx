import Link from "next/link";

type Props = {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "upgrade";
  className?: string;
};

export function Button({
  children,
  href,
  type = "button",
  onClick,
  disabled = false,
  variant = "primary",
  className = "",
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 font-black transition disabled:cursor-not-allowed disabled:opacity-60";

  const styles = {
    primary: "bg-pink-600 text-white hover:bg-pink-500",
    secondary: "bg-zinc-800 text-white hover:bg-zinc-700",
    danger: "bg-red-600 text-white hover:bg-red-500",
    upgrade: "bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:opacity-90",
  };

  const finalClassName = `${base} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={finalClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={finalClassName}
    >
      {children}
    </button>
  );
}
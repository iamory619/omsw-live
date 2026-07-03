import { Button } from "@/components/ui/Button";

type Props = {
  backHref?: string;
  nextHref?: string;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
};

export function StepFooter({
  backHref,
  nextHref,
  nextLabel = "Continue →",
  backLabel = "← Back",
  nextDisabled = false,
}: Props) {
  return (
    <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
      {backHref ? (
        <Button href={backHref} variant="secondary">
          {backLabel}
        </Button>
      ) : (
        <div />
      )}

      {nextHref ? (
        <Button
          href={nextDisabled ? undefined : nextHref}
          variant="upgrade"
          className={nextDisabled ? "pointer-events-none opacity-50" : ""}
        >
          {nextLabel}
        </Button>
      ) : null}
    </div>
  );
}
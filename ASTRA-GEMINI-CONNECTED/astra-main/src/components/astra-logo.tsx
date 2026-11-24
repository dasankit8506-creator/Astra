import { cn } from "@/lib/utils";

type AstraLogoProps = {
  className?: string;
  size?: "small" | "large";
  surface?: "dark" | "light";
  wordmark?: boolean;
};

export function AstraLogo({
  className,
  size = "large",
  surface = "dark",
  wordmark = true,
}: AstraLogoProps) {
  const iconSize = size === "small" ? "size-8" : "size-10";
  const nameSize = size === "small" ? "text-lg" : "text-xl";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5",
        surface === "light" ? "text-logo-ink" : "text-foreground",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        className={cn("shrink-0", iconSize)}
        fill="none"
        viewBox="0 0 64 64"
      >
        <path
          d="M14.5 53 29.7 15c.9-2.4 3.7-2.4 4.6 0L49.5 53"
          stroke="currentColor"
          strokeLinecap="square"
          strokeWidth="4.4"
        />
        <path
          d="M7.5 44.8c10.7 10.3 29.2 10.2 45-20.3"
          className="text-brand-cyan"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.2"
        />
        <path
          d="m51 12.7 1.8 5.1 5.1 1.8-5.1 1.8-1.8 5.1-1.8-5.1-5.1-1.8 5.1-1.8z"
          className="fill-brand-cyan"
        />
      </svg>
      {wordmark ? (
        <span className={cn("font-display font-semibold", nameSize)}>ASTRA</span>
      ) : (
        <span className="sr-only">ASTRA</span>
      )}
    </span>
  );
}
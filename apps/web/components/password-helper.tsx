import { cn } from "@protectedshare/ui";
import { checkPasswordStrength } from "../lib/password";

const TONE_TEXT = {
  danger: "text-danger",
  warn: "text-warn",
  ok: "text-ok",
} as const;

/**
 * Four-segment strength meter with a label and up to two tips.
 * Color is never the only signal: the label says it in words.
 */
export function PasswordStrengthIndicator({
  password,
  className,
  id,
}: {
  password: string;
  className?: string;
  /** Lets an input point at this with aria-describedby. */
  id?: string;
}) {
  if (!password) return null;

  const { score, label, tone, color, entropyBits, suggestions } = checkPasswordStrength(password);
  const filled = Math.max(1, score);

  return (
    <div id={id} className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={cn(
                "h-1 rounded-full transition-colors duration-200 ease-seal",
                step <= filled ? color : "bg-line"
              )}
            />
          ))}
        </div>
        <p className="shrink-0 text-meta text-ink-3" aria-live="polite">
          <span className={cn("font-medium", TONE_TEXT[tone])}>{label}</span>
          <span className="tabular"> · ~{entropyBits} bits</span>
        </p>
      </div>
      {suggestions.length > 0 && score < 3 ? (
        <p className="text-meta text-ink-3">{suggestions.join(" ")}</p>
      ) : null}
    </div>
  );
}

export default PasswordStrengthIndicator;

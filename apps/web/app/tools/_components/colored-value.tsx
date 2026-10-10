import { cn } from "@protectedshare/ui";

type Run = { kind: "letter" | "digit" | "symbol" | "space"; text: string };

function kindOf(char: string): Run["kind"] {
  if (/[0-9]/.test(char)) return "digit";
  if (/[A-Za-z]/.test(char)) return "letter";
  if (char === " ") return "space";
  return "symbol";
}

function runs(value: string): Run[] {
  const out: Run[] = [];
  for (const char of value) {
    const kind = kindOf(char);
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += char;
    else out.push({ kind, text: char });
  }
  return out;
}

const CLASS: Record<Run["kind"], string> = {
  letter: "text-ink",
  digit: "text-ok",
  symbol: "text-warn",
  space: "",
};

/**
 * Mono value with digits and symbols tinted, so 0/O and 1/l/I can be told apart.
 * Spaces get a faint box so a space separator is visible. Selecting and copying gives the plain string.
 */
export default function ColoredValue({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("font-mono", className)}>
      {runs(value).map((run, index) =>
        run.kind === "space" ? (
          <span key={index} className="rounded-[3px] bg-ink/[0.07] [box-decoration-break:clone]">
            {run.text}
          </span>
        ) : (
          <span key={index} className={CLASS[run.kind]}>
            {run.text}
          </span>
        )
      )}
    </span>
  );
}

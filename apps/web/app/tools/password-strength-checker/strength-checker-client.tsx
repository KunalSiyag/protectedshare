"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Gauge, ShieldAlert, ShieldCheck, WifiOff } from "lucide-react";
import { Panel, PanelBody, PanelFooter, PanelHeader, StatusChip, buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../../../components/app-link";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import ColoredValue from "../_components/colored-value";
import OfflinePanel from "../_components/offline-panel";
import SecretInput from "../_components/secret-input";
import { CrackTimes, StrengthMeter } from "../_components/strength-meter";
import { explainTypedBits, strengthFromBits, typedFindings, type TypedPiece } from "../_lib/strength";

function classesIn(value: string): string[] {
  const found: string[] = [];
  if (/[a-z]/.test(value)) found.push("lowercase");
  if (/[A-Z]/.test(value)) found.push("uppercase");
  if (/[0-9]/.test(value)) found.push("digits");
  if (/[!-/:-@[-`{-~ ]/.test(value)) found.push("symbols or spaces");
  if (/[^\x00-\x7f]/.test(value)) found.push("other characters");
  return found;
}

function describe(piece: TypedPiece, pool: number): string {
  const count = [...piece.text].length;
  switch (piece.kind) {
    case "common":
      return "A common password or word";
    case "year":
      return "Looks like a year";
    case "repeat":
      return count === 1 ? "Repeats the character before it" : `Repeats the character before, ${count} times`;
    case "sequence":
      return "Continues a run like abc or 123";
    case "keyboard":
      return "Keys next to each other";
    default:
      return `${count === 1 ? "1 character" : `${count} characters`} from a set of about ${pool}`;
  }
}

function formatBits(bits: number): string {
  return bits >= 10 ? String(Math.round(bits)) : bits.toFixed(1).replace(/\.0$/, "");
}

export default function StrengthCheckerClient() {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);

  const explanation = useMemo(() => explainTypedBits(value), [value]);
  const findings = useMemo(() => typedFindings(value), [value]);
  const info = value ? strengthFromBits(explanation.bits) : null;
  const classes = useMemo(() => classesIn(value), [value]);

  return (
    <ToolLayout
      as="div"
      eyebrow="Free tool"
      title="Password strength checker"
      description="See how long a password would hold up against guessing, and why. It's checked in this tab and never sent anywhere."
      meta={
        <>
          <StatusChip icon={<ShieldCheck aria-hidden="true" />} tone="ok">
            Checked locally
          </StatusChip>
          <StatusChip icon={<WifiOff aria-hidden="true" />}>Network: none</StatusChip>
        </>
      }
      aside={
        <>
          <Panel>
            <PanelHeader title="Time to crack" description="Average time if the attacker knows the patterns." />
            <PanelBody className="flex flex-col gap-4">
              <div>
                <p className="tabular text-[28px] font-semibold leading-8 tracking-[-0.02em] text-ink">
                  {value ? `~${Math.round(explanation.bits)}` : 0}
                  <span className="ml-1.5 text-ui font-normal tracking-normal text-ink-3">bits of entropy</span>
                </p>
                <p className="mt-1 text-small text-ink-3">
                  {value
                    ? `${explanation.length} characters, judged from a set of about ${explanation.poolSize}`
                    : "Type a password to see an estimate."}
                </p>
              </div>
              <CrackTimes bits={value ? explanation.bits : null} />
            </PanelBody>
          </Panel>
          <OfflinePanel>
            The check runs in this tab with a short built-in list of common passwords. There is no request to send, so it keeps working with
            the network off.
          </OfflinePanel>
          <ToolNotes
            items={[
              "A rough ceiling, not a promise. It can say a password is weak; it can't prove one is strong.",
              "It doesn't know your pet's name or birthday. Attackers who target you might.",
              "Strong and leaked is still leaked. Check breaches too, and use each password in one place.",
            ]}
          />
        </>
      }
    >
      <Panel>
        <PanelHeader icon={<Gauge aria-hidden="true" />} title="Check a password" description="What you type stays in this tab. It's never sent or saved." />
        <PanelBody className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="strength-password" className="text-small font-medium text-ink">
              Password to check
            </label>
            <SecretInput
              id="strength-password"
              value={value}
              onChange={setValue}
              show={show}
              onToggle={() => setShow((state) => !state)}
              placeholder="Type or paste"
              describedBy="strength-password-hint"
            />
            <p id="strength-password-hint" className="text-small text-ink-3">
              It never leaves this page, but the safest habit is not to type a live password into any website. Try one built the same way.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <StrengthMeter info={info} approximate />
            {value ? (
              <ul className="flex flex-col gap-2" aria-live="polite">
                {findings.map((finding) => (
                  <li key={finding.text} className="flex gap-2.5 text-small text-ink-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-[6px] size-1.5 shrink-0 rounded-full",
                        finding.tone === "danger" ? "bg-danger" : finding.tone === "warn" ? "bg-warn" : "bg-ok"
                      )}
                    />
                    <span>{finding.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-ink-3">Type a password to see what an attacker would try first.</p>
            )}
          </div>
        </PanelBody>

        <div className="border-t border-line px-5 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-small font-medium text-ink">Where the bits come from</h3>
            {value ? (
              <p className="text-meta text-ink-3">{classes.length ? `Uses ${classes.join(", ")}` : null}</p>
            ) : null}
          </div>
          {value ? (
            <>
              <ol className="mt-3 divide-y divide-line rounded-field border border-line" aria-label="Pieces of the password and their cost">
                {explanation.pieces.map((piece, index) => (
                  <li key={index} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className="w-[38%] min-w-0 shrink-0 truncate font-mono text-small">
                      {show ? (
                        <ColoredValue value={piece.text} />
                      ) : (
                        <span className="tracking-[0.14em] text-ink-3" aria-label={`${[...piece.text].length} hidden characters`}>
                          {"•".repeat(Math.min([...piece.text].length, 16))}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-small text-ink-2">{describe(piece, explanation.poolSize)}</span>
                    <span className="tabular shrink-0 font-mono text-meta text-ink-3">{formatBits(piece.bits)} bits</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-small text-ink-3">
                {explanation.shortcut?.kind === "common-password"
                  ? `Taken whole, it's on common-password lists, so it counts as about ${Math.round(explanation.bits)} bits.`
                  : explanation.shortcut?.kind === "repeated"
                    ? `It's a ${[...explanation.shortcut.unit].length}-character pattern repeated ${explanation.shortcut.times} times, so it counts as about ${Math.round(explanation.bits)} bits.`
                    : `Added up, about ${Math.round(explanation.bits)} bits. Each bit doubles the guesses needed.`}
              </p>
            </>
          ) : (
            <p className="mt-2 text-small text-ink-3">
              Each piece of the password is priced the way an attacker would guess it: words and years from a list, runs and repeats almost
              free, random characters at full price.
            </p>
          )}
        </div>

        <PanelFooter>
          <span className="text-small text-ink-3">Nothing you typed is carried over to these pages.</span>
          <div className="flex flex-wrap items-center gap-2">
            <AppLink href="/tools/breached-password-checker" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <ShieldAlert aria-hidden="true" />
              Check for breaches
            </AppLink>
            <AppLink href="/tools/password-generator" className={buttonVariants({ size: "sm" })}>
              Generate a strong one
              <ArrowRight aria-hidden="true" />
            </AppLink>
          </div>
        </PanelFooter>
      </Panel>
    </ToolLayout>
  );
}

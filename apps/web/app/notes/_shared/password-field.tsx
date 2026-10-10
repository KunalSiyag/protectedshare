"use client";

import { useState } from "react";
import { Eye, EyeOff, Wand2 } from "lucide-react";
import { generatePassphrase } from "@protectedshare/crypto";
import { Button, Field, Input } from "@protectedshare/ui";
import { PasswordStrengthIndicator } from "../../../components/password-helper";

export type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: React.ReactNode;
  error?: string;
  /** Show the strength meter (off for a short second factor). */
  meter?: boolean;
  disabled?: boolean;
};

/** Password input with show/hide, a local passphrase generator and a strength meter. */
export default function PasswordField({ id, label, value, onChange, hint, error, meter = true, disabled }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  const generate = () => {
    const { value: phrase } = generatePassphrase({ words: 5, separator: "-", includeNumber: true });
    onChange(phrase);
    setVisible(true);
  };

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      labelAction={
        <Button type="button" variant="ghost" size="sm" onClick={generate} disabled={disabled} className="-my-1.5 -mr-2 h-8 px-2">
          <Wand2 aria-hidden="true" />
          Generate
        </Button>
      }
    >
      <div id={`${id}-group`} className="flex flex-col gap-2">
        <div className="relative">
          <Input
            id={id}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="new-password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            invalid={Boolean(error)}
            aria-describedby={[error ? `${id}-error` : hint ? `${id}-hint` : "", meter && value ? `${id}-meter` : ""].join(" ").trim() || undefined}
            className="pr-11 font-mono text-small tracking-tight"
            placeholder="At least 8 characters, or Generate"
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            disabled={disabled}
            className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-control text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
          >
            {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        </div>
        {meter ? <PasswordStrengthIndicator password={value} id={`${id}-meter`} /> : null}
      </div>
    </Field>
  );
}

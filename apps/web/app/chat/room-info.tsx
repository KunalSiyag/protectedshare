"use client";

import { useEffect, useId, useState } from "react";
import { Flame, LogOut, QrCode as QrIcon, ShieldCheck, Timer } from "lucide-react";
import { Button, Input, Select, StatusChip, Switch, cn } from "@protectedshare/ui";
import CopyField from "../../components/copy-field";
import ModalDialog from "../../components/modal-dialog";
import QrCode from "../../components/qr-code";
import { NAME_TONES, ROOM_TTL_OPTIONS, describeTtl, initials, type ChatPrefs } from "./chat-lib";

export type RoomInfoProps = {
  roomId: string;
  invite: string;
  password?: string;
  safetyWords: string[];
  onlineCount: number;
  people: { id: string; name: string; color: number }[];
  displayName: string;
  name: string;
  onNameChange: (name: string) => void;
  ttlSeconds: number | null;
  onTtlChange: (seconds: number | null) => void;
  prefs: ChatPrefs;
  onPrefsChange: (prefs: ChatPrefs) => void;
  notifyBlocked: boolean;
  onVerify: () => void;
  onLeave: () => void;
  onBurn: () => void;
  /** Tighter spacing inside the mobile sheet. */
  compact?: boolean;
};

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("border-b border-line px-5 py-5 last:border-b-0", className)}>
      <h3 className="eyebrow !text-[11px]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function SafetyWords({ words, size = "sm" }: { words: string[]; size?: "sm" | "lg" }) {
  return (
    <ol className={cn("flex flex-wrap", size === "lg" ? "gap-2" : "gap-1.5")} aria-label="Safety words">
      {words.map((word, index) => (
        <li
          key={`${word}-${index}`}
          className={cn(
            "inline-flex items-baseline gap-1.5 rounded-[8px] border border-line bg-surface-2/60 font-mono text-ink",
            size === "lg" ? "px-3 py-2 text-[18px] leading-6" : "px-2 py-1 text-small"
          )}
        >
          <span className={cn("tabular text-ink-3", size === "lg" ? "text-small" : "text-[10.5px]")}>{index + 1}</span>
          {word}
        </li>
      ))}
    </ol>
  );
}

export function VerifySheet({ words, onClose }: { words: string[]; onClose: () => void }) {
  const id = useId();
  return (
    <ModalDialog
      titleId={`${id}-title`}
      descriptionId={`${id}-desc`}
      onClose={onClose}
      panelClassName="fixed inset-x-0 bottom-0 w-full animate-rise rounded-t-[18px] border border-line bg-surface shadow-float sm:static sm:max-w-[460px] sm:rounded-panel"
    >
      <div aria-hidden="true" className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-line-strong sm:hidden" />
      <div className="p-6 pb-5">
        <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-ok-soft text-ok">
          <ShieldCheck aria-hidden="true" className="size-5" strokeWidth={1.9} />
        </span>
        <h2 id={`${id}-title`} className="text-h3 text-ink">
          Verify this room
        </h2>
        <p id={`${id}-desc`} className="mt-2 text-ui text-ink-2">
          Read these 5 words to the other person, on a call or in person. If theirs match, nobody swapped your link.
        </p>
        <div className="mt-5">
          <SafetyWords words={words} size="lg" />
        </div>
        <p className="mt-5 text-small text-ink-3">
          The words come from the room key, so everyone holding the same key sees the same words. The server never sees them.
        </p>
      </div>
      <div className="flex justify-end border-t border-line bg-surface-2/40 px-6 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:rounded-b-panel">
        <Button variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </ModalDialog>
  );
}

export default function RoomInfo({
  roomId,
  invite,
  password,
  safetyWords,
  onlineCount,
  people,
  displayName,
  name,
  onNameChange,
  ttlSeconds,
  onTtlChange,
  prefs,
  onPrefsChange,
  notifyBlocked,
  onVerify,
  onLeave,
  onBurn,
}: RoomInfoProps) {
  const [showQr, setShowQr] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const id = useId();
  useEffect(() => setNameDraft(name), [name]);

  const ttlValue = ROOM_TTL_OPTIONS.find((option) => option.seconds === ttlSeconds)?.value ?? (ttlSeconds ? "custom" : "off");
  const ttlOptions = ROOM_TTL_OPTIONS.map(({ value, label }) => ({ value, label }));
  if (ttlValue === "custom") ttlOptions.push({ value: "custom", label: describeTtl(ttlSeconds) });

  return (
    <div className="flex flex-col">
      <Section title="Invite">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-[6px] bg-ink/[0.05] px-1.5 py-0.5 font-mono text-meta text-ink-2">{roomId}</span>
          <StatusChip tone="seal">End-to-end encrypted</StatusChip>
        </div>
        <CopyField
          value={invite}
          label={password ? "Room link" : undefined}
          copyLabel="Copy"
          hint={
            password
              ? "The link opens the join screen. They also need the password."
              : "Anyone with this link can join and read new messages."
          }
        />
        {password ? <CopyField className="mt-3" value={password} label="Password" secret hint="Send it another way than the link." /> : null}
        <Button variant="ghost" size="sm" className="-ml-2 mt-2" onClick={() => setShowQr((value) => !value)} aria-expanded={showQr}>
          <QrIcon aria-hidden="true" />
          {showQr ? "Hide QR code" : "Show QR code"}
        </Button>
        {showQr ? (
          <div className="mt-2 flex animate-rise flex-col items-start gap-2">
            <QrCode value={invite} size={156} label="QR code for the room invite" />
            <p className="text-small text-ink-3">Scan with a phone camera to join there.</p>
          </div>
        ) : null}
      </Section>

      <Section title="Safety words">
        <SafetyWords words={safetyWords} />
        <p className="mt-2.5 text-small text-ink-3">Compare these with the other person. Matching words mean you hold the same key.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onVerify}>
          <ShieldCheck aria-hidden="true" />
          Verify together
        </Button>
      </Section>

      <Section title={`People · ${onlineCount} online`}>
        <ul className="flex flex-col gap-2.5">
          <li className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-on-ink">
              {initials(displayName)}
            </span>
            <span className="min-w-0 flex-1 truncate text-small text-ink">
              {displayName} <span className="text-ink-3">(you)</span>
            </span>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
          </li>
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-[11px] font-semibold",
                  NAME_TONES[person.color % NAME_TONES.length].avatar
                )}
              >
                {initials(person.name)}
              </span>
              <span className="min-w-0 flex-1 truncate text-small text-ink-2">{person.name}</span>
            </li>
          ))}
        </ul>
        {onlineCount > 1 + people.length ? (
          <p className="mt-2.5 text-small text-ink-3">
            {onlineCount - 1 - people.length} more online who haven&apos;t written yet.
          </p>
        ) : null}
        <form
          className="mt-4 flex flex-col gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            onNameChange(nameDraft);
          }}
        >
          <label htmlFor={`${id}-name`} className="text-small font-medium text-ink">
            Your name
          </label>
          <div className="flex gap-2">
            <Input
              id={`${id}-name`}
              value={nameDraft}
              maxLength={40}
              placeholder={displayName}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={() => nameDraft !== name && onNameChange(nameDraft)}
              className="h-9"
              autoComplete="nickname"
            />
          </div>
          <p className="text-meta text-ink-3">Sent only inside encrypted messages.</p>
        </form>
      </Section>

      <Section title="Disappearing messages">
        <label htmlFor={`${id}-ttl`} className="sr-only">
          Disappearing messages timer
        </label>
        <div className="flex items-center gap-2">
          <Timer aria-hidden="true" className="size-4 shrink-0 text-ink-3" />
          <Select
            id={`${id}-ttl`}
            value={ttlValue}
            options={ttlOptions}
            onChange={(event) => {
              const option = ROOM_TTL_OPTIONS.find((item) => item.value === event.target.value);
              if (option) onTtlChange(option.seconds);
            }}
          />
        </div>
        <p className="mt-2 text-small text-ink-3">
          Applies to new messages from everyone. The server deletes each one when its timer runs out.
        </p>
      </Section>

      <Section title="Alerts">
        <div className="flex flex-col gap-4">
          <Switch
            checked={prefs.notify && !notifyBlocked}
            onCheckedChange={(checked) => onPrefsChange({ ...prefs, notify: checked })}
            disabled={notifyBlocked}
            label="Desktop notifications"
            description={
              notifyBlocked ? "Blocked in this browser's site settings." : "When this tab is in the background. Shows the sender's name, never the text."
            }
          />
          <Switch
            checked={prefs.sound}
            onCheckedChange={(checked) => onPrefsChange({ ...prefs, sound: checked })}
            label="Sound"
            description="A short tone for new messages."
          />
        </div>
      </Section>

      <Section title="Room">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={onLeave} className="justify-start">
            <LogOut aria-hidden="true" />
            Leave room
          </Button>
          <Button variant="danger" size="sm" onClick={onBurn} className="justify-start">
            <Flame aria-hidden="true" />
            Burn room for everyone
          </Button>
        </div>
        <p className="mt-4 text-small text-ink-3">
          The server keeps ciphertext, timestamps, a hash of the room key and a random id per open tab. Messages are deleted when
          everyone leaves. Idle rooms are forgotten after 7 days.
        </p>
      </Section>
    </div>
  );
}

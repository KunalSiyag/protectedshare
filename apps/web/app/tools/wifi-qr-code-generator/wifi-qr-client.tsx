"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Download, FileLock, Printer, QrCode as QrIcon, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { Button, Input, Panel, PanelFooter, PanelHeader, Segmented, StatusChip, Switch, cn } from "@protectedshare/ui";
import QrCode from "../../../components/qr-code";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import { useToast } from "../../../components/toast";
import { copyText } from "../../../lib/clipboard";
import OfflinePanel from "../_components/offline-panel";
import SecretInput from "../_components/secret-input";
import { WIFI_QR_ECC, qrPngFile, qrSvgFile, saveBlob } from "./qr-files";
import { buildWifiPayload, fileStem, maskedWifiPayload, wifiIssues, type WifiConfig, type WifiIssue, type WifiSecurity } from "./wifi";

const SECURITY_OPTIONS: { value: WifiSecurity; label: string }[] = [
  { value: "WPA", label: "WPA/WPA2/WPA3" },
  { value: "WEP", label: "WEP" },
  { value: "nopass", label: "None" },
];

const PRINT_ROOT_ID = "wifi-print-root";

/** Only the card prints: everything else on the page is hidden for paper. */
const PRINT_CSS = `
#${PRINT_ROOT_ID} { display: none; }
@media print {
  @page { margin: 14mm; }
  html, body { background: #ffffff !important; }
  body > *:not(#${PRINT_ROOT_ID}) { display: none !important; }
  #${PRINT_ROOT_ID} { display: flex !important; justify-content: center; padding-top: 6mm; }
}
`;

function IssueList({ issues, id }: { issues: WifiIssue[]; id: string }) {
  if (issues.length === 0) return null;
  return (
    <ul id={id} className="flex flex-col gap-1">
      {issues.map((issue) => (
        <li key={issue.text} className={cn("text-small", issue.tone === "danger" ? "text-danger" : "text-warn")}>
          {issue.text}
        </li>
      ))}
    </ul>
  );
}

/** The "Scan to join" card. Fixed light colors: it is a picture of a piece of paper. */
function WifiCard({
  config,
  payload,
  passwordOnCard,
  revealPassword,
  variant,
}: {
  config: WifiConfig;
  payload: string;
  passwordOnCard: boolean;
  revealPassword: boolean;
  variant: "preview" | "print";
}) {
  const print = variant === "print";
  const passwordText =
    config.security === "nopass"
      ? "None needed"
      : !passwordOnCard
        ? "Not printed on this card"
        : revealPassword
          ? config.password
          : "•".repeat(Math.min(config.password.length, 16));
  return (
    <div
      className={cn(
        "light flex w-full flex-col items-center rounded-[18px] border border-dashed border-line-strong bg-white text-center",
        print ? "max-w-[118mm] px-[12mm] py-[11mm]" : "max-w-[340px] px-6 py-6"
      )}
    >
      <span className={cn("flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] text-ink-3", print ? "text-[13pt]" : "text-meta")}>
        <Wifi aria-hidden="true" className={print ? "size-5" : "size-3.5"} strokeWidth={2} />
        WiFi
      </span>
      <p className={cn("mt-1.5 font-semibold tracking-[-0.02em] text-ink", print ? "text-[26pt] leading-tight" : "text-[22px] leading-7")}>
        Scan to join
      </p>
      <QrCode
        value={payload}
        ecc={WIFI_QR_ECC}
        size={print ? 260 : 176}
        label={`QR code to join ${config.ssid}`}
        className="mt-3 border-transparent"
      />
      <dl className={cn("mt-4 w-full text-left", print ? "text-[13pt]" : "text-small")}>
        <div className="flex items-baseline justify-between gap-4 border-t border-line py-2">
          <dt className="shrink-0 text-ink-3">Network</dt>
          <dd className="min-w-0 break-all text-right font-medium text-ink">{config.ssid}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-line py-2">
          <dt className="shrink-0 text-ink-3">Password</dt>
          <dd
            className={cn(
              "min-w-0 break-all text-right",
              config.security !== "nopass" && passwordOnCard ? "font-mono font-medium text-ink" : "text-ink-3"
            )}
          >
            {passwordText}
          </dd>
        </div>
        {config.hidden ? (
          <div className="flex items-baseline justify-between gap-4 border-t border-line py-2">
            <dt className="shrink-0 text-ink-3">Hidden network</dt>
            <dd className="text-right text-ink-2">Add it by name if scanning fails</dd>
          </div>
        ) : null}
      </dl>
      <p className={cn("mt-3 text-ink-3", print ? "text-[11pt]" : "text-meta")}>
        Open your phone&apos;s camera and point it at the code. Most phones offer to join.
      </p>
    </div>
  );
}

export default function WifiQrClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [ssid, setSsid] = useState("");
  const [security, setSecurity] = useState<WifiSecurity>("WPA");
  const [password, setPassword] = useState("");
  const [hidden, setHidden] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordOnCard, setPasswordOnCard] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState<"png" | "svg" | null>(null);

  useEffect(() => setMounted(true), []);

  const config: WifiConfig = useMemo(() => ({ ssid, security, password, hidden }), [ssid, security, password, hidden]);
  const needsPassword = security !== "nopass";
  const ready = ssid.length > 0 && (!needsPassword || password.length > 0);
  const payload = useMemo(() => (ready ? buildWifiPayload(config) : null), [ready, config]);
  const shownPayload = useMemo(() => {
    if (!ready) return null;
    return showPassword ? buildWifiPayload(config) : maskedWifiPayload(config);
  }, [ready, showPassword, config]);
  const issues = useMemo(() => wifiIssues(config), [config]);
  const ssidIssues = issues.filter((issue) => issue.field === "ssid");
  const passwordIssues = issues.filter((issue) => issue.field === "password");

  const status = !ssid
    ? "Add your network name to see the code."
    : !ready
      ? "Add the password to finish the code."
      : "Ready to scan.";

  const download = async (kind: "png" | "svg") => {
    if (!payload) return;
    setSaving(kind);
    try {
      const stem = fileStem(ssid);
      if (kind === "svg") {
        saveBlob(new Blob([qrSvgFile(payload)], { type: "image/svg+xml" }), `${stem}.svg`);
      } else {
        saveBlob(await qrPngFile(payload), `${stem}.png`);
      }
    } catch {
      toast({ title: "Couldn't save the file", description: "Try the other format, or take a screenshot of the code.", tone: "danger" });
    } finally {
      setSaving(null);
    }
  };

  const sendInNote = async () => {
    const ok = password ? await copyText(password) : false;
    toast(
      ok
        ? { title: "Password copied. Paste it into the note.", description: "It's encrypted in your browser before anything is sent.", tone: "ok" }
        : { title: "Opening a secure note", description: "Type or paste the password into it." }
    );
    router.push("/notes");
  };

  return (
    <ToolLayout
      as="div"
      eyebrow="Free tool"
      title="WiFi QR code generator"
      description="Make a code your guests scan to join your WiFi. It's drawn in your browser, so the password is never sent anywhere."
      meta={
        <>
          <StatusChip icon={<ShieldCheck aria-hidden="true" />} tone="ok">
            Made in your browser
          </StatusChip>
          <StatusChip icon={<WifiOff aria-hidden="true" />}>Network: none</StatusChip>
        </>
      }
      aside={
        <>
          <OfflinePanel>
            The code is drawn by JavaScript in this tab, and the PNG and SVG files are built here too. The page itself loaded from our server
            like any website; after that you can disconnect and it keeps working.
          </OfflinePanel>
          <ToolNotes
            items={[
              "Anyone who scans the code, or a photo of it, can join. Treat a printed card like the password itself.",
              "Give visitors a guest network, so the card never opens your main one.",
              "Changed the password? Make a new code. The old one stops working.",
            ]}
          />
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <style>{PRINT_CSS}</style>

        <Panel>
          <PanelHeader icon={<Wifi aria-hidden="true" />} title="Your network" description="Type it exactly as your phone shows it. Capitals and spaces count." />
          <div className="grid gap-8 px-5 py-6 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="wifi-ssid" className="text-small font-medium text-ink">
                  Network name (SSID)
                </label>
                <Input
                  id="wifi-ssid"
                  value={ssid}
                  onChange={(event) => setSsid(event.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="e.g. Home WiFi"
                  aria-describedby={ssidIssues.length ? "wifi-ssid-issues" : undefined}
                />
                <div aria-live="polite">
                  <IssueList id="wifi-ssid-issues" issues={ssidIssues} />
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <span id="wifi-security-label" className="text-small font-medium text-ink">
                  Security
                </span>
                <Segmented aria-labelledby="wifi-security-label" value={security} onChange={setSecurity} options={SECURITY_OPTIONS} />
                {security === "WPA" ? (
                  <p className="text-small text-ink-3">Most networks. The code says WPA, which phones read for WPA, WPA2 and WPA3.</p>
                ) : security === "WEP" ? (
                  <p className="rounded-field bg-warn-soft px-3.5 py-3 text-small text-ink-2">
                    <span className="font-medium text-warn">WEP can be cracked in minutes.</span> If your router offers WPA2 or WPA3, switch to it.
                  </p>
                ) : (
                  <p className="text-small text-ink-3">An open network. Anyone in range can join; no password goes in the code.</p>
                )}
              </div>

              {needsPassword ? (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="wifi-password" className="text-small font-medium text-ink">
                    Password
                  </label>
                  <SecretInput
                    id="wifi-password"
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                    describedBy={passwordIssues.length ? "wifi-password-issues wifi-password-hint" : "wifi-password-hint"}
                  />
                  <p id="wifi-password-hint" className="text-small text-ink-3">
                    Case-sensitive. It stays in this tab.
                  </p>
                  <div aria-live="polite">
                    <IssueList id="wifi-password-issues" issues={passwordIssues} />
                  </div>
                </div>
              ) : null}

              <Switch
                checked={hidden}
                onCheckedChange={setHidden}
                label="Hidden network"
                description="Turn on if your network doesn't broadcast its name."
              />
            </div>

            <div className="flex flex-col items-center gap-3 md:w-[242px]">
              {payload ? (
                <QrCode value={payload} ecc={WIFI_QR_ECC} size={208} label={`QR code to join ${ssid}`} />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex size-[242px] flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-line-strong bg-surface-2/50 text-ink-3"
                >
                  <QrIcon className="size-8" strokeWidth={1.5} />
                </div>
              )}
              <p className={cn("text-center text-small", payload ? "font-medium text-ok" : "text-ink-3")} aria-live="polite">
                {status}
              </p>
            </div>
          </div>

          <div className="border-t border-line px-5 py-4">
            <p className="text-small font-medium text-ink">What the code says</p>
            <p id="wifi-payload" className="mt-1.5 min-h-5 break-all font-mono text-[12.5px] leading-5 text-ink-2">
              {shownPayload ?? <span className="text-ink-3">WIFI:T:WPA;S:…;P:…;H:false;;</span>}
            </p>
            <p className="mt-1.5 text-meta text-ink-3">
              Phones read this text and offer to join. A backslash goes before any \ ; , : or &quot; in the name or password.
            </p>
          </div>

          <PanelFooter>
            <span className="text-small text-ink-3">Files are made here. Nothing is uploaded.</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => void download("svg")} disabled={!payload} loading={saving === "svg"}>
                <Download aria-hidden="true" />
                SVG
              </Button>
              <Button size="sm" onClick={() => void download("png")} disabled={!payload} loading={saving === "png"}>
                <Download aria-hidden="true" />
                Download PNG
              </Button>
            </div>
          </PanelFooter>
        </Panel>

        <Panel>
          <PanelHeader
            icon={<Printer aria-hidden="true" />}
            title="Printable card"
            description="For a fridge, a front desk or a meeting room. Only the card prints, on one page."
          />
          <div className="grid gap-6 px-5 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-8">
            <div className="flex justify-center rounded-field bg-surface-2/60 px-4 py-6">
              {payload ? (
                <WifiCard config={config} payload={payload} passwordOnCard={passwordOnCard} revealPassword={showPassword} variant="preview" />
              ) : (
                <p className="py-16 text-center text-small text-ink-3">The card appears once the code is ready.</p>
              )}
            </div>
            <div className="flex flex-col gap-5">
              <Switch
                checked={passwordOnCard}
                onCheckedChange={setPasswordOnCard}
                disabled={!needsPassword}
                label="Print the password on the card"
                description="Handy for laptops and phones that can't scan. Anyone who sees the card can read it."
              />
              <p className="text-small text-ink-3">
                On screen the password stays hidden while the password field is hidden. The printed card follows the switch above.
              </p>
              <Button variant="secondary" onClick={() => window.print()} disabled={!payload} className="self-start">
                <Printer aria-hidden="true" />
                Print card
              </Button>
            </div>
          </div>
          <PanelFooter>
            <span className="text-small text-ink-3">Sending the password to one person? A note that deletes itself is safer than chat.</span>
            <Button variant="secondary" size="sm" onClick={() => void sendInNote()}>
              <FileLock aria-hidden="true" />
              Send it in a secure note
            </Button>
          </PanelFooter>
        </Panel>
      </div>

      {mounted && payload
        ? createPortal(
            <div id={PRINT_ROOT_ID} className="light">
              <WifiCard config={config} payload={payload} passwordOnCard={passwordOnCard} revealPassword variant="print" />
            </div>,
            document.body
          )
        : null}
    </ToolLayout>
  );
}

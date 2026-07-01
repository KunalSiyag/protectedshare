"use client";

import { useState, useMemo } from "react";
import { derivePasswordProof, encrypt, generateRandomPassword } from "@protectedshare/crypto";
import type { CreateSecretRequest, CreateSecretResponse } from "@protectedshare/contracts";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@protectedshare/ui";
import { Loader2, Copy, Check, ShieldCheck, Lock, Sparkles, Clock, FileCode2, RefreshCw } from "lucide-react";
import { apiUrl } from "../../lib/api";

const TTL_OPTIONS = [
  { label: "1 hour",   ms: 60 * 60 * 1000 },
  { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { label: "7 days",   ms: 7 * 24 * 60 * 60 * 1000 },
];

const READS_OPTIONS = [
  { label: "1 read", value: 1 },
  { label: "3 reads", value: 3 },
  { label: "5 reads", value: 5 },
  { label: "10 reads", value: 10 },
];

function countEnvVars(text: string): number {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith("#") && trimmed.includes("=");
    }).length;
}

const PLACEHOLDER = `DATABASE_URL=postgres://user:pass@host:5432/db
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_APP_URL=https://yourapp.com
API_SECRET=your-secret-here`;

export default function SecretsClient() {
  const [content, setContent]     = useState("");
  const [ttlIndex, setTtlIndex]   = useState(1); // default 24h
  const [readIndex, setReadIndex] = useState(0); // default 1 read
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [shareUrl, setShareUrl]   = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);

  const varCount = useMemo(() => countEnvVars(content), [content]);
  const lineCount = useMemo(() => content.split("\n").filter((l) => l.trim()).length, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    setShareUrl(null);

    try {
      const encryptionPassword  = generateRandomPassword(32);
      const encryptedPayload    = await encrypt(content, encryptionPassword);
      const passwordProof       = await derivePasswordProof(encryptionPassword);

      const payload: CreateSecretRequest = {
        payload: encryptedPayload,
        passwordProof,
        expiresAt: Date.now() + TTL_OPTIONS[ttlIndex].ms,
        isBurnAfterRead: true,
        maxReads: READS_OPTIONS[readIndex].value,
      };

      const res = await fetch(apiUrl("/api/secrets"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create secret on server.");

      const data: CreateSecretResponse = await res.json();
      setShareUrl(`${window.location.origin}/secrets/${data.id}#${encryptionPassword}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setShareUrl(null);
    setContent("");
    setError(null);
  };

  return (
    <main className="min-h-full px-4 sm:px-6 py-10 max-w-2xl mx-auto flex flex-col justify-center transition-colors duration-300">

      {/* ─── Page Header ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-emerald-500/10 border border-blue-200/60 dark:border-emerald-500/20">
            <FileCode2 className="h-4.5 w-4.5 text-blue-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-emerald-400">EnvShare</span>
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          Share <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-emerald-400 dark:to-teal-500">.env Files</span> Securely
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg">
          Paste API keys, database strings, or entire <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">.env</code> files.
          Encrypted in your browser with AES-256 — the link self-destructs on first open.
        </p>
      </div>

      {!shareUrl ? (
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ─── Editor Card ─── */}
          <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 shadow-sm overflow-hidden">
            {/* Editor title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">.env</span>
              <div className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
                {content.trim()
                  ? varCount > 0
                    ? <span className="text-blue-500 dark:text-emerald-500 font-semibold">{varCount} variable{varCount !== 1 ? "s" : ""} detected</span>
                    : <span>{lineCount} line{lineCount !== 1 ? "s" : ""}</span>
                  : "empty"}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              id="secret-content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={10}
              required
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-transparent font-mono text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 resize-none px-4 py-4 focus:outline-none leading-relaxed"
            />
          </div>

          {/* ─── TTL Picker ─── */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
              <Clock className="h-3.5 w-3.5" />
              Expires after
            </div>
            <div className="flex gap-2">
              {TTL_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setTtlIndex(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-155 ${
                    ttlIndex === i
                      ? "bg-zinc-950 text-white border-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:border-zinc-50 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/70 dark:bg-zinc-900/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Reads Picker ─── */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              Burns after
            </div>
            <div className="flex gap-2">
              {READS_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReadIndex(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-155 ${
                    readIndex === i
                      ? "bg-zinc-950 text-white border-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:border-zinc-50 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/70 dark:bg-zinc-900/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Security badge ─── */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-600">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-emerald-500" />
            <span>AES-256-GCM · Key stays in browser · Deletes after {READS_OPTIONS[readIndex].label}</span>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full h-11 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Encrypting & uploading…</>
              : <><Lock className="h-4 w-4 mr-2" /> Encrypt & Generate Link</>
            }
          </Button>
        </form>

      ) : (
        /* ─── Success State ─── */
        <Card className="border-blue-500/20 dark:border-emerald-500/20 bg-white dark:bg-zinc-950/60 shadow-xl">
          <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-emerald-500/10 text-blue-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Encrypted link is ready
                </CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Payload secured · Expires in {TTL_OPTIONS[ttlIndex].label}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-5 space-y-5">
            {/* Warning */}
            <div className="flex items-start gap-3 text-xs bg-amber-50 dark:bg-amber-500/5 border border-amber-200/60 dark:border-amber-500/20 rounded-lg px-4 py-3 text-amber-700 dark:text-amber-400">
              <span className="text-base leading-none mt-0.5">⚠️</span>
              <span>
                <strong>This link is single-use.</strong> It permanently self-destructs the moment it is opened.
                Share it only with the intended recipient.
              </span>
            </div>

            {/* URL row */}
            <div className="flex items-stretch gap-2">
              <div className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/30 px-3 py-2.5 font-mono text-xs text-zinc-600 dark:text-zinc-400 overflow-hidden overflow-ellipsis whitespace-nowrap">
                {shareUrl}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0 h-auto px-4 border-zinc-200 dark:border-zinc-700 font-semibold text-xs"
              >
                {copied
                  ? <><Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />Copied!</>
                  : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy Link</>
                }
              </Button>
            </div>

            {/* Share another */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              className="w-full h-10 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Share another secret
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

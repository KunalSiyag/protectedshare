"use client";

import { useState } from "react";
import { generateRandomPassword } from "@protectedshare/crypto";
import type { CreateNoteRequest, CreateNoteResponse } from "@protectedshare/contracts";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@protectedshare/ui";
import { Loader2, Copy, Check, ShieldCheck, Lock, Sparkles, Key } from "lucide-react";
import { apiUrl } from "../../lib/api";
import { sealForShare } from "../../lib/crypto-task";
import { copyText, describeRequestFailure, readApiError } from "../../lib/feedback";
import { PasswordStrengthIndicator } from "../../components/password-helper";
import {
  EXPIRY_PRESETS,
  type ExpiryChoice,
  formatShareDeadline,
  resolveExpiresAt,
  toDatetimeLocal,
  withPasswordHash,
} from "../../lib/share-window";

type Delivery = "link" | "password";

export default function NotesClient() {
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [delivery, setDelivery] = useState<Delivery>("link");
  const [expiryChoice, setExpiryChoice] = useState<ExpiryChoice>("86400");
  const [customExpiry, setCustomExpiry] = useState(() => toDatetimeLocal(Date.now() + 2 * 24 * 60 * 60 * 1000));
  const [isBurnAfterRead, setIsBurnAfterRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharePassword, setSharePassword] = useState<string | null>(null);
  const [shareDelivery, setShareDelivery] = useState<Delivery>("link");
  const [shareDeadline, setShareDeadline] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"url" | "password" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const expiry = resolveExpiresAt(expiryChoice, customExpiry);
    if ("error" in expiry) {
      setError(expiry.error);
      return;
    }

    setLoading(true);
    setError(null);
    setShareUrl(null);
    setSharePassword(null);
    setShareDeadline(null);

    try {
      const encryptionPassword = password.trim() || generateRandomPassword(16);
      const sealed = await sealForShare(content, encryptionPassword);

      const payload: CreateNoteRequest = {
        payload: sealed.payload,
        passwordProof: sealed.passwordProof,
        expiresAt: expiry.expiresAt,
        isBurnAfterRead
      };

      const res = await fetch(apiUrl("/api/notes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(await readApiError(res, "Could not save this note. Try again in a moment."));
      }

      const data: CreateNoteResponse = await res.json();
      const baseUrl = `${window.location.origin}/notes/${data.id}`;
      setShareUrl(delivery === "link" ? withPasswordHash(baseUrl, encryptionPassword) : baseUrl);
      setSharePassword(encryptionPassword);
      setShareDelivery(delivery);
      setShareDeadline(formatShareDeadline(expiry.expiresAt));
    } catch (caughtError: unknown) {
      setError(describeRequestFailure(caughtError, "Could not save this note. Try again in a moment."));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (value: string, field: "url" | "password") => {
    try {
      await copyText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (caughtError: unknown) {
      setError(describeRequestFailure(caughtError, "Could not copy. Select the text and copy it manually."));
    }
  };

  return (
    <main className="h-full px-6 py-8 md:py-12 max-w-3xl mx-auto flex flex-col transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-emerald-400 dark:to-teal-500">Secure Note</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Browser-side AES-256 encryption. Plaintext stays on this device. A link can open the note by itself, or you can keep the password separate.
        </p>
      </div>

      {!shareUrl ? (
        <Card className="border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/20 backdrop-blur-sm shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="note-content" className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Note Content (Markdown supported)</label>
                <Textarea
                  id="note-content"
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your secure note here..."
                  className="min-h-[220px] font-mono text-base leading-relaxed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-emerald-500/10 transition-all rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">How the recipient opens it</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="How the recipient opens this note">
                  <button
                    type="button"
                    aria-pressed={delivery === "link"}
                    onClick={() => setDelivery("link")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      delivery === "link"
                        ? "bg-zinc-950 text-white border-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:border-zinc-50 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/70 dark:bg-zinc-900/40"
                    }`}
                  >
                    Open from the link
                  </button>
                  <button
                    type="button"
                    aria-pressed={delivery === "password"}
                    onClick={() => setDelivery("password")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      delivery === "password"
                        ? "bg-zinc-950 text-white border-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:border-zinc-50 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/70 dark:bg-zinc-900/40"
                    }`}
                  >
                    Separate password
                  </button>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {delivery === "link"
                    ? "Anyone with the full link can read the note. The password stays in the link and is not sent to the server."
                    : "Send the link and the password through different channels. The link alone cannot open the note."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="note-password" className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Password</label>
                  <div className="relative">
                    <Input
                      id="note-password"
                      name="password"
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to generate one"
                      autoComplete="off"
                      spellCheck={false}
                      className="font-mono h-11 text-base pr-12 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-emerald-500/10 transition-all rounded-lg w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setPassword(generateRandomPassword(16))}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 p-2 rounded transition-colors"
                      aria-label="Generate secure password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="note-expires" className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Expiration</label>
                  <select
                    id="note-expires"
                    name="expiresIn"
                    value={expiryChoice}
                    onChange={(e) => setExpiryChoice(e.target.value as ExpiryChoice)}
                    className="flex h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 px-3 py-2 text-base shadow-sm transition-all focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-emerald-500/10 text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
                  >
                    {EXPIRY_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>{preset.label}</option>
                    ))}
                    <option value="custom">Custom date and time</option>
                  </select>
                  {expiryChoice === "custom" ? (
                    <input
                      id="note-expires-custom"
                      name="customExpiry"
                      type="datetime-local"
                      required
                      value={customExpiry}
                      min={toDatetimeLocal(Date.now() + 5 * 60 * 1000)}
                      max={toDatetimeLocal(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                      onChange={(e) => setCustomExpiry(e.target.value)}
                      aria-label="Custom expiration date and time"
                      className="flex h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 px-3 py-2 text-base shadow-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 dark:focus:border-emerald-500"
                    />
                  ) : null}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">A link can live for at most 30 days.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/10">
                <input
                  type="checkbox"
                  id="burn"
                  name="burn"
                  checked={isBurnAfterRead}
                  onChange={(e) => setIsBurnAfterRead(e.target.checked)}
                  className="mt-0.5 shrink-0 h-4 w-4 rounded border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-blue-600 dark:text-emerald-500 focus:ring-blue-500 dark:focus:ring-emerald-500 focus:ring-offset-white dark:focus:ring-offset-zinc-950 cursor-pointer"
                />
                <div className="space-y-1">
                  <label htmlFor="burn" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                    Burn after reading
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                    Deletes the note from the database after the first successful open.
                  </p>
                </div>
              </div>

              {error ? <p role="alert" className="text-sm text-red-700 dark:text-red-300 break-words">{error}</p> : null}
              <p role="status" className="sr-only">{loading ? "Encrypting note." : ""}</p>

              <Button type="submit" disabled={loading || !content.trim()} aria-busy={loading} className="w-full h-11 text-sm font-semibold rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                {loading ? "Encrypting note…" : "Encrypt & Create Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-500/20 dark:border-emerald-500/20 bg-blue-500/[0.02] dark:bg-emerald-500/[0.01] shadow-lg backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            <p role="status" className="sr-only">
              {copiedField === "url" ? "Share link copied." : copiedField === "password" ? "Password copied." : ""}
            </p>
            {error ? <p role="alert" className="text-sm text-red-700 dark:text-red-300 break-words">{error}</p> : null}
            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-5">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-emerald-500/10 text-blue-600 dark:text-emerald-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Note Created &amp; Encrypted</CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Expires {shareDeadline}.{isBurnAfterRead ? " Deleted after the first open." : ""}
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-900/20 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
              {shareDelivery === "link"
                ? "This link opens the note. Anyone who has the full link can read it, so send it only to the person who should see it."
                : "Send the link and the password through different channels. For example, send the link by email and the password in a separate message."}
            </p>

            <div className="space-y-2.5">
              <label htmlFor="note-share-url" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Share Link</label>
              <div className="flex items-center gap-2 min-w-0">
                <Input id="note-share-url" readOnly value={shareUrl} className="font-mono min-w-0 text-base bg-zinc-50/50 dark:bg-black/30 border-zinc-200 dark:border-zinc-800 h-11" />
                <Button variant="outline" onClick={() => handleCopy(shareUrl, "url")} className="shrink-0 whitespace-nowrap h-11 px-3 border-zinc-200 dark:border-zinc-800">
                  {copiedField === "url" ? <Check className="h-4 w-4 mr-1.5 text-green-500" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  {copiedField === "url" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {shareDelivery === "password" && sharePassword ? (
              <div className="space-y-2.5">
                <label htmlFor="note-share-password" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Decryption Password</label>
                <div className="flex items-center gap-2 min-w-0">
                  <Input id="note-share-password" readOnly value={sharePassword} className="font-mono min-w-0 text-base bg-zinc-50/50 dark:bg-black/30 border-zinc-200 dark:border-zinc-800 h-11" />
                  <Button variant="outline" onClick={() => handleCopy(sharePassword, "password")} className="shrink-0 whitespace-nowrap h-11 px-3 border-zinc-200 dark:border-zinc-800">
                    {copiedField === "password" ? <Check className="h-4 w-4 mr-1.5 text-green-500" /> : <Copy className="h-4 w-4 mr-1.5" />}
                    {copiedField === "password" ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            ) : null}

            <Button
              variant="ghost"
              onClick={() => {
                setShareUrl(null);
                setSharePassword(null);
                setShareDeadline(null);
                setContent("");
                setPassword("");
              }}
              className="w-full mt-4 h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create another secure note
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
        <p>Looking for a different tool?</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
          <a href="/secrets" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">EnvShare (Dev Keys)</a>
          <a href="/notepad" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Encrypted Notepad</a>
          <a href="/chat" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Anonymous Chatroom</a>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <a href="/vs/protectedtext" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">ProtectedText alternative</a>
          <a href="/vs/privnote" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Privnote alternative</a>
          <a href="/blog" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Security blog</a>
        </div>
      </div>
    </main>
  );
}

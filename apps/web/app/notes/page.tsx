"use client";

import { useState } from "react";
import { derivePasswordProof, encrypt, generateRandomPassword } from "@protectedshare/crypto";
import type { CreateNoteRequest, CreateNoteResponse } from "@protectedshare/contracts";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@protectedshare/ui";
import { Loader2, Copy, Check, ShieldCheck, Lock, Sparkles } from "lucide-react";
import { apiUrl } from "../../lib/api";

export default function NotesPage() {
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState("86400");
  const [isBurnAfterRead, setIsBurnAfterRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharePassword, setSharePassword] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"url" | "password" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    setShareUrl(null);
    setSharePassword(null);

    try {
      const encryptionPassword = password.trim() || generateRandomPassword(16);
      const encryptedPayload = await encrypt(content, encryptionPassword);
      const passwordProof = await derivePasswordProof(encryptionPassword);

      const payload: CreateNoteRequest = {
        payload: encryptedPayload,
        passwordProof,
        expiresAt: Date.now() + Number.parseInt(expiresIn, 10) * 1000,
        isBurnAfterRead
      };

      const res = await fetch(apiUrl("/api/notes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to create note on server");
      }

      const data: CreateNoteResponse = await res.json();
      setShareUrl(`${window.location.origin}/notes/${data.id}`);
      setSharePassword(encryptionPassword);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (value: string, field: "url" | "password") => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <main className="h-full px-6 py-8 md:py-12 max-w-3xl mx-auto flex flex-col transition-colors duration-300">
      <div className="mb-8 relative pl-3.5">
        <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-blue-600 dark:bg-emerald-500 rounded-full transition-colors duration-300"></div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          Create Encrypted Note
        </h1>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          Browser-side AES-256 zero-knowledge encryption. Plaintext never leaves your machine.
        </p>
      </div>

      {!shareUrl || !sharePassword ? (
        <Card className="border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/20 backdrop-blur-sm shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Note Content (Markdown supported)</label>
                <Textarea
                  id="note-content"
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your secure note here..."
                  className="min-h-[220px] font-mono text-sm leading-relaxed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-emerald-500/10 transition-all rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Password (Optional)</label>
                  <Input
                    id="note-password"
                    name="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Auto-generate strong password"
                    className="font-mono h-10 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-emerald-500/10 transition-all rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Expiration</label>
                  <select
                    id="note-expires"
                    name="expiresIn"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-emerald-500/10 text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
                  >
                    <option value="3600">1 Hour</option>
                    <option value="86400">1 Day</option>
                    <option value="604800">7 Days</option>
                  </select>
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
                    Destroys the note payload from our database permanently after the first successful decryption.
                  </p>
                </div>
              </div>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <Button type="submit" disabled={loading || !content.trim()} className="w-full h-11 text-sm font-semibold rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Encrypt &amp; Create Link
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-500/20 dark:border-emerald-500/20 bg-blue-500/[0.02] dark:bg-emerald-500/[0.01] shadow-lg backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-5">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-emerald-500/10 text-blue-600 dark:text-emerald-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Note Created &amp; Encrypted</CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Zero-knowledge storage successfully verified.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-900/20 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
              For ultimate security, transmit the **Share Link** and **Password** through different communication channels (e.g. link via email, password via SMS/Signal).
            </p>

            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Share Link</label>
              <div className="flex items-center space-x-2">
                <Input readOnly value={shareUrl} className="font-mono bg-zinc-50/50 dark:bg-black/30 border-zinc-200 dark:border-zinc-800 h-10" />
                <Button variant="outline" onClick={() => handleCopy(shareUrl, "url")} className="shrink-0 w-24 h-10 border-zinc-200 dark:border-zinc-800">
                  {copiedField === "url" ? <Check className="h-4 w-4 mr-1.5 text-green-500" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  {copiedField === "url" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Decryption Password</label>
              <div className="flex items-center space-x-2">
                <Input readOnly value={sharePassword} className="font-mono bg-zinc-50/50 dark:bg-black/30 border-zinc-200 dark:border-zinc-800 h-10" />
                <Button variant="outline" onClick={() => handleCopy(sharePassword, "password")} className="shrink-0 w-24 h-10 border-zinc-200 dark:border-zinc-800">
                  {copiedField === "password" ? <Check className="h-4 w-4 mr-1.5 text-green-500" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  {copiedField === "password" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setShareUrl(null);
                setSharePassword(null);
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
    </main>
  );
}

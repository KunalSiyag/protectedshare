"use client";

import { useState } from "react";
import { derivePasswordProof, encrypt, generateRandomPassword } from "@protectedshare/crypto";
import type { CreateSecretRequest, CreateSecretResponse } from "@protectedshare/contracts";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@protectedshare/ui";
import { Loader2, Copy, Check, KeySquare, ShieldCheck, Lock, Sparkles } from "lucide-react";
import { apiUrl } from "../../lib/api";

export default function SecretsPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    setShareUrl(null);

    try {
      const encryptionPassword = generateRandomPassword(16);
      const encryptedPayload = await encrypt(content, encryptionPassword);
      const passwordProof = await derivePasswordProof(encryptionPassword);

      const payload: CreateSecretRequest = {
        payload: encryptedPayload,
        passwordProof,
        expiresAt: Date.now() + 86400 * 1000,
        isBurnAfterRead: true
      };

      const res = await fetch(apiUrl("/api/secrets"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to create secret on server");
      }

      const data: CreateSecretResponse = await res.json();
      const url = `${window.location.origin}/secrets/${data.id}#${encryptionPassword}`;
      setShareUrl(url);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="h-full px-6 py-12 max-w-xl mx-auto flex flex-col justify-center transition-colors duration-300">
      <div className="text-center mb-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-zinc-900 border border-blue-200 dark:border-zinc-800/80 mb-4 transition-all duration-300 shadow-sm">
          <KeySquare className="h-6 w-6 text-blue-600 dark:text-emerald-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Share a One-Time Secret
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Securely transmit api keys, database strings, or credentials.
          Secrets are **always** deleted completely upon opening.
        </p>
      </div>

      {!shareUrl ? (
        <Card className="border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/20 backdrop-blur-sm shadow-md transition-all duration-300">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter sensitive secret to share..."
                  className="font-mono h-12 text-center text-base border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-emerald-500/10 transition-all rounded-lg"
                  required
                />
              </div>

              {error ? <p className="text-sm text-red-500 text-center">{error}</p> : null}

              <Button type="submit" disabled={loading || !content.trim()} className="w-full h-11 text-sm font-semibold rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Generate Ephemeral Link
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-500/20 dark:border-emerald-500/20 bg-blue-500/[0.02] dark:bg-emerald-500/[0.01] shadow-lg backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col items-center text-center gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-5">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-emerald-500/10 text-blue-600 dark:text-emerald-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Secret Link Ready</CardTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Payload client-encrypted &amp; secured.</p>
              </div>
            </div>

            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 leading-relaxed bg-amber-500/[0.04] p-3.5 rounded-lg border border-amber-500/20">
              ⚠️ **This link will self-destruct upon opening.**
              It can only be viewed **once**, then it is deleted forever.
            </p>

            <div className="flex items-center space-x-2">
              <Input readOnly value={shareUrl} className="font-mono bg-zinc-50/50 dark:bg-black/30 border-zinc-200 dark:border-zinc-800 h-10" />
              <Button variant="outline" onClick={handleCopy} className="shrink-0 w-24 h-10 border-zinc-200 dark:border-zinc-800">
                {copied ? <Check className="h-4 w-4 mr-1.5 text-green-500" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => { setShareUrl(null); setContent(""); }}
              className="w-full mt-4 h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Share another secret
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

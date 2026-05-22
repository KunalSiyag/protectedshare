"use client";

import { useEffect, useState, use } from "react";
import { decrypt, derivePasswordProof } from "@protectedshare/crypto";
import type { GetSecretResponse } from "@protectedshare/contracts";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@protectedshare/ui";
import { Loader2, AlertTriangle, KeySquare, Copy, Check } from "lucide-react";
import { apiUrl } from "../../../lib/api";

export default function SecretsByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [password, setPassword] = useState("");
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const unlockSecret = async (passwordInput: string) => {
    if (!passwordInput.trim()) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const proof = await derivePasswordProof(passwordInput);
      const res = await fetch(apiUrl(`/api/secrets/${unwrappedParams.id}?proof=${encodeURIComponent(proof)}`));
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid secret password.");
        if (res.status === 404) throw new Error("Secret not found. It may have already been viewed and destroyed.");
        throw new Error("Failed to fetch secret from server.");
      }

      const data: GetSecretResponse = await res.json();
      const decryptedContent = await decrypt(
        data.payload.encryptedBlob,
        passwordInput,
        data.payload.iv,
        data.payload.salt
      );

      setContent(decryptedContent);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : "Decryption failed.";
      setError(message);
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hashPassword = window.location.hash.slice(1);
    if (hashPassword) {
      setPassword(hashPassword);
      void unlockSecret(hashPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unwrappedParams.id]);

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    await unlockSecret(password);
  };

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto max-w-xl px-6 py-12 flex flex-col justify-center transition-colors duration-300">
      <div className="text-center mb-10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-zinc-900 border border-blue-200 dark:border-zinc-800/80 mb-4 transition-all duration-300 shadow-sm">
          <KeySquare className="h-6 w-6 text-blue-600 dark:text-emerald-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Decrypted Ephemeral Secret
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Decrypted client-side in your browser. This payload can only be retrieved once.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600 dark:text-emerald-500" />
          <span className="text-sm font-medium">Unlocking secret...</span>
        </div>
      ) : content ? (
        <div className="space-y-6">
          <div className="rounded-lg bg-amber-500/[0.04] p-4 border border-amber-500/20 flex flex-col items-center text-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500">Secret Permanently Destroyed</h3>
            <p className="mt-1 text-xs text-zinc-650 dark:text-zinc-400 leading-normal">
              This secret has been wiped from the database. It cannot be recovered or re-accessed.
            </p>
          </div>

          <Card className="border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/20 backdrop-blur-sm shadow-md">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/60 rounded-lg p-5 mb-5 select-all">
                <code className="text-blue-700 dark:text-emerald-400 font-mono text-base break-all block whitespace-pre-wrap">{content}</code>
              </div>
              <Button onClick={handleCopy} className="w-full h-11 text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-300">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied to Clipboard" : "Copy Secret Payload"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/20 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Unlock Secret</CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Please enter the secret key/password to view the payload.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter secret password"
                autoComplete="current-password"
                className="font-mono h-10 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-emerald-500/10 transition-all rounded-lg"
              />
              {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}
              <Button type="submit" className="w-full h-10 font-bold shadow-sm rounded-lg">
                Unlock Ephemeral Payload
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

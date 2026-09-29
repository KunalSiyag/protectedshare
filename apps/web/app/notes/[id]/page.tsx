"use client";

import { useEffect, useState, use } from "react";
import type { GetNoteResponse } from "@protectedshare/contracts";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@protectedshare/ui";
import { Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { apiUrl } from "../../../lib/api";
import { decryptForShare, proofForShare } from "../../../lib/crypto-task";
import { describeRequestFailure, readApiError } from "../../../lib/feedback";
import { passwordFromLocationHash } from "../../../lib/share-window";

export default function NotesByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [password, setPassword] = useState("");
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingHash, setAwaitingHash] = useState(true);
  const [isBurn, setIsBurn] = useState(false);

  const unlockNote = async (passwordInput: string) => {
    if (!passwordInput.trim()) {
      setError("Password is required.");
      setAwaitingHash(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const proof = await proofForShare(passwordInput);
      const res = await fetch(apiUrl(`/api/notes/${unwrappedParams.id}?proof=${encodeURIComponent(proof)}`));
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid password.");
        if (res.status === 404) throw new Error("Note not found or expired.");
        throw new Error(await readApiError(res, "Could not load this note. Try again in a moment."));
      }

      const data: GetNoteResponse = await res.json();
      setIsBurn(data.isBurnAfterRead);

      const decryptedContent = await decryptForShare(
        passwordInput,
        data.payload.encryptedBlob,
        data.payload.iv,
        data.payload.salt
      );

      setContent(decryptedContent);
    } catch (caughtError: unknown) {
      setError(describeRequestFailure(caughtError, "Could not open this note. Try again in a moment."));
      setContent(null);
    } finally {
      setAwaitingHash(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const hashPassword = passwordFromLocationHash();
    if (hashPassword) {
      setPassword(hashPassword);
      void unlockNote(hashPassword);
    } else {
      setAwaitingHash(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unwrappedParams.id]);

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    await unlockNote(password);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 flex flex-col transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          Secure Note <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-emerald-400 dark:to-teal-500">Decryption</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-550 dark:text-zinc-400">
          Decrypted locally in your browser. Decryption key never hits the network.
        </p>
      </div>

      <p className="sr-only" role="status">{loading || awaitingHash ? "Decrypting note." : ""}</p>
      {loading || awaitingHash ? (
        <div className="flex flex-col items-center justify-center p-16 text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600 dark:text-emerald-500" aria-hidden="true" />
          <span className="text-sm font-medium">Opening note…</span>
        </div>
      ) : content ? (
        <div className="space-y-6">
          {isBurn ? (
            <div className="rounded-lg bg-amber-500/[0.04] p-4 border border-amber-500/20 flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500">Burn after read enabled</h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  This note has been permanently deleted from the database. Copy the decrypted contents now if you need them.
                </p>
              </div>
            </div>
          ) : null}

          <Card className="border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/20 backdrop-blur-sm shadow-md">
            <CardHeader className="border-b border-zinc-200 dark:border-zinc-850 pb-4">
              <div className="flex items-center text-blue-600 dark:text-emerald-500 text-sm font-bold">
                <ShieldCheck className="h-4 w-4 mr-2" /> Verified Decrypted Content
              </div>
            </CardHeader>
            <CardContent className="pt-6 prose dark:prose-invert max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              <ReactMarkdown>{content}</ReactMarkdown>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/20 backdrop-blur-sm shadow-md max-w-md mx-auto w-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Enter Note Password</CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Please provide the decryption password to unlock the content.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="decrypt-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Decryption password</label>
                <Input
                  id="decrypt-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter note password"
                  autoComplete="current-password"
                  spellCheck={false}
                  className="font-mono h-11 text-base border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-emerald-500/10 transition-all rounded-lg"
                />
              </div>
              {error ? <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p> : null}
              <Button type="submit" aria-busy={loading} className="w-full h-11 font-bold shadow-sm rounded-lg">
                Unlock Decrypted Payload
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

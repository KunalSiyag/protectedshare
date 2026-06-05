"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@protectedshare/ui";
import { Loader2, CheckCircle2, AlertCircle, X, ShieldAlert, Sparkles } from "lucide-react";
import { apiUrl } from "../lib/api";

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmail("");
      setCompany("");
      setMessage("");
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/inquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit inquiry. Please try again.");
      }

      setSuccess(true);
    } catch (caughtError: unknown) {
      const msg = caughtError instanceof Error ? caughtError.message : "Submission failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-[101] overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {!success ? (
          <>
            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2 text-blue-600 dark:text-emerald-500 mb-1">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs uppercase font-mono tracking-wider font-bold">Isolated Clusters</span>
              </div>
              <CardTitle className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                Let&apos;s Build a Custom Deal
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Describe your requirements for isolated cloud hardware, on-premises nodes, custom branding, or high-volume API access keys.
              </p>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="inquiry-name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Name *</label>
                    <Input
                      id="inquiry-name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="inquiry-email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email *</label>
                    <Input
                      id="inquiry-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="inquiry-company" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Company (Optional)</label>
                  <Input
                    id="inquiry-company"
                    name="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="inquiry-message" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Requirements / Message *</label>
                  <Textarea
                    id="inquiry-message"
                    name="message"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter what custom dedicated capabilities or license packages your team requires..."
                    rows={4}
                    className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/30 focus:border-blue-500 dark:focus:border-emerald-500 resize-none text-sm"
                  />
                </div>

                {error ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-500 bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading || !name.trim() || !email.trim() || !message.trim()}
                    className="w-full h-11 text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Transmitting Proposal...
                      </>
                    ) : (
                      "Submit Business Proposal"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        ) : (
          <CardContent className="py-12 flex flex-col items-center justify-center text-center px-6">
            <div className="p-3 rounded-full bg-blue-50 dark:bg-emerald-500/10 text-blue-600 dark:text-emerald-500 mb-4 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Proposal Logged Successfully</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm leading-relaxed">
              Your inquiry has been stored directly in our secure database. Our administrators will analyze your specifications and reach out shortly.
            </p>
            <Button
              onClick={onClose}
              className="mt-6 w-32 h-10 border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 rounded-lg text-xs"
            >
              Close Window
            </Button>
          </CardContent>
        )}
      </div>
    </div>
  );
}

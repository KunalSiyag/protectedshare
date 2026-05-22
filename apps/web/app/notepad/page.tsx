"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { derivePasswordProof, encrypt, generateRandomPassword } from "@protectedshare/crypto";
import type { CreateNoteRequest, CreateNoteResponse } from "@protectedshare/contracts";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@protectedshare/ui";
import { Plus, LogOut, Save, Trash2, Copy, Download, Link2, Check, AlertTriangle, X, FileText } from "lucide-react";
import { createWorkspace, openWorkspace, saveWorkspaceNotes, deleteWorkspace, type WorkspaceNote } from "../../lib/workspace";
import { apiUrl } from "../../lib/api";

type SessionState = {
  username: string;
  password: string;
  notes: WorkspaceNote[];
};

type AuthMode = "signin" | "create";

function createNoteId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function WorkspacePage() {
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<SessionState | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editor state lifted up so toolbar can access it
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharePassword, setSharePassword] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"url" | "password" | null>(null);

  const selectedNote = useMemo(() => {
    if (!session || !selectedNoteId) return null;
    return session.notes.find((note) => note.id === selectedNoteId) ?? null;
  }, [session, selectedNoteId]);

  // Sync editor state when selected note changes
  useEffect(() => {
    setEditTitle(selectedNote?.title ?? "");
    setEditBody(selectedNote?.body ?? "");
    setStatus(null);
    setShareUrl(null);
    setSharePassword(null);
    setCopiedField(null);
  }, [selectedNote?.id, selectedNote?.title, selectedNote?.body]);

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      if (authMode === "create") {
        await createWorkspace(username, password);
      }

      const notes = await openWorkspace(username, password);
      setSession({
        username: username.trim().toLowerCase(),
        password,
        notes
      });
      setSelectedNoteId(notes[0]?.id ?? null);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to open notepad.";
      setError(message);
    }
  };

  const persistNotes = useCallback(async (nextNotes: WorkspaceNote[]) => {
    if (!session) return;

    await saveWorkspaceNotes(session.username, session.password, nextNotes);
    setSession({ ...session, notes: nextNotes });
  }, [session]);

  const handleCreateNote = async () => {
    if (!session) return;

    const now = Date.now();
    const note: WorkspaceNote = {
      id: createNoteId(),
      title: "Untitled note",
      body: "",
      createdAt: now,
      updatedAt: now
    };

    const nextNotes = [note, ...session.notes];
    await persistNotes(nextNotes);
    setSelectedNoteId(note.id);
  };

  const handleCloseTab = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // Closing a tab doesn't delete the note, just deselects it if active
    if (selectedNoteId === noteId) {
      const remaining = session?.notes.filter((n) => n.id !== noteId) ?? [];
      setSelectedNoteId(remaining[0]?.id ?? null);
    }
  };

  const handleDeleteNote = async () => {
    if (!session || !selectedNoteId) return;
    const nextNotes = session.notes.filter((note) => note.id !== selectedNoteId);
    await persistNotes(nextNotes);
    setSelectedNoteId(nextNotes[0]?.id ?? null);
  };

  const handleSaveNote = useCallback(async () => {
    if (!session || !selectedNoteId) return;
    const now = Date.now();
    const nextNotes = session.notes
      .map((note) =>
        note.id === selectedNoteId
          ? { ...note, title: editTitle.trim() || "Untitled note", body: editBody, updatedAt: now }
          : note
      )
      .sort((first, second) => second.updatedAt - first.updatedAt);

    await persistNotes(nextNotes);
    setStatus("Saved");
    setTimeout(() => setStatus(null), 1200);
  }, [session, selectedNoteId, editTitle, editBody, persistNotes]);

  const handleDownloadOffline = useCallback(() => {
    const noteTitle = editTitle.trim() || "Untitled note";
    const fileSafeTitle = noteTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "workspace-note";

    const markdown = `# ${noteTitle}\n\n${editBody}`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${fileSafeTitle}.md`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    setStatus("Saved offline");
    setTimeout(() => setStatus(null), 1200);
  }, [editTitle, editBody]);

  const handleShareOnline = useCallback(async () => {
    try {
      const noteTitle = editTitle.trim() || "Untitled note";
      const plaintext = `# ${noteTitle}\n\n${editBody}`;
      if (!plaintext.trim()) {
        setStatus("Cannot share an empty note");
        setTimeout(() => setStatus(null), 1500);
        return;
      }

      const encryptionPassword = generateRandomPassword(16);
      const encryptedPayload = await encrypt(plaintext, encryptionPassword);
      const passwordProof = await derivePasswordProof(encryptionPassword);

      const payload: CreateNoteRequest = {
        payload: encryptedPayload,
        passwordProof,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        isBurnAfterRead: false
      };

      const response = await fetch(apiUrl("/api/notes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error ?? "Failed to create online share link.");
      }

      const data: CreateNoteResponse = await response.json();
      setShareUrl(`${window.location.origin}/notes/${data.id}`);
      setSharePassword(encryptionPassword);
      setStatus("Online link created");
      setTimeout(() => setStatus(null), 1200);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to share online.";
      setStatus(message);
      setTimeout(() => setStatus(null), 1800);
    }
  }, [editTitle, editBody]);

  const copyValue = async (value: string, field: "url" | "password") => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1200);
  };

  const handleDeleteNotebook = async () => {
    if (!session) return;
    try {
      await deleteWorkspace(session.username, session.password);
      setSession(null);
      setSelectedNoteId(null);
      setPassword("");
      setShowDeleteConfirm(false);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to delete notebook.";
      setError(message);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void handleSaveNote();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSaveNote]);

  // ── Auth screen ──
  if (!session) {
    return (
      <main className="h-full mx-auto max-w-md px-6 py-12 flex flex-col justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-zinc-900 dark:text-zinc-100">Notepad</CardTitle>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Private notes stored encrypted in your browser. Pick a username &amp; password to get started.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={authMode === "signin" ? "default" : "outline"}
                  onClick={() => setAuthMode("signin")}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant={authMode === "create" ? "default" : "outline"}
                  onClick={() => setAuthMode("create")}
                >
                  Create
                </Button>
              </div>

              <Input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                autoComplete="username"
                required
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete={authMode === "create" ? "new-password" : "current-password"}
                required
              />
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button type="submit" className="w-full">
                {authMode === "create" ? "Create Notepad" : "Open Notepad"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ── Main WordPad-style layout ──
  const hasNote = !!selectedNote;

  return (
    <main className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* ═══ Toolbar ═══ */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto">
          {/* File actions */}
          <ToolbarButton
            icon={<Plus className="h-4 w-4" />}
            label="New"
            onClick={handleCreateNote}
          />
          <ToolbarDivider />

          {/* Edit actions - only active when a note is selected */}
          <ToolbarButton
            icon={<Save className="h-4 w-4" />}
            label="Save"
            onClick={handleSaveNote}
            disabled={!hasNote}
            shortcut="Ctrl+S"
          />
          <ToolbarButton
            icon={<Trash2 className="h-4 w-4" />}
            label="Delete"
            onClick={handleDeleteNote}
            disabled={!hasNote}
            danger
          />
          <ToolbarDivider />

          {/* Export actions */}
          <ToolbarButton
            icon={<Download className="h-4 w-4" />}
            label="Export .md"
            onClick={handleDownloadOffline}
            disabled={!hasNote}
          />
          <ToolbarButton
            icon={<Link2 className="h-4 w-4" />}
            label="Share"
            onClick={handleShareOnline}
            disabled={!hasNote}
          />
          <ToolbarDivider />

          {/* Status indicator */}
          {status ? (
            <span className="text-xs font-medium text-blue-600 dark:text-emerald-400 px-2 py-1 rounded bg-blue-50 dark:bg-emerald-500/10 whitespace-nowrap animate-in fade-in">
              {status}
            </span>
          ) : null}

          {/* Right side: user info + actions */}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-zinc-500 dark:text-zinc-500 font-mono hidden sm:inline">
              @{session.username}
            </span>
            <ToolbarButton
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Delete Notebook"
              onClick={() => setShowDeleteConfirm(true)}
              danger
              compact
            />
            <ToolbarButton
              icon={<LogOut className="h-3.5 w-3.5" />}
              label="Sign Out"
              onClick={() => {
                setSession(null);
                setSelectedNoteId(null);
                setPassword("");
              }}
              compact
            />
          </div>
        </div>
      </div>

      {/* ═══ Delete Notebook Confirmation ═══ */}
      {showDeleteConfirm ? (
        <div className="shrink-0 border-b border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">
              Permanently delete <strong>@{session.username}</strong> and all notes?
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDeleteNotebook}
                className="px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete everything
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-xs font-medium rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ═══ Share link banner ═══ */}
      {shareUrl && sharePassword ? (
        <div className="shrink-0 border-b border-blue-200 dark:border-emerald-500/30 bg-blue-50/80 dark:bg-emerald-500/5 px-4 py-2.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 shrink-0">Share link & password separately:</p>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <code className="text-xs font-mono text-blue-700 dark:text-emerald-400 truncate flex-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded border border-blue-200/60 dark:border-emerald-500/20">
                {shareUrl}
              </code>
              <button
                type="button"
                onClick={() => copyValue(shareUrl, "url")}
                className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              >
                {copiedField === "url" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <code className="text-xs font-mono text-blue-700 dark:text-emerald-400 bg-white/60 dark:bg-black/20 px-2 py-1 rounded border border-blue-200/60 dark:border-emerald-500/20">
                {sharePassword}
              </code>
              <button
                type="button"
                onClick={() => copyValue(sharePassword, "password")}
                className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              >
                {copiedField === "password" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setShareUrl(null); setSharePassword(null); }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* ═══ Error banner ═══ */}
      {error ? (
        <div className="shrink-0 border-b border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-2">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : null}

      {/* ═══ Tab bar ═══ */}
      <div className="shrink-0 flex items-end bg-zinc-100/60 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        {session.notes.length === 0 ? (
          <div className="px-4 py-2 text-xs text-zinc-400 italic">
            No notes — click <strong>+ New</strong> to get started
          </div>
        ) : (
          session.notes.map((note) => {
            const isActive = note.id === selectedNoteId;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedNoteId(note.id)}
                className={`group relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-r border-zinc-200 dark:border-zinc-800 max-w-[180px] transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-b-2 border-b-blue-500 dark:border-b-emerald-500 -mb-px"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <FileText className="h-3 w-3 shrink-0 opacity-50" />
                <span className="truncate">{note.title || "Untitled note"}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleCloseTab(note.id, e)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCloseTab(note.id, e as unknown as React.MouseEvent); }}
                  className="shrink-0 ml-1 p-0.5 rounded hover:bg-zinc-300/60 dark:hover:bg-zinc-700/60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              </button>
            );
          })
        )}
        {/* New tab button */}
        <button
          type="button"
          onClick={handleCreateNote}
          className="shrink-0 px-2.5 py-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
          title="New note"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ═══ Editor area — fills remaining space ═══ */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
        {selectedNote ? (
          <>
            {/* Title bar */}
            <div className="shrink-0 border-b border-zinc-100 dark:border-zinc-900 px-4 py-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full bg-transparent text-lg font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none"
              />
            </div>
            {/* Body */}
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              placeholder="Start writing..."
              className="flex-1 w-full resize-none bg-transparent px-4 py-3 text-sm font-mono leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-3">
            <FileText className="h-12 w-12 opacity-30" />
            <p className="text-sm">Select a note or create a new one</p>
            <Button onClick={handleCreateNote} variant="outline" className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

// ── Toolbar Components ──

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
  compact,
  shortcut
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  compact?: boolean;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`
        flex items-center gap-1.5 rounded-md transition-colors whitespace-nowrap
        ${compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs"}
        ${disabled
          ? "opacity-40 cursor-not-allowed text-zinc-400 dark:text-zinc-600"
          : danger
            ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
        }
        font-medium
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-0.5 shrink-0" />
  );
}

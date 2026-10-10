"use client";

import { useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { decrypt, derivePasswordProof, encrypt, generateRandomPassword } from "@protectedshare/crypto";
import type { CreateNoteRequest, CreateNoteResponse } from "@protectedshare/contracts";
import { Button, Input, Kbd, Segmented, StatusChip, cn } from "@protectedshare/ui";
import {
  Cloud,
  Columns2,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FileText,
  HardDrive,
  KeyRound,
  Link2,
  LockKeyhole,
  PanelLeft,
  PenLine,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
  Type,
  X,
} from "lucide-react";
import ModalDialog from "../../components/modal-dialog";
import ConfirmDialog from "../../components/confirm-dialog";
import CopyField from "../../components/copy-field";
import EmptyState from "../../components/empty-state";
import { useToast } from "../../components/toast";
import ReactMarkdown from "react-markdown";
import { generateSelfDecryptingHtml } from "../../lib/self-decrypting-html";
import { copyText, describeRequestFailure } from "../../lib/feedback";
import { StrengthMeter } from "../tools/_components/strength-meter";
import { estimateTypedBits, strengthFromBits } from "../tools/_lib/strength";

import {
  createWorkspace,
  openWorkspace,
  saveWorkspaceNotes,
  deleteWorkspace,
  createWorkspaceLocal,
  openWorkspaceLocal,
  saveWorkspaceNotesLocal,
  deleteWorkspaceLocal,
  syncLocalWorkspaceToCloud,
  renameWorkspaceLocal,
  UsernameConflictError,
  WorkspaceConflictError,
  sendWorkspaceHeartbeat,
  type WorkspaceNote
} from "../../lib/workspace";
import { apiUrl } from "../../lib/api";

type SessionState = {
  username: string;
  password: string;
  notes: WorkspaceNote[];
  storageMode: "local" | "cloud";
  lastKnownUpdatedAt?: number;
};

type AuthMode = "signin" | "create";

function createNoteId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function NotepadClient() {
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authBusy, setAuthBusy] = useState(false);
  const [storageMode, setStorageMode] = useState<"local" | "cloud">("local");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<SessionState | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  // Anytime sync / Guest mode state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncUsername, setSyncUsername] = useState("");
  const [syncPassword, setSyncPassword] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSyncPassword, setShowSyncPassword] = useState(false);

  // Editor preferences
  const [editorFont, setEditorFont] = useState<"mono" | "sans">("mono");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const [editorMode, setEditorMode] = useState<"edit" | "preview" | "split">("edit");
  
  // HTML Self-Decrypting Export States
  const [showExportHtmlModal, setShowExportHtmlModal] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportConfirmPassword, setExportConfirmPassword] = useState("");
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [clientId] = useState(() => createNoteId());
  const [activeOtherUsersCount, setActiveOtherUsersCount] = useState(0);

  // Initialize editor font from localstorage
  useEffect(() => {
    try {
      const savedFont = localStorage.getItem("protectedshare.notepad.font");
      if (savedFont === "sans" || savedFont === "mono") setEditorFont(savedFont);
    } catch {
      // Storage blocked: keep the default.
    }
  }, []);

  // Manage full-width workspace class on document root dynamically
  useEffect(() => {
    if (session) {
      document.documentElement.classList.add("notepad-full-width");
    } else {
      document.documentElement.classList.remove("notepad-full-width");
    }
    return () => {
      document.documentElement.classList.remove("notepad-full-width");
    };
  }, [session]);

  // Periodic Heartbeat for cloud workspaces to see active users count
  useEffect(() => {
    if (!session || session.storageMode !== "cloud") {
      setActiveOtherUsersCount(0);
      return;
    }

    const runHeartbeat = async () => {
      try {
        const count = await sendWorkspaceHeartbeat(session.username, session.password, clientId);
        setActiveOtherUsersCount(count);
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    };

    // Run immediately
    void runHeartbeat();

    // Poll every 15 seconds
    const interval = setInterval(runHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [session, clientId]);

  const handleFontChange = (font: "mono" | "sans") => {
    setEditorFont(font);
    try {
      localStorage.setItem("protectedshare.notepad.font", font);
    } catch {
      // Storage blocked: the choice lasts for this visit.
    }
  };



  const loadGuestNotepad = useCallback(async (existingKey?: string) => {
    try {
      let key = existingKey;
      if (!key) {
        key = localStorage.getItem("protectedshare.guest.key") || undefined;
      }
      if (!key) {
        key = crypto.randomUUID();
        localStorage.setItem("protectedshare.guest.key", key);
      }

      // Check if guest workspace exists locally
      const hasGuestWorkspace = localStorage.getItem("protectedshare.workspace.v1:guest");
      if (!hasGuestWorkspace) {
        await createWorkspaceLocal("guest", key);
        // Create an initial welcome note
        const now = Date.now();
        const welcomeNote: WorkspaceNote = {
          id: createNoteId(),
          title: "Welcome to your scratchpad",
          body: "This is your private scratchpad. Everything you type here is encrypted directly in your browser using AES-256-GCM. No signup is required to start writing!\n\nWhen you are ready to sync your notes to the cloud or access them from other devices, click the 'Go Online' button in the top right to create a username and password.",
          createdAt: now,
          updatedAt: now
        };
        await saveWorkspaceNotesLocal("guest", key, [welcomeNote]);
      }

      const notes = await openWorkspaceLocal("guest", key);
      setSession({
        username: "guest",
        password: key,
        notes,
        storageMode: "local"
      });
      setSelectedNoteId(notes[0]?.id ?? null);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to load scratchpad.";
      setError(message);
    }
  }, []);

  const handleStartScratchpad = () => {
    setError(null);
    void loadGuestNotepad();
  };

  // Auto-load guest scratchpad on mount if it exists
  useEffect(() => {
    const guestKey = localStorage.getItem("protectedshare.guest.key");
    if (guestKey) {
      void loadGuestNotepad(guestKey);
    }
  }, [loadGuestNotepad]);

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
    if (authBusy) return;
    setAuthBusy(true);
    setError(null);

    try {
      let notes: WorkspaceNote[] = [];
      let lastKnownUpdatedAt: number | undefined;
      if (storageMode === "local") {
        if (authMode === "create") {
          await createWorkspaceLocal(username, password);
        }
        notes = await openWorkspaceLocal(username, password);
      } else {
        if (authMode === "create") {
          await createWorkspace(username, password);
        }
        const openRes = await openWorkspace(username, password);
        notes = openRes.notes;
        lastKnownUpdatedAt = openRes.updatedAt;
      }

      setSession({
        username: username.trim().toLowerCase(),
        password,
        notes,
        storageMode,
        lastKnownUpdatedAt
      });
      setSelectedNoteId(notes[0]?.id ?? null);
    } catch (caughtError: unknown) {
      setError(describeRequestFailure(caughtError, "Unable to open this notepad. Check the username and password, then try again."));
    } finally {
      setAuthBusy(false);
    }
  };

  const persistNotes = useCallback(async (nextNotes: WorkspaceNote[]) => {
    if (!session) return;

    if (session.storageMode === "local") {
      await saveWorkspaceNotesLocal(session.username, session.password, nextNotes);
      setSession({ ...session, notes: nextNotes });
    } else {
      try {
        const newUpdatedAt = await saveWorkspaceNotes(
          session.username,
          session.password,
          nextNotes,
          session.lastKnownUpdatedAt
        );
        setSession({ ...session, notes: nextNotes, lastKnownUpdatedAt: newUpdatedAt });
      } catch (err: unknown) {
        if (err instanceof WorkspaceConflictError) {
          let serverNotes: WorkspaceNote[] = [];
          if (err.vault) {
            try {
              const decryptedVault = await decrypt(
                err.vault.encryptedBlob,
                session.password,
                err.vault.iv,
                err.vault.salt
              );
              serverNotes = JSON.parse(decryptedVault) as WorkspaceNote[];
            } catch {
              // Ignore decryption error
            }
          }

          // Auto-merge notes (LWW Element Set CRDT style)
          const mergedNotesMap = new Map<string, WorkspaceNote>();
          for (const note of serverNotes) {
            mergedNotesMap.set(note.id, note);
          }
          for (const note of nextNotes) {
            const existing = mergedNotesMap.get(note.id);
            if (!existing || note.updatedAt > existing.updatedAt) {
              mergedNotesMap.set(note.id, note);
            }
          }
          const mergedNotes = Array.from(mergedNotesMap.values()).sort(
            (a, b) => b.updatedAt - a.updatedAt
          );

          toast({
            title: "Merged with another device",
            description: "This notepad changed somewhere else. Both sets of changes were kept.",
            duration: 8000,
          });

          try {
            const finalUpdatedAt = await saveWorkspaceNotes(
              session.username,
              session.password,
              mergedNotes,
              err.updatedAt
            );
            setSession({
              ...session,
              notes: mergedNotes,
              lastKnownUpdatedAt: finalUpdatedAt
            });
          } catch (saveErr: unknown) {
            const message = saveErr instanceof Error ? saveErr.message : "Failed to save merged notes.";
            toast({ title: "Couldn't save", description: message, tone: "danger" });
          }
        } else {
          const message = err instanceof Error ? err.message : "Failed to save notes.";
          toast({ title: "Couldn't save", description: message, tone: "danger" });
        }
      }
    }
  }, [session, toast]);

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
    setSidebarOpen(false);
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

  const handleExportHtml = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedNoteId) return;

    if (!exportPassword.trim()) {
      setExportError("Password is required.");
      return;
    }
    if (exportPassword !== exportConfirmPassword) {
      setExportError("Passwords do not match.");
      return;
    }

    setIsExportingHtml(true);
    setExportError(null);

    try {
      const noteTitle = editTitle.trim() || "Untitled note";
      const noteBody = editBody;

      // Encrypt both title and body client-side using Web Crypto
      const encryptedTitle = await encrypt(noteTitle, exportPassword);
      const encryptedBody = await encrypt(noteBody, exportPassword);

      // Generate the self-decrypting HTML content
      // The file's <title> stays generic: the real title is encrypted inside it.
      const htmlContent = generateSelfDecryptingHtml(encryptedTitle, encryptedBody);

      const fileSafeTitle = noteTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "secure-note";

      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${fileSafeTitle}.html`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);

      setShowExportHtmlModal(false);
      setExportPassword("");
      setExportConfirmPassword("");
      setExportError(null);
      setStatus("Exported Secure HTML");
      setTimeout(() => setStatus(null), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export secure HTML.";
      setExportError(msg);
    } finally {
      setIsExportingHtml(false);
    }
  };


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
    try {
      await copyText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1200);
    } catch (caughtError: unknown) {
      setStatus(describeRequestFailure(caughtError, "Could not copy. Select the text and copy it manually."));
    }
  };

  const handleDeleteNotebook = async () => {
    if (!session) return;
    try {
      if (session.storageMode === "local") {
        await deleteWorkspaceLocal(session.username, session.password);
      } else {
        await deleteWorkspace(session.username, session.password);
      }
      if (session.username === "guest") {
        localStorage.removeItem("protectedshare.guest.key");
      }
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

  const handleSyncToCloud = async () => {
    if (!session) return;
    setStatus("Syncing...");
    try {
      await syncLocalWorkspaceToCloud(session.username, session.password, session.notes);
      setSession({
        ...session,
        storageMode: "cloud"
      });
      setStatus("Synced to Cloud");
      setTimeout(() => setStatus(null), 2000);
    } catch (caughtError: unknown) {
      setStatus(null);
      if (caughtError instanceof UsernameConflictError) {
        setNewUsername(session.username);
        setShowRenameModal(true);
      } else {
        const message = caughtError instanceof Error ? caughtError.message : "Failed to sync to cloud.";
        setError(message);
        setTimeout(() => setError(null), 4000);
      }
    }
  };

  const handleCreateAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSyncError(null);
    setIsSyncing(true);

    try {
      const cleanSyncUsername = syncUsername.trim().toLowerCase();
      if (!cleanSyncUsername) {
        throw new Error("Username cannot be empty.");
      }
      if (cleanSyncUsername === "guest") {
        throw new Error("Cannot use 'guest' as your username.");
      }
      if (!syncPassword.trim()) {
        throw new Error("Password cannot be empty.");
      }

      // 1. Create the new workspace locally
      await createWorkspaceLocal(cleanSyncUsername, syncPassword);

      // 2. Save the guest notes to this new workspace
      await saveWorkspaceNotesLocal(cleanSyncUsername, syncPassword, session.notes);

      // 3. Sync the new local workspace to the cloud
      await syncLocalWorkspaceToCloud(cleanSyncUsername, syncPassword, session.notes);

      // 4. Delete the guest local workspace
      try {
        await deleteWorkspaceLocal("guest", session.password);
      } catch (err) {
        console.error("Failed to delete guest workspace:", err);
      }
      localStorage.removeItem("protectedshare.guest.key");

      // 5. Update session
      setSession({
        username: cleanSyncUsername,
        password: syncPassword,
        notes: session.notes,
        storageMode: "cloud"
      });

      setShowSyncModal(false);
      setSyncUsername("");
      setSyncPassword("");
      setStatus("Synced to Cloud");
      setTimeout(() => setStatus(null), 2000);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to sync to cloud.";
      setSyncError(message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRenameAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setRenameError(null);
    setIsRenaming(true);

    try {
      const cleanNewUsername = newUsername.trim().toLowerCase();
      if (!cleanNewUsername) {
        throw new Error("Username cannot be empty.");
      }

      // 1. Rename locally
      await renameWorkspaceLocal(session.username, cleanNewUsername, session.password);

      // 2. Try to sync to cloud under the new username
      await syncLocalWorkspaceToCloud(cleanNewUsername, session.password, session.notes);

      // 3. Update session
      setSession({
        ...session,
        username: cleanNewUsername,
        storageMode: "cloud"
      });

      setShowRenameModal(false);
      setStatus("Synced to Cloud");
      setTimeout(() => setStatus(null), 2000);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to rename and sync.";
      setRenameError(message);
    } finally {
      setIsRenaming(false);
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
      <main className="mx-auto flex w-full max-w-[440px] flex-col py-4 sm:py-10">
        <p className="eyebrow mb-3">Keep</p>
        <h1 className="text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-ink sm:text-h1">Notepad</h1>
        <p className="mt-3 text-[16px] leading-[25px] text-ink-2">
          Private markdown notes, encrypted in your browser. Keep them on this device, or sync the ciphertext to open them anywhere.
        </p>

        <div className="mt-8 rounded-panel border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
          <form onSubmit={handleAuth} className="flex flex-col gap-5 p-5 sm:p-6">
            <Segmented
              aria-label="Open or create a notepad"
              fullWidth
              value={authMode}
              onChange={(mode) => {
                setAuthMode(mode);
                setPassword("");
                setShowPassword(false);
              }}
              options={[
                { value: "signin", label: "Open existing" },
                { value: "create", label: "Create new" },
              ]}
            />

            <div className="flex flex-col gap-2">
              <span id="notepad-storage-label" className="text-small font-medium text-ink">
                Where it lives
              </span>
              <div role="group" aria-labelledby="notepad-storage-label" className="grid grid-cols-2 gap-2">
                <StorageOption
                  active={storageMode === "local"}
                  onClick={() => setStorageMode("local")}
                  icon={<HardDrive aria-hidden="true" />}
                  title="This browser"
                  body="Stays on this device"
                />
                <StorageOption
                  active={storageMode === "cloud"}
                  onClick={() => setStorageMode("cloud")}
                  icon={<Cloud aria-hidden="true" />}
                  title="Cloud sync"
                  body="Ciphertext on our server"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="notepad-username" className="text-small font-medium text-ink">
                Username
              </label>
              <Input
                id="notepad-username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex min-h-5 items-end justify-between gap-3">
                <label htmlFor="notepad-password" className="text-small font-medium text-ink">
                  Password
                </label>
                {authMode === "create" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(generateRandomPassword(16));
                      setShowPassword(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-[6px] px-1 text-small font-medium text-ink-2 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
                  >
                    <KeyRound aria-hidden="true" className="size-3.5" />
                    Generate
                  </button>
                ) : null}
              </div>
              <RevealInput
                id="notepad-password"
                name="password"
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                autoComplete={authMode === "create" ? "new-password" : "current-password"}
              />
              {authMode === "create" ? (
                <p className="text-small text-ink-3">There&apos;s no reset. Forget it and the notes stay locked.</p>
              ) : null}
              {authMode === "create" && password ? <PasswordMeter password={password} /> : null}
            </div>

            {error ? (
              <p role="alert" className="break-words rounded-field bg-danger-soft px-3.5 py-3 text-small text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" loading={authBusy} disabled={!username.trim() || !password.trim()} className="w-full">
              <LockKeyhole aria-hidden="true" />
              {authMode === "create" ? "Create notepad" : "Open notepad"}
            </Button>
          </form>

          <div className="flex flex-col gap-3 rounded-b-panel border-t border-line bg-surface-2/40 p-5 sm:px-6">
            <Button type="button" variant="secondary" className="w-full" onClick={handleStartScratchpad}>
              <PenLine aria-hidden="true" />
              Start writing, no account
            </Button>
            <p className="text-center text-small text-ink-3">A scratchpad encrypted with a random key kept in this browser.</p>
          </div>
        </div>

        <nav aria-label="Other tools" className="mt-10 border-t border-line pt-6">
          <p className="eyebrow !text-[11px]">Looking for something else?</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-small">
            {[
              { href: "/notes", label: "Secure note" },
              { href: "/secrets", label: "EnvShare" },
              { href: "/chat", label: "Encrypted chat" },
              { href: "/tools/encrypt-text", label: "Encrypt text" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    );
  }

  // ── Workspace ──
  const hasNote = !!selectedNote;
  const isGuest = session.username === "guest";
  const workspaceName = isGuest ? "Scratchpad" : `@${session.username}`;
  const dirty = !!selectedNote && ((editTitle.trim() || "Untitled note") !== selectedNote.title || editBody !== selectedNote.body);
  const wordCount = editBody.trim() ? editBody.trim().split(/\s+/).length : 0;
  const bodyFont = editorFont === "mono" ? "font-mono text-[14.5px] leading-[1.75]" : "font-sans text-[16px] leading-[1.75]";

  const openExport = () => {
    setExportPassword(session.password === "guest" ? "" : session.password);
    setExportConfirmPassword(session.password === "guest" ? "" : session.password);
    setExportError(null);
    setShowExportHtmlModal(true);
  };

  const closeExport = () => {
    setShowExportHtmlModal(false);
    setExportPassword("");
    setExportConfirmPassword("");
    setExportError(null);
  };

  const closeSync = () => {
    setShowSyncModal(false);
    setSyncError(null);
  };

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-ui font-semibold tracking-[-0.01em] text-ink">{workspaceName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {session.storageMode === "local" ? (
              <StatusChip icon={<HardDrive aria-hidden="true" />} className="h-5 px-2">
                This browser
              </StatusChip>
            ) : (
              <StatusChip tone="ok" icon={<Cloud aria-hidden="true" />} className="h-5 px-2">
                Cloud sync
              </StatusChip>
            )}
            {session.storageMode === "cloud" && activeOtherUsersCount > 0 ? (
              <StatusChip
                tone="ok"
                pulse
                className="h-5 px-2"
                title={`${activeOtherUsersCount} other device(s) active on this notepad`}
              >
                {activeOtherUsersCount} active
              </StatusChip>
            ) : null}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close notes list"
          className="md:hidden"
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <h2 className="eyebrow !text-[11px]">
          Notes <span className="tabular ml-1 font-normal normal-case tracking-normal">{session.notes.length}</span>
        </h2>
        <Button variant="ghost" size="icon-sm" onClick={handleCreateNote} aria-label="New note" title="New note">
          <Plus aria-hidden="true" />
        </Button>
      </div>

      <nav aria-label="Notes" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {session.notes.length === 0 ? (
          <p className="px-2 py-3 text-small text-ink-3">No notes yet.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {session.notes.map((note) => {
              const isActive = note.id === selectedNoteId;
              const preview = note.body.replace(/[#>*_`[\]-]/g, " ").replace(/\s+/g, " ").trim();
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setSidebarOpen(false);
                    }}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-control px-2.5 py-2 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-seal/45",
                      isActive ? "bg-ink/[0.06]" : "hover:bg-ink/[0.035]"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("min-w-0 flex-1 truncate text-small", isActive ? "font-semibold text-ink" : "font-medium text-ink-2")}>
                        {note.title || "Untitled note"}
                      </span>
                      <span className="tabular shrink-0 text-[11px] text-ink-3">{timeAgo(note.updatedAt)}</span>
                    </span>
                    <span className="truncate text-meta text-ink-3">{preview || "Empty"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="flex flex-col gap-2 border-t border-line p-3">
        {session.storageMode === "local" ? (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={isGuest ? () => setShowSyncModal(true) : handleSyncToCloud}
            aria-label={isGuest ? "Sync scratchpad to cloud" : "Sync local notes to cloud"}
          >
            <Cloud aria-hidden="true" />
            Go online
          </Button>
        ) : null}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start"
            onClick={() => {
              setSidebarOpen(false);
              setSession(null);
              setSelectedNoteId(null);
              setPassword("");
            }}
            aria-label={isGuest ? "Sign In / Load Account" : "Sign Out"}
          >
            <LockKeyhole aria-hidden="true" />
            {isGuest ? "Open another notepad" : "Lock notepad"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-danger hover:bg-danger-soft hover:text-danger"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={isGuest ? "Delete Scratchpad" : "Delete Notebook"}
            title={isGuest ? "Delete scratchpad" : "Delete notebook"}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="relative flex h-[calc(100dvh-92px)] min-h-[480px] overflow-hidden rounded-panel border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
      {/* ═══ Sidebar ═══ */}
      <aside className="hidden w-[264px] shrink-0 border-r border-line bg-surface-2/40 md:block">{sidebar}</aside>
      {sidebarOpen ? (
        <div className="absolute inset-0 z-30 md:hidden">
          <button
            type="button"
            aria-label="Close notes list"
            tabIndex={-1}
            className="absolute inset-0 animate-fade-in bg-black/30 dark:bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[284px] max-w-[85%] animate-fade-in border-r border-line bg-surface shadow-float">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ═══ Toolbar ═══ */}
        <div className="flex h-[52px] shrink-0 items-center gap-1 border-b border-line px-2 sm:px-3">
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Show notes">
            <PanelLeft aria-hidden="true" />
          </Button>
          <ToolbarButton icon={<Save />} label="Save" onClick={handleSaveNote} disabled={!hasNote} shortcut="Ctrl+S" showLabel />
          <ToolbarDivider />
          <ToolbarButton icon={<Download />} label="Export .md" onClick={handleDownloadOffline} disabled={!hasNote} />
          <ToolbarButton icon={<FileCode2 />} label="Export Secure HTML" onClick={openExport} disabled={!hasNote} />
          <ToolbarButton icon={<Link2 />} label="Share" onClick={handleShareOnline} disabled={!hasNote} />
          <ToolbarButton icon={<Trash2 />} label="Delete" onClick={handleDeleteNote} disabled={!hasNote} danger />

          <div className="ml-auto flex items-center gap-1">
            {hasNote ? (
              <Segmented
                aria-label="Editor mode"
                size="sm"
                value={editorMode}
                onChange={setEditorMode}
                options={[
                  { value: "edit", label: <span className="sr-only lg:not-sr-only">Write</span>, icon: <PenLine aria-hidden="true" /> },
                  { value: "split", label: <span className="sr-only lg:not-sr-only">Split</span>, icon: <Columns2 aria-hidden="true" /> },
                  { value: "preview", label: <span className="sr-only lg:not-sr-only">Preview</span>, icon: <Eye aria-hidden="true" /> },
                ]}
              />
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleFontChange(editorFont === "mono" ? "sans" : "mono")}
              aria-label={editorFont === "mono" ? "Use a proportional font" : "Use a monospace font"}
              title={editorFont === "mono" ? "Proportional font" : "Monospace font"}
            >
              <Type aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* ═══ Username Conflict Rename Banner ═══ */}
        {showRenameModal ? (
          <div className="shrink-0 border-b border-line bg-warn-soft px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <p className="flex flex-1 items-start gap-2 text-small text-ink-2">
                <TriangleAlert aria-hidden="true" className="mt-px size-4 shrink-0 text-warn" />
                <span>
                  <strong className="font-semibold text-ink">@{session.username}</strong> is taken on the server. Pick another username
                  to sync these notes.
                </span>
              </p>
              <form onSubmit={handleRenameAndSync} className="flex shrink-0 items-center gap-2">
                <label htmlFor="rename-username" className="sr-only">
                  New username
                </label>
                <Input
                  id="rename-username"
                  name="rename-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="New username"
                  autoComplete="username"
                  className="h-9 w-full sm:w-48"
                  mono
                  required
                />
                <Button type="submit" size="sm" loading={isRenaming}>
                  Rename and sync
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setShowRenameModal(false);
                    setRenameError(null);
                  }}
                  aria-label="Dismiss rename"
                >
                  <X aria-hidden="true" />
                </Button>
              </form>
            </div>
            {renameError ? (
              <p role="alert" className="mt-1.5 break-words text-small text-danger">
                {renameError}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* ═══ Share link banner ═══ */}
        {shareUrl && sharePassword ? (
          <div className="shrink-0 border-b border-line bg-surface-2/50 px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-small text-ink-2">
                <span className="font-medium text-ink">Link created.</span> Send the link and the password through different channels. It
                expires in 7 days.
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setShareUrl(null);
                  setSharePassword(null);
                }}
                aria-label="Dismiss share link"
                className="-mr-1 -mt-1"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-3 grid gap-2.5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <CopyField label="Link" value={shareUrl} copyLabel="Copy link" />
              <CopyField label="Password" value={sharePassword} secret />
            </div>
          </div>
        ) : null}

        {/* ═══ Error banner ═══ */}
        {error ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-danger-soft px-4 py-2">
            <p role="alert" className="text-small text-danger">
              {error}
            </p>
            <Button variant="ghost" size="icon-sm" onClick={() => setError(null)} aria-label="Dismiss error">
              <X aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        {/* ═══ Editor area ═══ */}
        <div className="flex min-h-0 flex-1 flex-col">
          {selectedNote ? (
            <div className="flex min-h-0 flex-1 flex-col divide-y divide-line md:flex-row md:divide-x md:divide-y-0">
              {(editorMode === "edit" || editorMode === "split") && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className={cn("mx-auto flex min-h-0 w-full flex-1 flex-col", editorMode === "edit" && "max-w-[780px]")}>
                    <div className="shrink-0 px-5 pt-6 sm:px-8 sm:pt-8">
                      <input
                        id="note-title"
                        name="note-title"
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Untitled note"
                        aria-label="Note title"
                        className="w-full min-w-0 bg-transparent text-[24px] font-semibold leading-8 tracking-[-0.025em] text-ink outline-none placeholder:text-ink-3/70 sm:text-[28px] sm:leading-9"
                      />
                      <NoteMeta status={status} dirty={dirty} updatedAt={selectedNote.updatedAt} words={wordCount} />
                    </div>
                    <textarea
                      id="note-body"
                      name="note-body"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      placeholder="Start writing. Markdown works."
                      aria-label="Note body"
                      spellCheck
                      className={cn(
                        "min-h-0 w-full flex-1 resize-none bg-transparent px-5 pb-10 pt-5 text-ink-2 outline-none placeholder:text-ink-3/70 sm:px-8",
                        bodyFont
                      )}
                    />
                  </div>
                </div>
              )}

              {(editorMode === "preview" || editorMode === "split") && (
                <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", editorMode === "split" && "bg-surface-2/30")}>
                  <article className="mx-auto w-full max-w-[720px] px-5 py-6 sm:px-8 sm:py-8">
                    {editorMode === "preview" ? (
                      <>
                        <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.025em] text-ink">{editTitle.trim() || "Untitled note"}</h1>
                        <NoteMeta status={status} dirty={dirty} updatedAt={selectedNote.updatedAt} words={wordCount} />
                        <div className="mb-6 mt-5 border-t border-line" />
                      </>
                    ) : (
                      <p className="eyebrow mb-4 !text-[11px]">Preview</p>
                    )}
                    <div className="text-[15.5px] leading-7 text-ink-2">
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => <h1 className="mb-3 mt-8 text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink first:mt-0" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="mb-2.5 mt-7 text-[20px] font-semibold leading-7 tracking-[-0.015em] text-ink first:mt-0" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="mb-2 mt-6 text-[17px] font-semibold leading-6 text-ink first:mt-0" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-4 whitespace-pre-wrap" {...props} />,
                          ul: ({ node, ...props }) => <ul className="mb-4 list-disc space-y-1 pl-5 marker:text-ink-3" {...props} />,
                          ol: ({ node, ...props }) => <ol className="mb-4 list-decimal space-y-1 pl-5 marker:text-ink-3" {...props} />,
                          li: ({ node, ...props }) => <li className="pl-0.5" {...props} />,
                          blockquote: ({ node, ...props }) => <blockquote className="my-4 border-l-2 border-line-strong pl-4 text-ink-3" {...props} />,
                          code: ({ node, ...props }) => <code className="rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-ink" {...props} />,
                          pre: ({ node, ...props }) => <pre className="my-4 overflow-x-auto rounded-field border border-line bg-surface-2/70 p-4 font-mono text-[13px] [&_code]:bg-transparent [&_code]:p-0" {...props} />,
                          a: ({ node, ...props }) => <a className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink" target="_blank" rel="noopener noreferrer" {...props} />,
                          hr: ({ node, ...props }) => <hr className="my-6 border-line" {...props} />,
                        }}
                      >
                        {editBody || "*Nothing here yet. Start writing to see the preview.*"}
                      </ReactMarkdown>
                    </div>
                  </article>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                compact
                icon={FileText}
                title="No note open"
                description="Pick one from the list, or start a new one."
                action={
                  <Button onClick={handleCreateNote} size="sm">
                    <Plus aria-hidden="true" />
                    New note
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* ═══ Delete Notebook Confirmation ═══ */}
      <ConfirmDialog
        open={showDeleteConfirm}
        tone="danger"
        title={isGuest ? "Delete this scratchpad?" : `Delete @${session.username} and all its notes?`}
        description={
          session.storageMode === "local"
            ? "The encrypted notes are removed from this browser. This can't be undone."
            : "The encrypted notepad is deleted from the server and this browser. This can't be undone."
        }
        confirmLabel="Delete everything"
        onConfirm={() => {
          setSidebarOpen(false);
          void handleDeleteNotebook();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showSyncModal && (
        <ModalDialog
          titleId="sync-dialog-title"
          descriptionId="sync-dialog-description"
          onClose={closeSync}
          panelClassName="relative w-full max-w-[440px] max-h-[calc(100dvh-2rem)] overflow-y-auto animate-rise rounded-panel border border-line bg-surface shadow-float"
        >
          <DialogHeader
            id="sync-dialog-title"
            descriptionId="sync-dialog-description"
            icon={<Cloud aria-hidden="true" />}
            title="Sync your scratchpad"
            description="Choose a username and password. Notes are encrypted with that password before upload, so you can open them on any device."
            onClose={closeSync}
          />
          <form onSubmit={handleCreateAndSync} className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sync-username" className="text-small font-medium text-ink">
                Username
              </label>
              <Input
                id="sync-username"
                name="username"
                type="text"
                required
                value={syncUsername}
                onChange={(e) => setSyncUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex min-h-5 items-end justify-between gap-3">
                <label htmlFor="sync-password" className="text-small font-medium text-ink">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSyncPassword(generateRandomPassword(16));
                    setShowSyncPassword(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-[6px] px-1 text-small font-medium text-ink-2 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
                  aria-label="Generate secure password"
                >
                  <KeyRound aria-hidden="true" className="size-3.5" />
                  Generate
                </button>
              </div>
              <RevealInput
                id="sync-password"
                name="password"
                value={syncPassword}
                onChange={setSyncPassword}
                show={showSyncPassword}
                onToggle={() => setShowSyncPassword(!showSyncPassword)}
                autoComplete="new-password"
              />
              {syncPassword ? <PasswordMeter password={syncPassword} /> : null}
            </div>
            {syncError ? (
              <p role="alert" className="break-words rounded-field bg-danger-soft px-3.5 py-3 text-small text-danger">
                {syncError}
              </p>
            ) : null}
            <Button type="submit" loading={isSyncing} disabled={!syncUsername.trim() || !syncPassword.trim()} className="w-full">
              Create account and sync
            </Button>
          </form>
        </ModalDialog>
      )}

      {showExportHtmlModal && (
        <ModalDialog
          titleId="export-dialog-title"
          descriptionId="export-dialog-description"
          onClose={closeExport}
          panelClassName="relative w-full max-w-[440px] max-h-[calc(100dvh-2rem)] overflow-y-auto animate-rise rounded-panel border border-line bg-surface shadow-float"
        >
          <DialogHeader
            id="export-dialog-title"
            descriptionId="export-dialog-description"
            icon={<FileCode2 aria-hidden="true" />}
            title="Export a self-decrypting file"
            description="Downloads one HTML file with this note encrypted inside. It opens in any browser, offline, with the password you set here."
            onClose={closeExport}
          />
          <form onSubmit={handleExportHtml} className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex min-h-5 items-end justify-between gap-3">
                <label htmlFor="export-password" className="text-small font-medium text-ink">
                  Password for the file
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateRandomPassword(16);
                    setExportPassword(generated);
                    setExportConfirmPassword(generated);
                    setShowExportPassword(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-[6px] px-1 text-small font-medium text-ink-2 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
                  aria-label="Generate secure password"
                >
                  <KeyRound aria-hidden="true" className="size-3.5" />
                  Generate
                </button>
              </div>
              <RevealInput
                id="export-password"
                name="password"
                value={exportPassword}
                onChange={setExportPassword}
                show={showExportPassword}
                onToggle={() => setShowExportPassword(!showExportPassword)}
                autoComplete="new-password"
              />
              {exportPassword ? <PasswordMeter password={exportPassword} /> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="export-confirm-password" className="text-small font-medium text-ink">
                Repeat password
              </label>
              <Input
                id="export-confirm-password"
                name="confirmPassword"
                type={showExportPassword ? "text" : "password"}
                mono
                required
                value={exportConfirmPassword}
                onChange={(e) => setExportConfirmPassword(e.target.value)}
                autoComplete="new-password"
                invalid={exportConfirmPassword.length > 0 && exportConfirmPassword !== exportPassword}
              />
            </div>
            {exportError ? (
              <p role="alert" className="break-words rounded-field bg-danger-soft px-3.5 py-3 text-small text-danger">
                {exportError}
              </p>
            ) : null}
            <Button
              type="submit"
              loading={isExportingHtml}
              disabled={!exportPassword.trim() || exportPassword !== exportConfirmPassword}
              className="w-full"
            >
              <Download aria-hidden="true" />
              Download HTML file
            </Button>
          </form>
        </ModalDialog>
      )}
    </main>
  );
}

// ── Helpers ──

function timeAgo(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 45) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NoteMeta({ status, dirty, updatedAt, words }: { status: string | null; dirty: boolean; updatedAt: number; words: number }) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-3">
      <span aria-live="polite" className="inline-flex items-center gap-1.5">
        {status ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-ink-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
            {status}
          </span>
        ) : dirty ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-warn" />
            Unsaved changes · <Kbd className="h-4 min-w-4 text-[10px]">Ctrl</Kbd>
            <Kbd className="h-4 min-w-4 text-[10px]">S</Kbd>
          </span>
        ) : (
          <span>Saved {timeAgo(updatedAt) === "now" ? "just now" : `${timeAgo(updatedAt)} ago`}</span>
        )}
      </span>
      <span aria-hidden="true">·</span>
      <span className="tabular">
        {words.toLocaleString("en-US")} {words === 1 ? "word" : "words"}
      </span>
      <span aria-hidden="true" className="hidden sm:inline">
        ·
      </span>
      <span className="hidden items-center gap-1 sm:inline-flex">
        <LockKeyhole aria-hidden="true" className="size-3" />
        Encrypted before it&apos;s stored
      </span>
    </p>
  );
}

function PasswordMeter({ password }: { password: string }) {
  const info = strengthFromBits(estimateTypedBits(password));
  return <StrengthMeter info={info} approximate className="mt-1.5" />;
}

function StorageOption({
  active,
  onClick,
  icon,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-field border px-3 py-2.5 text-left outline-none transition-[border-color,background-color,box-shadow] duration-150 ease-seal focus-visible:ring-2 focus-visible:ring-seal/45 [&_svg]:size-4",
        active ? "border-ink bg-surface shadow-[0_0_0_1px_rgb(var(--ink))]" : "border-line-strong bg-surface hover:border-ink-3/60"
      )}
    >
      <span className={cn("flex items-center gap-1.5 text-small font-medium", active ? "text-ink" : "text-ink-2")}>
        {icon}
        {title}
      </span>
      <span className="text-meta text-ink-3">{body}</span>
    </button>
  );
}

function RevealInput({
  id,
  name,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        mono
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        spellCheck={false}
        required
        className="pr-11"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-control text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
      >
        {show ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
}

function DialogHeader({
  id,
  descriptionId,
  icon,
  title,
  description,
  onClose,
}: {
  id: string;
  descriptionId: string;
  icon: ReactNode;
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3.5 border-b border-line p-5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2 [&_svg]:size-[18px]">{icon}</span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h2 id={id} className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink">
          {title}
        </h2>
        <p id={descriptionId} className="mt-1 text-small text-ink-3">
          {description}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close dialog" className="-mr-1.5 -mt-1">
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}

// ── Toolbar Components ──

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
  shortcut,
  showLabel,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
  /** Show the text label from lg up. */
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={shortcut ? `${label} (${shortcut})` : label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-control px-2 text-small font-medium outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-seal/45 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
        danger ? "text-ink-3 hover:bg-danger-soft hover:text-danger" : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
      )}
    >
      {icon}
      {showLabel ? <span className="hidden lg:inline">{label}</span> : null}
    </button>
  );
}

function ToolbarDivider() {
  return <div aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-line" />;
}

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { decrypt, derivePasswordProof, encrypt, generateRandomPassword } from "@protectedshare/crypto";
import type { CreateNoteRequest, CreateNoteResponse } from "@protectedshare/contracts";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@protectedshare/ui";
import { Plus, LogOut, Save, Trash2, Copy, Download, Link2, Check, AlertTriangle, X, FileText, Cloud, Loader2, Key, Eye, EyeOff, Columns, Edit2, Palette, Lock } from "lucide-react";
import { PasswordStrengthIndicator } from "../../components/password-helper";
import ReactMarkdown from "react-markdown";
import { generateSelfDecryptingHtml } from "../../lib/self-decrypting-html";

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

type ThemeConfig = {
  accentBg: string;
  accentHover: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  borderActive: string;
  borderHover: string;
  bgGlow: string;
  name: string;
  colorDot: string;
  focusBorder: string;
};

const themes: Record<string, ThemeConfig> = {
  zinc: {
    name: "Zinc",
    colorDot: "bg-zinc-500",
    accentBg: "bg-blue-600 dark:bg-emerald-500",
    accentHover: "hover:bg-blue-700 dark:hover:bg-emerald-600",
    accentText: "text-blue-600 dark:text-emerald-400",
    badgeBg: "bg-blue-50 dark:bg-emerald-500/10",
    badgeText: "text-blue-600 dark:text-emerald-400",
    borderActive: "border-b-blue-500 dark:border-b-emerald-500",
    borderHover: "hover:border-blue-400 dark:hover:border-emerald-500",
    bgGlow: "bg-blue-500 dark:bg-emerald-500",
    focusBorder: "focus:border-blue-500 dark:focus:border-emerald-500",
  },
  blue: {
    name: "Blue",
    colorDot: "bg-blue-500",
    accentBg: "bg-blue-600 dark:bg-blue-500",
    accentHover: "hover:bg-blue-700 dark:hover:bg-blue-600",
    accentText: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-50 dark:bg-blue-500/10",
    badgeText: "text-blue-600 dark:text-blue-400",
    borderActive: "border-b-blue-500 dark:border-b-blue-500",
    borderHover: "hover:border-blue-400 dark:hover:border-blue-500",
    bgGlow: "bg-blue-500 dark:bg-blue-500",
    focusBorder: "focus:border-blue-500 dark:focus:border-blue-500",
  },
  emerald: {
    name: "Emerald",
    colorDot: "bg-emerald-500",
    accentBg: "bg-emerald-600 dark:bg-emerald-500",
    accentHover: "hover:bg-emerald-700 dark:hover:bg-emerald-600",
    accentText: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-50 dark:bg-emerald-500/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    borderActive: "border-b-emerald-500 dark:border-b-emerald-500",
    borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500",
    bgGlow: "bg-emerald-500 dark:bg-emerald-500",
    focusBorder: "focus:border-emerald-500 dark:focus:border-emerald-500",
  },
  violet: {
    name: "Violet",
    colorDot: "bg-violet-500",
    accentBg: "bg-violet-600 dark:bg-violet-500",
    accentHover: "hover:bg-violet-700 dark:hover:bg-violet-600",
    accentText: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-50 dark:bg-violet-500/10",
    badgeText: "text-violet-600 dark:text-violet-400",
    borderActive: "border-b-violet-500 dark:border-b-violet-500",
    borderHover: "hover:border-violet-400 dark:hover:border-violet-500",
    bgGlow: "bg-violet-500 dark:bg-violet-500",
    focusBorder: "focus:border-violet-500 dark:focus:border-violet-500",
  },
  rose: {
    name: "Rose",
    colorDot: "bg-rose-500",
    accentBg: "bg-rose-600 dark:bg-rose-500",
    accentHover: "hover:bg-rose-700 dark:hover:bg-rose-600",
    accentText: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-50 dark:bg-rose-500/10",
    badgeText: "text-rose-600 dark:text-rose-400",
    borderActive: "border-b-rose-500 dark:border-b-rose-500",
    borderHover: "hover:border-rose-400 dark:hover:border-rose-500",
    bgGlow: "bg-rose-500 dark:bg-rose-500",
    focusBorder: "focus:border-rose-500 dark:focus:border-rose-500",
  },
  amber: {
    name: "Amber",
    colorDot: "bg-amber-500",
    accentBg: "bg-amber-600 dark:bg-amber-500",
    accentHover: "hover:bg-amber-700 dark:hover:bg-amber-600",
    accentText: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-50 dark:bg-amber-500/10",
    badgeText: "text-amber-600 dark:text-amber-400",
    borderActive: "border-b-amber-500 dark:border-b-amber-500",
    borderHover: "hover:border-amber-400 dark:hover:border-amber-500",
    bgGlow: "bg-amber-500 dark:bg-amber-500",
    focusBorder: "focus:border-amber-500 dark:focus:border-amber-500",
  }
};

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

  // Cool Features States
  const [themeColor, setThemeColor] = useState("zinc");
  const [editorMode, setEditorMode] = useState<"edit" | "preview" | "split">("edit");
  
  // HTML Self-Decrypting Export States
  const [showExportHtmlModal, setShowExportHtmlModal] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportConfirmPassword, setExportConfirmPassword] = useState("");
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [clientId] = useState(() => createNoteId());
  const [activeOtherUsersCount, setActiveOtherUsersCount] = useState(0);

  // Initialize theme from localstorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("protectedshare.notepad.theme") || "zinc";
      setThemeColor(savedTheme);
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

  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    localStorage.setItem("protectedshare.notepad.theme", color);
    setShowThemeDropdown(false);
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
      const message = caughtError instanceof Error ? caughtError.message : "Unable to open notepad.";
      setError(message);
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

          alert("Conflict detected: This notepad has been updated on another device. Your changes have been automatically merged to prevent data loss.");

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
            alert(message);
          }
        } else {
          const message = err instanceof Error ? err.message : "Failed to save notes.";
          alert(message);
        }
      }
    }
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
      const htmlContent = generateSelfDecryptingHtml(
        encryptedTitle,
        encryptedBody,
        noteTitle
      );

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
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1200);
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
                  onClick={() => { setAuthMode("signin"); setPassword(""); setShowPassword(false); }}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant={authMode === "create" ? "default" : "outline"}
                  onClick={() => { setAuthMode("create"); setPassword(""); setShowPassword(false); }}
                >
                  Create
                </Button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Storage Target</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      storageMode === "local"
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-white/70 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                    onClick={() => setStorageMode("local")}
                  >
                    💻 Local Browser
                  </button>
                  <button
                    type="button"
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      storageMode === "cloud"
                        ? `${themes[themeColor].accentBg} text-white dark:text-zinc-900 border-transparent shadow-sm`
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-white/70 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                    onClick={() => setStorageMode("cloud")}
                  >
                    ☁️ Cloud Sync
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-550 leading-relaxed font-mono">
                  {storageMode === "local"
                    ? "* Offline local storage. Encrypted directly inside your browser."
                    : "* Edge-synced. Access securely on mobile or laptop via username."}
                </p>
              </div>

              <Input
                id="notepad-username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                autoComplete="username"
                required
              />
              <div className="relative">
                <Input
                  id="notepad-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete={authMode === "create" ? "new-password" : "current-password"}
                  required
                  className={`font-mono h-10 pr-20 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/30 ${themes[themeColor].focusBorder} w-full`}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {authMode === "create" && (
                    <button
                      type="button"
                      onClick={() => setPassword(generateRandomPassword(16))}
                      className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 p-1.5 rounded transition-colors"
                      title="Generate secure password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 p-1.5 rounded transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {authMode === "create" && <PasswordStrengthIndicator password={password} />}
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button type="submit" className="w-full">
                {authMode === "create" ? "Create Notepad" : "Open Notepad"}
              </Button>
            </form>
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-blue-500/30 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/10 h-11"
              onClick={handleStartScratchpad}
            >
              Start Writing (No Signup)
            </Button>
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
        <div className="flex items-center gap-1 px-3 py-1.5 overflow-visible flex-wrap sm:flex-nowrap">
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
            icon={<Lock className="h-4 w-4 text-amber-500 dark:text-amber-400" />}
            label="Export Secure HTML"
            onClick={() => {
              setExportPassword(session.password === "guest" ? "" : session.password);
              setExportConfirmPassword(session.password === "guest" ? "" : session.password);
              setExportError(null);
              setShowExportHtmlModal(true);
            }}
            disabled={!hasNote}
          />
          <ToolbarButton
            icon={<Link2 className="h-4 w-4" />}
            label="Share"
            onClick={handleShareOnline}
            disabled={!hasNote}
          />
          <ToolbarDivider />

          {/* Markdown preview toggle buttons */}
          {hasNote && (
            <>
              <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800/40 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditorMode("edit")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    editorMode === "edit"
                      ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-350"
                  }`}
                  title="Write markdown (Edit mode)"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("split")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    editorMode === "split"
                      ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-350"
                  }`}
                  title="Side-by-side edit and preview"
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("preview")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    editorMode === "preview"
                      ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-350"
                  }`}
                  title="Full preview"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Preview</span>
                </button>
              </div>
              <ToolbarDivider />
            </>
          )}

          {/* Status indicator */}
          {status ? (
            <span className={`text-xs font-medium ${themes[themeColor].accentText} px-2 py-1 rounded ${themes[themeColor].badgeBg} whitespace-nowrap animate-in fade-in`}>
              {status}
            </span>
          ) : null}

          {/* Right side: user info + actions */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {session.storageMode === "local" ? (
              <button
                type="button"
                onClick={session.username === "guest" ? () => setShowSyncModal(true) : handleSyncToCloud}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md ${themes[themeColor].accentBg} ${themes[themeColor].accentHover} text-white dark:text-zinc-950 transition-colors shadow-md`}
                title={session.username === "guest" ? "Sync scratchpad to serverless Cloud" : "Sync offline local notes to serverless Cloud"}
              >
                <Cloud className="h-3 w-3 shrink-0" />
                <span className="hidden md:inline">Go Online</span>
              </button>
            ) : (
              <>
                {activeOtherUsersCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-in fade-in" title={`${activeOtherUsersCount} other device(s) active on this notepad`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>{activeOtherUsersCount} active</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-200/50 dark:bg-zinc-800/40 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800/80">
                  <span className={`w-1.5 h-1.5 rounded-full ${themes[themeColor].bgGlow} animate-pulse`} />
                  <span>cloud</span>
                </span>
              </>
            )}
            <span className="text-xs text-zinc-500 dark:text-zinc-500 font-mono hidden md:inline">
              {session.username === "guest" ? "Scratchpad" : `@${session.username}`}
            </span>
            
            {/* Theme selector */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="flex items-center gap-1 p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 rounded-md transition-colors"
                title="Change notepad theme"
              >
                <Palette className="h-4 w-4" />
              </button>
              {showThemeDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThemeDropdown(false)} 
                  />
                  <div className="absolute right-0 mt-1 w-36 rounded-md shadow-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-900 mb-1">
                      Choose Theme
                    </div>
                    {Object.entries(themes).map(([key, t]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleThemeChange(key)}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition-colors ${
                          themeColor === key 
                            ? "text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900/60" 
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${t.colorDot}`} />
                        <span>{t.name}</span>
                        {themeColor === key && <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <ToolbarButton
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label={session.username === "guest" ? "Delete Scratchpad" : "Delete Notebook"}
              onClick={() => setShowDeleteConfirm(true)}
              danger
              compact
            />
            <ToolbarButton
              icon={<LogOut className="h-3.5 w-3.5" />}
              label={session.username === "guest" ? "Sign In / Load Account" : "Sign Out"}
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

      {/* ═══ Username Conflict Rename Banner ═══ */}
      {showRenameModal ? (
        <div className="shrink-0 border-b border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                The username <strong>@{session.username}</strong> is already taken on the cloud. Choose a different one to sync your local notes:
              </p>
            </div>
            <form onSubmit={handleRenameAndSync} className="flex items-center gap-2 shrink-0">
              <input
                id="rename-username"
                name="rename-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="New username"
                className="h-8 py-1 px-3 text-xs w-48 font-mono rounded-md border border-amber-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
                required
              />
              <button
                type="submit"
                disabled={isRenaming}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-zinc-950 transition-colors disabled:opacity-50"
              >
                {isRenaming ? "Renaming..." : "Rename & Sync"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRenameModal(false);
                  setRenameError(null);
                }}
                className="p-1.5 rounded hover:bg-amber-100 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-400"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
          {renameError ? (
            <p className="text-xs text-red-500 mt-1.5 ml-6">{renameError}</p>
          ) : null}
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
                className={`group relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-r border-zinc-200 dark:border-zinc-800 max-w-[180px] transition-all whitespace-nowrap ${
                  isActive
                    ? `bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-b-2 ${themes[themeColor].borderActive} -mb-px`
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <FileText className={`h-3 w-3 shrink-0 transition-colors ${isActive ? themes[themeColor].accentText : "opacity-50 text-zinc-500"}`} />
                <span className={`truncate transition-colors ${isActive ? themes[themeColor].accentText + " font-bold" : ""}`}>{note.title || "Untitled note"}</span>
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
          <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-900">
            {/* Edit Pane */}
            {(editorMode === "edit" || editorMode === "split") && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Title bar */}
                <div className="shrink-0 border-b border-zinc-100 dark:border-zinc-900 px-4 py-2.5 flex items-center">
                  <input
                    id="note-title"
                    name="note-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full bg-transparent text-lg font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none"
                  />
                  {editorMode === "split" && (
                    <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 ml-2 shrink-0 select-none">
                      Editor
                    </span>
                  )}
                </div>
                {/* Body */}
                <textarea
                  id="note-body"
                  name="note-body"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Start writing..."
                  className="flex-1 w-full resize-none bg-transparent px-4 py-3 text-sm font-mono leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none"
                />
              </div>
            )}

            {/* Preview Pane */}
            {(editorMode === "preview" || editorMode === "split") && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-zinc-50/20 dark:bg-zinc-900/5">
                <div className="px-6 py-5 max-w-2xl w-full mx-auto">
                  <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900 pb-2.5 mb-5">
                    <h1 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 truncate flex-1 pr-4">
                      {editTitle.trim() || "Untitled note"}
                    </h1>
                    <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 shrink-0 select-none">
                      Preview
                    </span>
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-3 border-b border-zinc-200 dark:border-zinc-850 pb-1" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-5 mb-2.5" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 leading-relaxed whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-350" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 font-sans text-zinc-700 dark:text-zinc-350" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 font-sans text-zinc-700 dark:text-zinc-350" {...props} />,
                        li: ({node, ...props}) => <li className="mb-0.5 font-sans text-zinc-700 dark:text-zinc-350" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-750 pl-4 py-0.5 my-4 italic text-zinc-500 dark:text-zinc-400 font-sans" {...props} />,
                        code: ({node, ...props}) => <code className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded px-1.5 py-0.5 text-xs font-mono font-semibold" {...props} />,
                        pre: ({node, ...props}) => <pre className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg p-4 overflow-x-auto my-4 text-xs font-mono" {...props} />,
                        a: ({node, ...props}) => <a className={`font-semibold hover:underline cursor-pointer font-sans ${themes[themeColor].accentText}`} target="_blank" rel="noopener noreferrer" {...props} />
                      }}
                    >
                      {editBody || "*No content. Start writing to see preview.*"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
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

      {showSyncModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => {
              setShowSyncModal(false);
              setSyncError(null);
            }}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-[101] overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowSyncModal(false);
                setSyncError(null);
              }}
              className="absolute right-4 top-4 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2 text-blue-600 dark:text-emerald-500 mb-1">
                <Cloud className="h-5 w-5 animate-pulse" />
                <span className="text-xs uppercase font-mono tracking-wider font-bold">Go Online</span>
              </div>
              <CardTitle className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                Sync Scratchpad to Cloud
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Enter a username and password to secure your notes and sync them to the serverless cloud. This allows you to access them from any device securely.
              </p>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleCreateAndSync} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="sync-username" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Username *</label>
                  <Input
                    id="sync-username"
                    name="username"
                    type="text"
                    required
                    value={syncUsername}
                    onChange={(e) => setSyncUsername(e.target.value)}
                    placeholder="Choose username"
                    className={`h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/30 ${themes[themeColor].focusBorder}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sync-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password *</label>
                  <div className="relative">
                    <Input
                      id="sync-password"
                      name="password"
                      type={showSyncPassword ? "text" : "password"}
                      required
                      value={syncPassword}
                      onChange={(e) => setSyncPassword(e.target.value)}
                      placeholder="Choose password"
                      className={`h-10 pr-20 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/30 ${themes[themeColor].focusBorder} w-full`}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSyncPassword(generateRandomPassword(16))}
                        className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 p-1.5 rounded transition-colors"
                        title="Generate secure password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSyncPassword(!showSyncPassword)}
                        className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 p-1.5 rounded transition-colors"
                        title={showSyncPassword ? "Hide password" : "Show password"}
                      >
                        {showSyncPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <PasswordStrengthIndicator password={syncPassword} />
                </div>

                {syncError ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-500 bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{syncError}</span>
                  </div>
                ) : null}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSyncing || !syncUsername.trim() || !syncPassword.trim()}
                    className="w-full h-11 text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Syncing Notes...
                      </>
                    ) : (
                      "Create Account & Sync"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      )}

      {showExportHtmlModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => {
              setShowExportHtmlModal(false);
              setExportPassword("");
              setExportConfirmPassword("");
              setExportError(null);
            }}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-[101] overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowExportHtmlModal(false);
                setExportPassword("");
                setExportConfirmPassword("");
                setExportError(null);
              }}
              className="absolute right-4 top-4 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 mb-1">
                <Lock className="h-5 w-5" />
                <span className="text-xs uppercase font-mono tracking-wider font-bold">Secure Export</span>
              </div>
              <CardTitle className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                Export Self-Decrypting Note
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Generate a standalone encrypted HTML file. You can open and decrypt it completely offline in any web browser using the password defined below.
              </p>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleExportHtml} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="export-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Decryption Password *</label>
                  <div className="relative">
                    <Input
                      id="export-password"
                      name="password"
                      type={showExportPassword ? "text" : "password"}
                      required
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                      placeholder="Choose password for this file"
                      className={`h-10 pr-20 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/30 ${themes[themeColor].focusBorder} w-full`}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExportPassword(generateRandomPassword(16))}
                        className="text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-250 p-1.5 rounded transition-colors"
                        title="Generate secure password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowExportPassword(!showExportPassword)}
                        className="text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-250 p-1.5 rounded transition-colors"
                        title={showExportPassword ? "Hide password" : "Show password"}
                      >
                        {showExportPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <PasswordStrengthIndicator password={exportPassword} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="export-confirm-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confirm Password *</label>
                  <Input
                    id="export-confirm-password"
                    name="confirmPassword"
                    type={showExportPassword ? "text" : "password"}
                    required
                    value={exportConfirmPassword}
                    onChange={(e) => setExportConfirmPassword(e.target.value)}
                    placeholder="Verify password"
                    className={`h-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/30 ${themes[themeColor].focusBorder}`}
                  />
                </div>

                {exportError ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-500 bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{exportError}</span>
                  </div>
                ) : null}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isExportingHtml || !exportPassword.trim() || exportPassword !== exportConfirmPassword}
                    className={`w-full h-11 text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-300 ${themes[themeColor].accentBg} ${themes[themeColor].accentHover} text-white dark:text-zinc-950`}
                  >
                    {isExportingHtml ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating Archive...
                      </>
                    ) : (
                      "Generate & Download HTML"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      )}

      {/* Internal SEO Links */}
      {!session && (
        <div className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto pb-8">
          <p>Looking for a different tool?</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
            <a href="/notes" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Secure Notes</a>
            <a href="/secrets" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">EnvShare (Dev Keys)</a>
            <a href="/chat" className="hover:text-blue-600 dark:hover:text-emerald-400 hover:underline">Anonymous Chatroom</a>
          </div>
        </div>
      )}
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
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-0.5 shrink-0" />
  );
}

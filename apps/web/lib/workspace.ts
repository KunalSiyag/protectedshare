import { decrypt, encrypt, derivePasswordProof, sha256, type EncryptedPayload } from "@protectedshare/crypto";
import { apiUrl } from "./api";

const WORKSPACE_PREFIX = "protectedshare.workspace.v1";
const WORKSPACE_VERIFIER = "workspace-auth-verifier";

export type WorkspaceNote = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

type WorkspaceRecord = {
  username: string;
  verifier: EncryptedPayload;
  vault: EncryptedPayload;
};

type GetWorkspaceResponse = {
  username: string;
  verifier: EncryptedPayload;
  vault: EncryptedPayload;
  updatedAt: number;
};

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function storageKey(username: string): string {
  return `${WORKSPACE_PREFIX}:${normalizeUsername(username)}`;
}

function parseRecord(value: string | null): WorkspaceRecord | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<WorkspaceRecord>;
    if (
      !parsed ||
      typeof parsed.username !== "string" ||
      !parsed.verifier ||
      !parsed.vault ||
      typeof parsed.verifier.encryptedBlob !== "string" ||
      typeof parsed.verifier.iv !== "string" ||
      typeof parsed.verifier.salt !== "string" ||
      typeof parsed.vault.encryptedBlob !== "string" ||
      typeof parsed.vault.iv !== "string" ||
      typeof parsed.vault.salt !== "string"
    ) {
      return null;
    }
    return parsed as WorkspaceRecord;
  } catch {
    return null;
  }
}

function requireStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("Local storage is unavailable.");
  }
  return window.localStorage;
}

// ──────────────────────────────────────────
// CLOUD SYNC METHOD IMPLEMENTATIONS
// ──────────────────────────────────────────

async function hashUsername(username: string): Promise<string> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new Error("Username is required.");
  }
  // Zero-knowledge hash of username so it cannot be read on the DB
  return sha256(normalized);
}

export async function createWorkspace(username: string, password: string): Promise<void> {
  const hashedUsername = await hashUsername(username);

  if (!password.trim()) {
    throw new Error("Password is required.");
  }

  const verifier = await encrypt(WORKSPACE_VERIFIER, password);
  const vault = await encrypt(JSON.stringify([]), password);
  const passwordProof = await derivePasswordProof(password);

  const payload = {
    username: hashedUsername,
    passwordProof,
    verifier,
    vault
  };

  const response = await fetch(apiUrl("/api/workspaces"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null) as { error?: string } | null;
    if (response.status === 409) {
      throw new Error("A notepad with this username already exists on the cloud. Please sign in instead.");
    }
    throw new Error(errorPayload?.error ?? "Failed to create notepad online.");
  }
}

export type OpenWorkspaceResult = {
  notes: WorkspaceNote[];
  updatedAt: number;
};

export async function openWorkspace(username: string, password: string): Promise<OpenWorkspaceResult> {
  const hashedUsername = await hashUsername(username);

  if (!password.trim()) {
    throw new Error("Password is required.");
  }

  const passwordProof = await derivePasswordProof(password);

  let response = await fetch(apiUrl(`/api/workspaces/${encodeURIComponent(hashedUsername)}?proof=${encodeURIComponent(passwordProof)}`), {
    method: "GET",
    headers: { "Accept": "application/json" }
  });

  let isLegacy = false;
  if (!response.ok && response.status === 401) {
    // Attempt fallback with legacy proof (SHA-256)
    const legacyProof = await sha256(password);
    const legacyResponse = await fetch(apiUrl(`/api/workspaces/${encodeURIComponent(hashedUsername)}?proof=${encodeURIComponent(legacyProof)}`), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (legacyResponse.ok) {
      response = legacyResponse;
      isLegacy = true;
    }
  }

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null) as { error?: string } | null;
    if (response.status === 401 || response.status === 404) {
      throw new Error("Invalid username or password.");
    }
    throw new Error(errorPayload?.error ?? "Failed to open notepad online.");
  }

  const data = await response.json() as GetWorkspaceResponse;

  const verifier = await decrypt(
    data.verifier.encryptedBlob,
    password,
    data.verifier.iv,
    data.verifier.salt
  );

  if (verifier !== WORKSPACE_VERIFIER) {
    throw new Error("Invalid username or password.");
  }

  // Upgrade the proof on the server dynamically and transparently
  if (isLegacy) {
    try {
      const legacyProof = await sha256(password);
      await fetch(apiUrl(`/api/workspaces/${encodeURIComponent(hashedUsername)}/migrate-proof`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legacyProof, newProof: passwordProof })
      });
      console.log(`[Migration] Successfully upgraded password proof to PBKDF2 for workspace: ${username}`);
    } catch (migrationErr) {
      console.error("[Migration] Failed to migrate password proof to PBKDF2 format:", migrationErr);
    }
  }

  const decryptedVault = await decrypt(
    data.vault.encryptedBlob,
    password,
    data.vault.iv,
    data.vault.salt
  );

  const notes = JSON.parse(decryptedVault) as WorkspaceNote[];
  if (!Array.isArray(notes)) {
    throw new Error("Notepad data is corrupted.");
  }

  const sortedNotes = notes.sort((first, second) => second.updatedAt - first.updatedAt);
  return {
    notes: sortedNotes,
    updatedAt: data.updatedAt
  };
}

export async function saveWorkspaceNotes(
  username: string,
  password: string,
  notes: WorkspaceNote[],
  lastKnownUpdatedAt?: number
): Promise<number> {
  const hashedUsername = await hashUsername(username);
  const vault = await encrypt(JSON.stringify(notes), password);
  const passwordProof = await derivePasswordProof(password);

  const payload = {
    passwordProof,
    vault,
    lastKnownUpdatedAt
  };

  const response = await fetch(apiUrl(`/api/workspaces/${encodeURIComponent(hashedUsername)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null) as {
      error?: string;
      code?: string;
      updatedAt?: number;
      vault?: EncryptedPayload;
    } | null;
    if (response.status === 409 && errorPayload?.code === "SYNC_CONFLICT") {
      throw new WorkspaceConflictError(
        errorPayload.error ?? "Conflict detected.",
        errorPayload.updatedAt ?? 0,
        errorPayload.vault
      );
    }
    throw new Error(errorPayload?.error ?? "Failed to save notepad notes online.");
  }

  const resJson = await response.json() as { success: boolean; updatedAt: number };
  return resJson.updatedAt;
}

export async function sendWorkspaceHeartbeat(
  username: string,
  password: string,
  clientId: string
): Promise<number> {
  const hashedUsername = await hashUsername(username);
  const passwordProof = await derivePasswordProof(password);

  const response = await fetch(apiUrl(`/api/workspaces/${encodeURIComponent(hashedUsername)}/heartbeat`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passwordProof, clientId })
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(errorPayload?.error ?? "Heartbeat failed");
  }

  const resJson = await response.json() as { success: boolean; activeOtherUsers: number };
  return resJson.activeOtherUsers;
}

export async function deleteWorkspace(username: string, password: string): Promise<void> {
  const hashedUsername = await hashUsername(username);
  const passwordProof = await derivePasswordProof(password);

  const response = await fetch(apiUrl(`/api/workspaces/${encodeURIComponent(hashedUsername)}?proof=${encodeURIComponent(passwordProof)}`), {
    method: "DELETE"
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(errorPayload?.error ?? "Failed to delete notepad online.");
  }
}

// ──────────────────────────────────────────
// LOCAL STORAGE METHOD IMPLEMENTATIONS
// ──────────────────────────────────────────

export async function createWorkspaceLocal(username: string, password: string): Promise<void> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new Error("Username is required.");
  }
  if (!password.trim()) {
    throw new Error("Password is required.");
  }

  const storage = requireStorage();
  if (storage.getItem(storageKey(normalized))) {
    throw new Error("A local notepad with this username already exists. Please sign in instead.");
  }

  const verifier = await encrypt(WORKSPACE_VERIFIER, password);
  const vault = await encrypt(JSON.stringify([]), password);

  const record: WorkspaceRecord = {
    username: normalized,
    verifier,
    vault
  };

  storage.setItem(storageKey(normalized), JSON.stringify(record));
}

export async function openWorkspaceLocal(username: string, password: string): Promise<WorkspaceNote[]> {
  const normalized = normalizeUsername(username);
  const storage = requireStorage();
  const record = parseRecord(storage.getItem(storageKey(normalized)));

  if (!record) {
    throw new Error("Local notepad not found. Create one first.");
  }

  const verifier = await decrypt(
    record.verifier.encryptedBlob,
    password,
    record.verifier.iv,
    record.verifier.salt
  );

  if (verifier !== WORKSPACE_VERIFIER) {
    throw new Error("Invalid username or password.");
  }

  const decryptedVault = await decrypt(
    record.vault.encryptedBlob,
    password,
    record.vault.iv,
    record.vault.salt
  );

  const notes = JSON.parse(decryptedVault) as WorkspaceNote[];
  if (!Array.isArray(notes)) {
    throw new Error("Notepad data is corrupted.");
  }

  return notes.sort((first, second) => second.updatedAt - first.updatedAt);
}

export async function saveWorkspaceNotesLocal(username: string, password: string, notes: WorkspaceNote[]): Promise<void> {
  const normalized = normalizeUsername(username);
  const storage = requireStorage();
  const record = parseRecord(storage.getItem(storageKey(normalized)));
  if (!record) {
    throw new Error("Local notepad not found.");
  }

  const vault = await encrypt(JSON.stringify(notes), password);
  const updatedRecord: WorkspaceRecord = {
    ...record,
    vault
  };

  storage.setItem(storageKey(normalized), JSON.stringify(updatedRecord));
}

export async function deleteWorkspaceLocal(username: string, password: string): Promise<void> {
  const normalized = normalizeUsername(username);
  const storage = requireStorage();
  const record = parseRecord(storage.getItem(storageKey(normalized)));
  if (!record) {
    throw new Error("Local notepad not found.");
  }

  const verifier = await decrypt(
    record.verifier.encryptedBlob,
    password,
    record.verifier.iv,
    record.verifier.salt
  );

  if (verifier !== WORKSPACE_VERIFIER) {
    throw new Error("Invalid password. Cannot delete notepad.");
  }

  storage.removeItem(storageKey(normalized));
}

export async function renameWorkspaceLocal(
  oldUsername: string,
  newUsername: string,
  password: string
): Promise<void> {
  const oldNormalized = normalizeUsername(oldUsername);
  const newNormalized = normalizeUsername(newUsername);

  if (!newNormalized) {
    throw new Error("New username is required.");
  }
  if (oldNormalized === newNormalized) return;

  const storage = requireStorage();
  const record = parseRecord(storage.getItem(storageKey(oldNormalized)));
  if (!record) {
    throw new Error("Local notepad not found.");
  }

  // Verify password before allowing rename
  const verifier = await decrypt(
    record.verifier.encryptedBlob,
    password,
    record.verifier.iv,
    record.verifier.salt
  );
  if (verifier !== WORKSPACE_VERIFIER) {
    throw new Error("Invalid password.");
  }

  // Block if new username already exists locally
  if (storage.getItem(storageKey(newNormalized))) {
    throw new Error("A local notepad with this username already exists.");
  }

  // Atomic rename: write new key, delete old key
  const updatedRecord: WorkspaceRecord = { ...record, username: newNormalized };
  storage.setItem(storageKey(newNormalized), JSON.stringify(updatedRecord));
  storage.removeItem(storageKey(oldNormalized));
}

/**
 * Custom error thrown when a cloud sync fails because the username
 * is already taken by a different account (different password).
 * The UI catches this to show the rename prompt.
 */
export class UsernameConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsernameConflictError";
  }
}

export class WorkspaceConflictError extends Error {
  constructor(
    message: string,
    public updatedAt: number,
    public vault?: { encryptedBlob: string; iv: string; salt: string }
  ) {
    super(message);
    this.name = "WorkspaceConflictError";
  }
}

export async function syncLocalWorkspaceToCloud(username: string, password: string, notes: WorkspaceNote[]): Promise<void> {
  try {
    // 1. Try to create the workspace online (this checks if username is unique)
    await createWorkspace(username, password);
    // If creation succeeds, upload all existing local notes to the online database
    await saveWorkspaceNotes(username, password, notes);
  } catch (createError: unknown) {
    const errorMsg = createError instanceof Error ? createError.message : "";
    if (errorMsg.includes("already exists")) {
      // The workspace already exists online under this username.
      // Let's verify if the password matches the online workspace by opening it.
      try {
        const openRes = await openWorkspace(username, password);
        // If authentication succeeds, we can safely sync/overwrite the online notes.
        await saveWorkspaceNotes(username, password, notes, openRes.updatedAt);
      } catch {
        // If opening fails, it means the username belongs to someone else (wrong password).
        throw new UsernameConflictError("This username is already taken on the cloud. Choose a different username to upload your notes.");
      }
    } else {
      // Rethrow other errors (network issues, database errors, etc.)
      throw createError;
    }
  }
}


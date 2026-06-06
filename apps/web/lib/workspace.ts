import { decrypt, encrypt, derivePasswordProof, type EncryptedPayload } from "@protectedshare/crypto";
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
  return derivePasswordProof(normalized);
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

export async function openWorkspace(username: string, password: string): Promise<WorkspaceNote[]> {
  const hashedUsername = await hashUsername(username);

  if (!password.trim()) {
    throw new Error("Password is required.");
  }

  const passwordProof = await derivePasswordProof(password);

  const response = await fetch(apiUrl(`/api/workspaces/${encodeURIComponent(hashedUsername)}?proof=${encodeURIComponent(passwordProof)}`), {
    method: "GET",
    headers: { "Accept": "application/json" }
  });

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

  return notes.sort((first, second) => second.updatedAt - first.updatedAt);
}

export async function saveWorkspaceNotes(username: string, password: string, notes: WorkspaceNote[]): Promise<void> {
  const hashedUsername = await hashUsername(username);
  const vault = await encrypt(JSON.stringify(notes), password);
  const passwordProof = await derivePasswordProof(password);

  const payload = {
    passwordProof,
    vault
  };

  const response = await fetch(apiUrl(`/api/workspaces/${encodeURIComponent(hashedUsername)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(errorPayload?.error ?? "Failed to save notepad notes online.");
  }
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

export async function syncLocalWorkspaceToCloud(username: string, password: string, notes: WorkspaceNote[]): Promise<void> {
  // This will throw 409 if the username is already registered online
  await createWorkspace(username, password);

  // If creation succeeds, upload all existing local notes to the online database
  await saveWorkspaceNotes(username, password, notes);
}

import { decrypt, encrypt, type EncryptedPayload } from "@protectedshare/crypto";

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

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function storageKey(username: string): string {
  return `${WORKSPACE_PREFIX}:${normalizeUsername(username)}`;
}

function parseRecord(value: string | null): WorkspaceRecord | null {
  if (!value) {
    return null;
  }

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

  return {
    username: parsed.username,
    verifier: parsed.verifier,
    vault: parsed.vault
  };
}

function requireStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("Local storage is unavailable.");
  }

  return window.localStorage;
}

export async function createWorkspace(username: string, password: string): Promise<void> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new Error("Username is required.");
  }

  if (!password.trim()) {
    throw new Error("Password is required.");
  }

  const storage = requireStorage();
  if (storage.getItem(storageKey(normalized))) {
    throw new Error("A notepad with this username already exists. Please sign in instead.");
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

export async function openWorkspace(username: string, password: string): Promise<WorkspaceNote[]> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new Error("Username is required.");
  }

  if (!password.trim()) {
    throw new Error("Password is required.");
  }

  const storage = requireStorage();
  const record = parseRecord(storage.getItem(storageKey(normalized)));
  if (!record) {
    throw new Error("Notepad not found. Create one first.");
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

export async function saveWorkspaceNotes(username: string, password: string, notes: WorkspaceNote[]): Promise<void> {
  const normalized = normalizeUsername(username);
  const storage = requireStorage();
  const record = parseRecord(storage.getItem(storageKey(normalized)));
  if (!record) {
    throw new Error("Notepad not found.");
  }

  const vault = await encrypt(JSON.stringify(notes), password);
  const updatedRecord: WorkspaceRecord = {
    ...record,
    vault
  };

  storage.setItem(storageKey(normalized), JSON.stringify(updatedRecord));
}

export async function deleteWorkspace(username: string, password: string): Promise<void> {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    throw new Error("Username is required.");
  }

  const storage = requireStorage();
  const record = parseRecord(storage.getItem(storageKey(normalized)));
  if (!record) {
    throw new Error("Notepad not found.");
  }

  // Verify password before deletion
  const verifier = await decrypt(
    record.verifier.encryptedBlob,
    password,
    record.verifier.iv,
    record.verifier.salt
  );

  if (verifier !== WORKSPACE_VERIFIER) {
    throw new Error("Invalid password. Cannot delete notebook.");
  }

  storage.removeItem(storageKey(normalized));
}

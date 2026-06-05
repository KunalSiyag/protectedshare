import { decrypt, encrypt, derivePasswordProof, type EncryptedPayload } from "@protectedshare/crypto";
import { apiUrl } from "./api";

const WORKSPACE_VERIFIER = "workspace-auth-verifier";

export type WorkspaceNote = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

type GetWorkspaceResponse = {
  username: string;
  verifier: EncryptedPayload;
  vault: EncryptedPayload;
};

async function hashUsername(username: string): Promise<string> {
  const normalized = username.trim().toLowerCase();
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
      throw new Error("A notepad with this username already exists. Please sign in instead.");
    }
    throw new Error(errorPayload?.error ?? "Failed to create notepad.");
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
    throw new Error(errorPayload?.error ?? "Failed to open notepad.");
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
    throw new Error(errorPayload?.error ?? "Failed to save notepad notes.");
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
    throw new Error(errorPayload?.error ?? "Failed to delete notepad.");
  }
}

import { decrypt, derivePasswordProof, encrypt, type EncryptedPayload } from "@protectedshare/crypto";

type SealRequest = { id: number; op: "seal"; plaintext: string; password: string };
type ProofRequest = { id: number; op: "proof"; password: string };
type DecryptRequest = {
  id: number;
  op: "decrypt";
  password: string;
  encryptedBlob: string;
  iv: string;
  salt: string;
};
type RequestMessage = SealRequest | ProofRequest | DecryptRequest;

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<RequestMessage>) => void) | null;
  postMessage: (message: unknown) => void;
};

scope.onmessage = async (event) => {
  const message = event.data;
  try {
    if (message.op === "seal") {
      const payload: EncryptedPayload = await encrypt(message.plaintext, message.password);
      const passwordProof = await derivePasswordProof(message.password);
      scope.postMessage({ id: message.id, ok: true, payload, passwordProof });
      return;
    }

    if (message.op === "proof") {
      const passwordProof = await derivePasswordProof(message.password);
      scope.postMessage({ id: message.id, ok: true, passwordProof });
      return;
    }

    const plaintext = await decrypt(message.encryptedBlob, message.password, message.iv, message.salt);
    scope.postMessage({ id: message.id, ok: true, plaintext });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Encryption failed.";
    scope.postMessage({ id: message.id, ok: false, error: text });
  }
};

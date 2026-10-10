import {
  decrypt,
  deriveAuthToken,
  derivePasswordProof,
  encrypt,
  openText,
  sealText,
  type EncryptedPayload,
  type KdfMode,
  type SealedV2,
  type SecretInput,
} from "@protectedshare/crypto";

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
type SealV2Request = { id: number; op: "sealV2"; plaintext: string; secret: SecretInput };
type OpenV2Request = { id: number; op: "openV2"; payload: SealedV2; secret: SecretInput };
type AuthV2Request = { id: number; op: "authV2"; secret: SecretInput; salt: string; kdf: KdfMode };
type RequestMessage = SealRequest | ProofRequest | DecryptRequest | SealV2Request | OpenV2Request | AuthV2Request;

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

    if (message.op === "sealV2") {
      const sealed = await sealText(message.plaintext, message.secret);
      scope.postMessage({ id: message.id, ok: true, sealed });
      return;
    }

    if (message.op === "openV2") {
      const plaintext = await openText(message.payload, message.secret);
      scope.postMessage({ id: message.id, ok: true, plaintext });
      return;
    }

    if (message.op === "authV2") {
      const authToken = await deriveAuthToken(message.secret, message.salt, message.kdf);
      scope.postMessage({ id: message.id, ok: true, authToken });
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

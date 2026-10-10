import { armorText, dearmorText } from "@protectedshare/crypto";

type ArmorRequest = { id: number; op: "armor"; plaintext: string; password: string };
type DearmorRequest = { id: number; op: "dearmor"; armored: string; password: string };
type ArmorMessage = ArmorRequest | DearmorRequest | { id: number; op: "ping" };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ArmorMessage>) => void) | null;
  postMessage: (message: unknown) => void;
};

scope.onmessage = async (event) => {
  const message = event.data;
  try {
    if (message.op === "ping") {
      scope.postMessage({ id: message.id, ok: true });
      return;
    }
    const text =
      message.op === "armor"
        ? await armorText(message.plaintext, message.password)
        : await dearmorText(message.armored, message.password);
    scope.postMessage({ id: message.id, ok: true, text });
  } catch (error) {
    scope.postMessage({ id: message.id, ok: false, error: error instanceof Error ? error.message : "Failed." });
  }
};

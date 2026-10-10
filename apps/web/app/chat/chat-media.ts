import { MAX_ATTACHMENT_BYTES, formatBytes, type FileAttachment } from "./chat-lib";

const MAX_IMAGE_EDGE = 1600;
/** Raster types we decode and show inline. SVG is never rendered inline. */
const INLINE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/bmp"]);

export function isInlineImage(file: Pick<FileAttachment, "type">): boolean {
  return INLINE_IMAGE_TYPES.has(file.type);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBlob(data: string, type: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

let webpSupport: boolean | null = null;
function supportsWebp(): boolean {
  if (webpSupport === null) {
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    webpSupport = probe.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpSupport;
}

async function loadImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // fall through to <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return { source: image, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Re-encodes a photo: longest edge ≤ 1600 px, WebP (JPEG where WebP encoding is missing),
 * stepping quality and size down until it fits. Re-encoding also drops EXIF data such as location.
 */
async function prepareImage(file: File): Promise<FileAttachment> {
  const image = await loadImage(file);
  try {
    let scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
    const qualities = [0.86, 0.78, 0.68, 0.56];
    const format = supportsWebp() ? "image/webp" : "image/jpeg";
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser can't prepare images.");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(image.source, 0, 0, width, height);
      for (const quality of qualities) {
        const blob = await canvasToBlob(canvas, format, quality);
        if (blob && blob.size <= MAX_ATTACHMENT_BYTES) {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const extension = blob.type === "image/webp" ? "webp" : "jpg";
          const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
          return {
            name: `${baseName}.${extension}`,
            type: blob.type || format,
            size: bytes.length,
            data: bytesToBase64(bytes),
            w: width,
            h: height,
          };
        }
      }
      scale *= 0.72;
    }
    throw new Error("That image is too detailed to send, even after resizing.");
  } finally {
    image.close?.();
  }
}

/** Turns a picked, pasted or dropped file into an attachment, or throws a readable error. */
export async function prepareAttachment(file: File): Promise<FileAttachment> {
  const resizable = /^image\/(jpeg|png|webp|bmp|avif)$/.test(file.type);
  if (resizable) return prepareImage(file);
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`Files can be up to ${formatBytes(MAX_ATTACHMENT_BYTES)}. This one is ${formatBytes(file.size)}.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let width: number | undefined;
  let height: number | undefined;
  if (file.type === "image/gif") {
    try {
      const image = await loadImage(file);
      width = image.width;
      height = image.height;
      image.close?.();
    } catch {
      // keep as a plain file
    }
  }
  return {
    name: file.name.slice(0, 200) || "file",
    type: file.type || "application/octet-stream",
    size: bytes.length,
    data: bytesToBase64(bytes),
    w: width,
    h: height,
  };
}

/** Saves an attachment through a temporary object URL. */
export function downloadAttachment(file: FileAttachment): void {
  const blob = base64ToBlob(file.data, "application/octet-stream");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

import { encode } from "uqr";

/** Error correction for every code this tool draws. The on-screen code uses the same level. */
export const WIFI_QR_ECC = "M" as const;

/** The spec asks for 4 light modules around the code so scanners can find its edges. */
const QUIET_ZONE = 4;

function matrix(value: string) {
  const result = encode(value, { ecc: WIFI_QR_ECC, border: 0 });
  return { size: result.size, data: result.data };
}

/** Standalone SVG: black modules on white, with a quiet zone, crisp at any size. */
export function qrSvgFile(value: string): string {
  const { size, data } = matrix(value);
  const total = size + QUIET_ZONE * 2;
  let d = "";
  data.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x += 1;
      d += `M${start + QUIET_ZONE} ${y + QUIET_ZONE}h${x - start}v1h-${x - start}z`;
    }
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total * 16}" height="${total * 16}" shape-rendering="crispEdges">`,
    `<rect width="${total}" height="${total}" fill="#ffffff"/>`,
    `<path d="${d}" fill="#000000"/>`,
    `</svg>`,
    "",
  ].join("\n");
}

/** PNG of about `target` pixels, whole pixels per module so edges stay sharp. */
export function qrPngFile(value: string, target = 1024): Promise<Blob> {
  const { size, data } = matrix(value);
  const total = size + QUIET_ZONE * 2;
  const scale = Math.max(1, Math.floor(target / total));
  const canvas = document.createElement("canvas");
  canvas.width = total * scale;
  canvas.height = total * scale;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas is unavailable."));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000000";
  data.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) context.fillRect((x + QUIET_ZONE) * scale, (y + QUIET_ZONE) * scale, scale, scale);
    });
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't make the PNG."))), "image/png");
  });
}

/** Save a Blob through a temporary object URL. Nothing is uploaded. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

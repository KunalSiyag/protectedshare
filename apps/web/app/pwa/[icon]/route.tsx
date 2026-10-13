import { ImageResponse } from "next/og";
import { KEYHOLE_PATH, SEAL_PATH } from "../../../components/seal-mark";

/**
 * PNG icons for the web app manifest (install, splash screen, share sheet) and for notifications.
 * Same seal as app/apple-icon.tsx. Rendered once at build time.
 */
const ICONS = {
  // Regular icons: the seal fills most of the canvas.
  "icon-192.png": { size: 192, scale: 0.74, background: "#F6F7F7", mono: false },
  "icon-512.png": { size: 512, scale: 0.74, background: "#F6F7F7", mono: false },
  // Maskable: Android may crop to a circle, so the seal stays inside the central 80% safe zone.
  "maskable-512.png": { size: 512, scale: 0.56, background: "#F6F7F7", mono: false },
  // Notification badge (Android status bar): white silhouette on transparent, keyhole cut out.
  "badge-96.png": { size: 96, scale: 0.9, background: "transparent", mono: true },
} as const;

type IconName = keyof typeof ICONS;

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((icon) => ({ icon }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ icon: string }> }) {
  const { icon } = await params;
  const spec = ICONS[icon as IconName];
  if (!spec) return new Response("Not found", { status: 404 });
  const mark = Math.round(spec.size * spec.scale);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: spec.background }}>
        {spec.mono ? (
          <svg width={mark} height={mark} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d={`${SEAL_PATH} ${KEYHOLE_PATH}`} fill="#ffffff" fillRule="evenodd" />
          </svg>
        ) : (
          <svg width={mark} height={mark} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d={SEAL_PATH} fill="#E8470F" />
            <circle cx="12" cy="12" r="7.6" fill="none" stroke="#ffffff" strokeOpacity="0.38" strokeWidth="0.6" />
            <path d={KEYHOLE_PATH} fill="#ffffff" />
          </svg>
        )}
      </div>
    ),
    // The URLs carry no hash, so don't let ImageResponse's default (immutable, one year) pin an old icon.
    { width: spec.size, height: spec.size, headers: { "Cache-Control": "public, max-age=86400" } }
  );
}

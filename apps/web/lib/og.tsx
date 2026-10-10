import { ImageResponse } from "next/og";
import { KEYHOLE_PATH, SEAL_PATH } from "../components/seal-mark";

export const OG_SIZE = { width: 1200, height: 630 };

/** Sealed palette, light. OG images are always light so they read the same everywhere. */
const BG = "#F6F7F7";
const SURFACE = "#FFFFFF";
const LINE = "#DFE3E3";
const INK = "#0A0F0F";
const INK_2 = "#3E4747";
const INK_3 = "#6C7777";
const SEAL = "#E8470F";

function wrap(title: string, max = 26): string {
  const lines: string[] = [];
  let current = "";
  for (const word of title.split(" ")) {
    if ((current + " " + word).trim().length > max && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 3).join("\n");
}

export function makeOgImage(title: string, subtitle?: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px 56px",
          background: BG,
          color: INK,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 24 24">
            <path d={SEAL_PATH} fill={SEAL} />
            <circle cx="12" cy="12" r="7.6" fill="none" stroke="#ffffff" strokeOpacity="0.38" strokeWidth="0.6" />
            <path d={KEYHOLE_PATH} fill="#ffffff" />
          </svg>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, display: "flex" }}>ProtectedShare</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: -2.6,
              whiteSpace: "pre-wrap",
              color: INK,
            }}
          >
            {wrap(title)}
          </div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 30, lineHeight: 1.35, color: INK_2, maxWidth: 940 }}>{subtitle}</div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 26,
            borderTop: `1px solid ${LINE}`,
            fontSize: 22,
            color: INK_3,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${LINE}`,
                background: SURFACE,
                color: INK,
                fontFamily: "monospace",
                fontSize: 20,
              }}
            >
              #k=…
            </div>
            <span>Everything after # never reaches a server.</span>
          </div>
          <span style={{ color: INK_2 }}>protectedshare.me</span>
        </div>
      </div>
    ),
    OG_SIZE
  );
}

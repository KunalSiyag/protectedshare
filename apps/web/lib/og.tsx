import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

export function makeOgImage(title: string, subtitle?: string) {
  const words = title.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > 22) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }
  if (current.trim()) lines.push(current.trim());
  const headline = lines.slice(0, 3).join("\n");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#10b981",
              borderRadius: 16,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="#09090b">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
              />
            </svg>
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, display: "flex" }}>
            ProtectedShare
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -2,
            whiteSpace: "pre-wrap",
          }}
        >
          {headline}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {subtitle ? (
            <div
              style={{
                display: "flex",
                fontSize: 32,
                color: "#a1a1aa",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 26,
              color: "#10b981",
              fontWeight: 600,
            }}
          >
            <span>AES-256 zero-knowledge encryption</span>
            <span style={{ color: "#52525b" }}>•</span>
            <span>No signup</span>
            <span style={{ color: "#52525b" }}>•</span>
            <span>protectedshare.me</span>
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}

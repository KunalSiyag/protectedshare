import { ImageResponse } from "next/og";
import { KEYHOLE_PATH, SEAL_PATH } from "../components/seal-mark";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

/** Home-screen icon: the vermilion seal with its keyhole on the light Sealed canvas. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F7F7",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d={SEAL_PATH} fill="#E8470F" />
          <circle cx="12" cy="12" r="7.6" fill="none" stroke="#ffffff" strokeOpacity="0.38" strokeWidth="0.6" />
          <path d={KEYHOLE_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size }
  );
}

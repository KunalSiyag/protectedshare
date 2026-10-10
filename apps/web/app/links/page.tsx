import type { Metadata } from "next";
import LinksClient from "./links-client";

export const metadata: Metadata = {
  title: "My links",
  description: "Links you created in this browser, with their status: opened, burned, expired or revoked. Saved only on this device.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://protectedshare.me/links" },
};

export default function LinksPage() {
  return <LinksClient />;
}

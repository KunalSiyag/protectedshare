import type { Metadata } from "next";
import RequestClient from "./request-client";

const title = "Ask Someone to Send You a Password";
const description =
  "Send a link, get a secret back. It's encrypted in their browser to a key only your inbox link holds. No accounts on either side.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://protectedshare.me/request",
  },
  openGraph: {
    title: `${title} — ProtectedShare`,
    description,
    url: "https://protectedshare.me/request",
  },
  twitter: {
    title: `${title} — ProtectedShare`,
    description,
  },
};

export default function RequestPage() {
  return <RequestClient />;
}

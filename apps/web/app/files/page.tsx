import type { Metadata } from "next";
import FilesClient from "./files-client";

const DESCRIPTION =
  "Send files up to 25 MB, encrypted in your browser. File names stay encrypted, and the drop is deleted after the downloads you allow or at expiry.";

export const metadata: Metadata = {
  title: "Encrypted File Drop",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://protectedshare.me/files",
  },
  openGraph: {
    title: "Encrypted File Drop — ProtectedShare",
    description: DESCRIPTION,
    url: "https://protectedshare.me/files",
  },
  twitter: {
    title: "Encrypted File Drop — ProtectedShare",
    description: DESCRIPTION,
  },
};

export default function FilesPage() {
  return <FilesClient />;
}

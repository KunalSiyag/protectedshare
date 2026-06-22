import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decrypt Secure Note | ProtectedShare",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DecryptNoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

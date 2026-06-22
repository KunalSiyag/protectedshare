import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decrypt Secret | ProtectedShare",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DecryptSecretLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";
import DropClient from "./drop-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Encrypted files",
    description: "Someone sent you encrypted files. They decrypt in your browser.",
    robots: { index: false, follow: false },
    alternates: { canonical: `https://protectedshare.me/files/${id}` },
  };
}

export default async function DropPage({ params }: PageProps) {
  const { id } = await params;
  return <DropClient id={id} />;
}

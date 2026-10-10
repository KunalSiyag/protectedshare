import type { Metadata } from "next";
import SenderClient from "./sender-client";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Answer a secret request",
    description: "Someone asked you for a secret. It's encrypted in your browser before it's sent.",
    robots: { index: false, follow: false },
    alternates: { canonical: `https://protectedshare.me/request/${id}` },
  };
}

export default async function RequestSenderPage({ params }: PageProps) {
  const { id } = await params;
  return <SenderClient id={id} />;
}

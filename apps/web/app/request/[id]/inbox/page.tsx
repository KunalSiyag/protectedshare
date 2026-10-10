import type { Metadata } from "next";
import InboxClient from "./inbox-client";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Your secret request inbox",
    robots: { index: false, follow: false },
    alternates: { canonical: `https://protectedshare.me/request/${id}/inbox` },
    referrer: "no-referrer",
  };
}

export default async function RequestInboxPage({ params }: PageProps) {
  const { id } = await params;
  return <InboxClient id={id} />;
}

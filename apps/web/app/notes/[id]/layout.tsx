import type { Metadata } from "next";

type LayoutProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Open secure note",
    robots: { index: false, follow: false },
    alternates: { canonical: `https://protectedshare.me/notes/${id}` },
  };
}

export default function DecryptNoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

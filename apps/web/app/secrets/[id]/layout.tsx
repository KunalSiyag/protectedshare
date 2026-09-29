import type { Metadata } from "next";

type LayoutProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Open secret",
    robots: { index: false, follow: false },
    alternates: { canonical: `https://protectedshare.me/secrets/${id}` },
  };
}

export default function DecryptSecretLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

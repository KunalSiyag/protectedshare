import { redirect } from "next/navigation";

export default async function LegacyNoteByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/notes/${id}`);
}

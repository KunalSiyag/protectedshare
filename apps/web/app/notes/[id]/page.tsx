import NoteReader from "./note-reader";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NoteReader id={id} />;
}

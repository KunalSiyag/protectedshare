import SecretReader from "./secret-reader";

export default async function SecretPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SecretReader id={id} />;
}

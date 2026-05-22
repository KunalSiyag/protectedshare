import { redirect } from "next/navigation";

export default function LegacyNotesPage() {
  redirect("/notes");
}

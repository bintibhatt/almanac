import { redirect } from "next/navigation";

export default async function LegacyNotePage({ params }) {
  const { slug } = await params;

  redirect(`/notes/${slug}`);
}

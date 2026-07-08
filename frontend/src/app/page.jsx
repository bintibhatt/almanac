import { getAllNotes } from "../lib/notes";

export default function Home() {
  const notes = getAllNotes();

  console.log(notes);

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}
import { getAllNotes } from "../lib/notes";

export default function Home() {
  const notes = getAllNotes();

  return (
    <div>
      <h1>EngineerOS</h1>

      {notes.map((note) => (
        <div key={note.slug}>
          <h2>{note.title}</h2>
          <p>{note.category}</p>
        </div>
      ))}
    </div>
  );
}

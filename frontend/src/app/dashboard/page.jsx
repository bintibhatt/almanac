import { getAllNotes, getCategories, getSystemState } from "@/lib/notes";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Knowledge Dashboard | Almanac",
  description: "Real-time metrics, autonomous ingestion pipeline telemetry, and active learning milestones.",
};

export default function DashboardPage() {
  const notes = getAllNotes();
  const categories = getCategories();
  const systemState = getSystemState();

  const totalReadingMinutes = notes.reduce((acc, note) => {
    const mins = parseInt(note.readingTime, 10) || 5;
    return acc + mins;
  }, 0);

  const avgReadingTime = notes.length > 0 ? Math.round(totalReadingMinutes / notes.length) : 0;

  const libraryStats = {
    totalNotes: notes.length,
    totalCategories: categories.length,
    avgReadingTime,
    categoryDistribution: categories.map((c) => ({
      category: c.slug,
      label: c.label,
      count: c.count,
    })),
  };

  const recentNotes = notes.slice(0, 6).map((n) => ({
    slug: n.slug,
    title: n.title,
    description: n.description,
    category: n.category,
    categoryLabel: n.categoryLabel,
    readingTime: n.readingTime,
    difficulty: n.difficulty,
    published: n.published,
  }));

  return (
    <DashboardClient
      libraryStats={libraryStats}
      systemState={systemState}
      recentNotes={recentNotes}
    />
  );
}

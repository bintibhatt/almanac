import CoursesClient from "./CoursesClient";

export const metadata = {
  title: "Engineering Courses & Personal Curricula | Almanac",
  description: "Generate independent, in-depth engineering courses tailored to your goals. Features internal mechanics, code patterns, practical exercises, and recall assessments.",
};

export default function CoursesPage() {
  return <CoursesClient />;
}

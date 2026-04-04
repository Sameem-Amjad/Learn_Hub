export function LessonContent({ content }: { content: string | null }) {
  return (
    <article className="prose prose-invert max-w-none">
      <p>{content ?? "Lesson content will appear here."}</p>
    </article>
  );
}

/**
 * Lesson text: blank lines split paragraphs, lines starting "## " are
 * headings and lines starting "- " are bullet points.
 */
export function LessonContent({ content }: { content: string | null }) {
  if (!content?.trim()) {
    return null;
  }

  const blocks = content.trim().split(/\n\s*\n/);

  return (
    <article className="max-w-3xl space-y-4 leading-relaxed text-foreground/90">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim());
        if (lines[0].startsWith("## ")) {
          return (
            <h2 key={i} className="pt-2 text-lg font-semibold text-foreground">
              {lines[0].slice(3)}
            </h2>
          );
        }
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
            </ul>
          );
        }
        return <p key={i}>{lines.join(" ")}</p>;
      })}
    </article>
  );
}

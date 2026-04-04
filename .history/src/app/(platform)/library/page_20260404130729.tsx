import Link from "next/link";

const items = [
  { id: "1", title: "Strategic Thinking Handbook", type: "pdf" },
  { id: "2", title: "Leadership Audio Series", type: "audio" }
];

export default function LibraryPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">Media Library</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border p-4">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.type}</p>
            <Link href={`/library/${item.id}`} className="mt-3 block text-primary underline">
              Open
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

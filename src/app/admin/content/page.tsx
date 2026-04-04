import { AccessControl } from "@/components/admin/AccessControl";

export default function AdminContentPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Content Controls</h1>
      <AccessControl />
    </div>
  );
}

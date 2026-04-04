import { Sidebar } from "@/components/layout/Sidebar";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

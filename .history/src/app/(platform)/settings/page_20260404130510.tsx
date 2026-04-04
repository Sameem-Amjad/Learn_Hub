import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Manage your profile and account preferences.</p>
      <Link href="/settings/billing" className="mt-4 block text-primary underline">
        Open billing settings
      </Link>
    </div>
  );
}

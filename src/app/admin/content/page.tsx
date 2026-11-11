import { redirect } from "next/navigation";

// Bulk plan changes now live on the users list; courses on their own tab.
export default function AdminContentPage() {
  redirect("/admin/users");
}

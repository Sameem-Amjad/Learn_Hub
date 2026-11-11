import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminAuditLog } from "@/components/admin/AdminAuditLog";

export const metadata = { title: "Admin · LearnHub" };

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <AdminAnalytics />
      <AdminAuditLog />
    </div>
  );
}

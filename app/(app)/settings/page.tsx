import { getUsers } from "@/lib/actions/users";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const users = await getUsers();
  return (
    <div className="space-y-6">
      <h2 className="font-serif text-3xl font-bold text-ink">Settings</h2>
      <SettingsClient users={users} />
    </div>
  );
}

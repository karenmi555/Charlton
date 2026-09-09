import { listActivity } from "@/lib/actions/activity";
import { HistoryList } from "@/components/history/HistoryList";

export default async function HistoryPage() {
  const entries = await listActivity(200);
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-3xl font-bold text-ink">History</h2>
      <p className="text-ink-soft text-sm">Every change, newest first.</p>
      <HistoryList entries={entries} />
    </div>
  );
}

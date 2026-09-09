import { redirect } from "next/navigation";
import { listEntriesInRange } from "@/lib/actions/entries";
import { getUsers } from "@/lib/actions/users";
import { buildMonthGrid, toDayId } from "@/lib/date/layout";
import { CalendarClient } from "@/components/calendar/CalendarClient";

type SearchParams = { y?: string; m?: string };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = sp.y ? Number(sp.y) : now.getFullYear();
  const month1Based = sp.m ? Number(sp.m) : now.getMonth() + 1;

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month1Based) ||
    month1Based < 1 ||
    month1Based > 12
  ) {
    redirect("/calendar");
  }

  const month = month1Based - 1;
  const grid = buildMonthGrid(year, month);
  const entries = await listEntriesInRange(toDayId(grid.gridStart), toDayId(grid.gridEnd));
  const users = await getUsers();

  return (
    <CalendarClient
      year={year}
      month={month}
      entries={entries}
      users={users}
      todayIso={toDayId(now)}
    />
  );
}

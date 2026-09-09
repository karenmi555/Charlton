"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MonthNav } from "./MonthNav";
import { MonthGrid } from "./MonthGrid";
import { Legend } from "./Legend";
import { EntryModal } from "@/components/entry/EntryModal";
import type { EntryPublic, UserPublic } from "@/lib/types";
import { buildMonthGrid, shiftMonth } from "@/lib/date/layout";

type Props = {
  year: number;
  month: number;
  entries: EntryPublic[];
  users: UserPublic[];
  todayIso: string;
};

export function CalendarClient({ year, month, entries, users, todayIso }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<
    | { mode: "closed" }
    | { mode: "create"; prefillDate: string }
    | { mode: "edit"; entryId: string }
  >({ mode: "closed" });

  const grid = buildMonthGrid(year, month);

  function goToMonth(delta: number) {
    const next = shiftMonth(year, month, delta);
    router.push(`/calendar?y=${next.year}&m=${next.month + 1}`);
  }

  function onDayClick(dateIso: string) {
    setModal({ mode: "create", prefillDate: dateIso });
  }

  function onEntryClick(entryId: string) {
    setModal({ mode: "edit", entryId });
  }

  function afterSave() {
    setModal({ mode: "closed" });
    router.refresh();
  }

  const editingEntry =
    modal.mode === "edit"
      ? entries.find((e) => e.id === modal.entryId) ?? null
      : null;

  return (
    <div className="space-y-6">
      <MonthNav year={year} month={month} onPrev={() => goToMonth(-1)} onNext={() => goToMonth(1)} />
      <MonthGrid
        grid={grid}
        entries={entries}
        users={users}
        todayIso={todayIso}
        onDayClick={onDayClick}
        onEntryClick={onEntryClick}
      />
      <Legend users={users} />

      {modal.mode === "create" && (
        <EntryModal
          mode="create"
          prefillDate={modal.prefillDate}
          users={users}
          onClose={() => setModal({ mode: "closed" })}
          onSaved={afterSave}
        />
      )}
      {modal.mode === "edit" && editingEntry && (
        <EntryModal
          mode="edit"
          entry={editingEntry}
          users={users}
          onClose={() => setModal({ mode: "closed" })}
          onSaved={afterSave}
        />
      )}
    </div>
  );
}

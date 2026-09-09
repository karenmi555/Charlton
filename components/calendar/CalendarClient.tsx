"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MonthGrid } from "./MonthGrid";
import { Legend } from "./Legend";
import { EntryModal } from "@/components/entry/EntryModal";
import type { EntryPublic, UserPublic } from "@/lib/types";
import {
  buildMonthGrid,
  shiftMonth,
  formatMonthYear,
  layoutEntries,
  maxLanePerWeek,
  WEEKS_IN_GRID,
} from "@/lib/date/layout";

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

  const primaryGrid = buildMonthGrid(year, month);
  const next = shiftMonth(year, month, 1);
  const secondaryGrid = buildMonthGrid(next.year, next.month);

  const primaryLabel = formatMonthYear(new Date(year, month, 1));
  const secondaryLabel = formatMonthYear(new Date(next.year, next.month, 1));

  // Compute per-week max lane count across BOTH grids so the two calendars
  // line up row-for-row on wide screens. Below the lg breakpoint only the
  // primary grid is visible; MonthGrid hides the "extra" padding lanes there.
  const primaryLanes = maxLanePerWeek(layoutEntries(entries, primaryGrid));
  const secondaryLanes = maxLanePerWeek(layoutEntries(entries, secondaryGrid));
  const sharedLaneCountByWeek = Array.from({ length: WEEKS_IN_GRID }, (_, i) =>
    Math.max((primaryLanes.get(i) ?? -1) + 1, (secondaryLanes.get(i) ?? -1) + 1)
  );

  function goToMonth(delta: number) {
    const target = shiftMonth(year, month, delta);
    router.push(`/calendar?y=${target.year}&m=${target.month + 1}`);
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
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => goToMonth(-1)}
          aria-label="Previous month"
          className="w-10 h-10 shrink-0 rounded-lg border border-beige-border bg-transparent hover:bg-beige-button text-ink text-lg flex items-center justify-center"
        >
          ←
        </button>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink text-center truncate">
            {primaryLabel}
          </h2>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink text-center truncate hidden lg:block">
            {secondaryLabel}
          </h2>
        </div>
        <button
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className="w-10 h-10 shrink-0 rounded-lg border border-beige-border bg-transparent hover:bg-beige-button text-ink text-lg flex items-center justify-center"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthGrid
          grid={primaryGrid}
          entries={entries}
          users={users}
          todayIso={todayIso}
          onDayClick={onDayClick}
          onEntryClick={onEntryClick}
          minLaneCountByWeek={sharedLaneCountByWeek}
        />
        <div className="hidden lg:block">
          <MonthGrid
            grid={secondaryGrid}
            entries={entries}
            users={users}
            todayIso={todayIso}
            onDayClick={onDayClick}
            onEntryClick={onEntryClick}
            minLaneCountByWeek={sharedLaneCountByWeek}
          />
        </div>
      </div>

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

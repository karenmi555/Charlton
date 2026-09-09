"use client";

import {
  layoutEntries,
  maxLanePerWeek,
  isInCurrentMonth,
  formatDayNumber,
  toDayId,
  type MonthGrid as GridType,
  type Segment,
} from "@/lib/date/layout";
import type { EntryPublic, UserPublic } from "@/lib/types";
import { EntryBar } from "./EntryBar";

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type Props = {
  grid: GridType;
  entries: EntryPublic[];
  users: UserPublic[];
  todayIso: string;
  onDayClick: (dateIso: string) => void;
  onEntryClick: (entryId: string) => void;
  // Optional per-week minimum lane count. When two calendars sit side-by-side
  // we pass max(primaryLanes, secondaryLanes) so their rows line up visually.
  // Only the extra padding beyond this grid's own lane count is hidden on
  // narrow screens, so single-month mobile view stays tight.
  minLaneCountByWeek?: number[];
};

export function MonthGrid({
  grid,
  entries,
  users,
  todayIso,
  onDayClick,
  onEntryClick,
  minLaneCountByWeek,
}: Props) {
  const segments = layoutEntries(entries, grid);
  const entriesById = new Map(entries.map((e) => [e.id, e]));
  const usersById = new Map(users.map((u) => [u.id, u]));
  const maxLanes = maxLanePerWeek(segments);

  const segmentsByWeek = new Map<number, Segment[]>();
  for (const s of segments) {
    const arr = segmentsByWeek.get(s.weekIndex) ?? [];
    arr.push(s);
    segmentsByWeek.set(s.weekIndex, arr);
  }

  return (
    <div className="rounded-2xl border border-beige-border bg-white/40 overflow-hidden">
      <div className="grid grid-cols-7 bg-beige-button/60 border-b border-beige-border">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-3 text-center text-xs font-medium tracking-widest text-ink-soft">
            {label}
          </div>
        ))}
      </div>

      <div>
        {grid.weeks.map((week, weekIndex) => {
          const ownLaneCount = (maxLanes.get(weekIndex) ?? -1) + 1;
          const targetLaneCount = Math.max(
            ownLaneCount,
            minLaneCountByWeek?.[weekIndex] ?? 0
          );
          const paddingLanes = targetLaneCount - ownLaneCount;
          const weekSegments = segmentsByWeek.get(weekIndex) ?? [];
          return (
            <div
              key={weekIndex}
              className="grid grid-cols-7 border-b border-beige-border last:border-b-0"
            >
              {week.map((day, colIndex) => {
                const dayIso = toDayId(day);
                const inMonth = isInCurrentMonth(day, grid);
                const isToday = dayIso === todayIso;
                return (
                  <button
                    key={colIndex}
                    onClick={() => onDayClick(dayIso)}
                    disabled={!inMonth}
                    className={[
                      "text-left border-r border-beige-border last:border-r-0",
                      "min-h-20 sm:min-h-24 p-1.5 sm:p-2 relative",
                      inMonth ? "hover:bg-beige-button/30 cursor-pointer" : "bg-beige-border/10 cursor-default",
                    ].join(" ")}
                    style={{ gridRow: 1, gridColumn: colIndex + 1 }}
                    aria-label={inMonth ? `Add a stay on ${dayIso}` : undefined}
                  >
                    <span
                      className={[
                        "inline-flex items-center justify-center h-7 min-w-7 px-1.5 text-sm rounded-full",
                        isToday ? "bg-maroon text-cream font-semibold" : "",
                        !inMonth ? "text-ink-soft/50" : "text-ink",
                      ].join(" ")}
                    >
                      {formatDayNumber(day)}
                    </span>
                  </button>
                );
              })}

              {weekSegments.map((seg) => {
                const entry = entriesById.get(seg.entryId);
                if (!entry) return null;
                const segUsers = entry.userIds
                  .map((id) => usersById.get(id))
                  .filter((u): u is UserPublic => !!u);
                return (
                  <EntryBar
                    key={`${seg.entryId}-${seg.weekIndex}`}
                    segment={seg}
                    entry={entry}
                    users={segUsers}
                    onClick={() => onEntryClick(seg.entryId)}
                  />
                );
              })}

              {/* Reserve height for this grid's own lane rows — visible at
                  every breakpoint. */}
              {Array.from({ length: ownLaneCount }).map((_, i) => (
                <div
                  key={`spacer-${i}`}
                  style={{ gridRow: 2 + i, gridColumn: "1 / span 7", height: "1.75rem" }}
                  aria-hidden
                />
              ))}
              {/* Extra spacers to match the sibling calendar's height at the
                  same weekIndex. Only shown on lg+ where both calendars are
                  visible; hidden below so single-month mobile stays compact. */}
              {paddingLanes > 0 &&
                Array.from({ length: paddingLanes }).map((_, i) => (
                  <div
                    key={`pad-${i}`}
                    className="hidden lg:block"
                    style={{
                      gridRow: 2 + ownLaneCount + i,
                      gridColumn: "1 / span 7",
                      height: "1.75rem",
                    }}
                    aria-hidden
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

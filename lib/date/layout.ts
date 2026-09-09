import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  isSameMonth,
  isSameDay,
} from "date-fns";

export const WEEKS_IN_GRID = 6;

export type MonthGrid = {
  year: number;
  month: number;
  weeks: Date[][];
  gridStart: Date;
  gridEnd: Date;
  monthStart: Date;
  monthEnd: Date;
};

export function buildMonthGrid(year: number, month: number): MonthGrid {
  const monthStart = new Date(year, month, 1);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = addDays(gridStart, WEEKS_IN_GRID * 7 - 1);

  const weeks: Date[][] = [];
  for (let w = 0; w < WEEKS_IN_GRID; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(gridStart, w * 7 + d));
    }
    weeks.push(week);
  }
  return { year, month, weeks, gridStart, gridEnd, monthStart, monthEnd };
}

export function toDayId(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function isInCurrentMonth(day: Date, grid: MonthGrid): boolean {
  return isSameMonth(day, grid.monthStart);
}

export function isToday(day: Date, now = new Date()): boolean {
  return isSameDay(day, now);
}

export type EntryForLayout = {
  id: string;
  startDate: string;
  endDate: string;
};

export type Segment = {
  entryId: string;
  weekIndex: number;
  startCol: number;
  span: number;
  isStart: boolean;
  isEnd: boolean;
  lane: number;
};

export function layoutEntries(
  entries: EntryForLayout[],
  grid: MonthGrid
): Segment[] {
  const rawSegments: Omit<Segment, "lane">[] = [];

  for (const entry of entries) {
    const start = parseISO(entry.startDate);
    const end = parseISO(entry.endDate);

    if (differenceInCalendarDays(start, grid.gridEnd) > 0) continue;
    if (differenceInCalendarDays(grid.gridStart, end) > 0) continue;

    const clippedStart = differenceInCalendarDays(start, grid.gridStart) < 0
      ? grid.gridStart
      : start;
    const clippedEnd = differenceInCalendarDays(end, grid.gridEnd) > 0
      ? grid.gridEnd
      : end;

    for (let w = 0; w < grid.weeks.length; w++) {
      const weekStart = grid.weeks[w][0];
      const weekEnd = grid.weeks[w][6];

      if (differenceInCalendarDays(clippedStart, weekEnd) > 0) continue;
      if (differenceInCalendarDays(weekStart, clippedEnd) > 0) continue;

      const segStart =
        differenceInCalendarDays(clippedStart, weekStart) > 0
          ? clippedStart
          : weekStart;
      const segEnd =
        differenceInCalendarDays(weekEnd, clippedEnd) > 0 ? clippedEnd : weekEnd;

      const startCol = differenceInCalendarDays(segStart, weekStart);
      const span = differenceInCalendarDays(segEnd, segStart) + 1;

      rawSegments.push({
        entryId: entry.id,
        weekIndex: w,
        startCol,
        span,
        isStart: isSameDay(segStart, start),
        isEnd: isSameDay(segEnd, end),
      });
    }
  }

  return assignLanes(rawSegments);
}

function assignLanes(segments: Omit<Segment, "lane">[]): Segment[] {
  const byWeek = new Map<number, Omit<Segment, "lane">[]>();
  for (const s of segments) {
    const arr = byWeek.get(s.weekIndex) ?? [];
    arr.push(s);
    byWeek.set(s.weekIndex, arr);
  }

  const laid: Segment[] = [];
  for (const [weekIndex, arr] of byWeek) {
    arr.sort((a, b) => a.startCol - b.startCol || b.span - a.span);
    const lanes: number[][] = [];
    for (const seg of arr) {
      let lane = 0;
      while (true) {
        const occupied = lanes[lane] ?? [];
        const overlaps = occupied.some(
          (col) => col >= seg.startCol && col < seg.startCol + seg.span
        );
        if (!overlaps) break;
        lane++;
      }
      const range: number[] = [];
      for (let c = seg.startCol; c < seg.startCol + seg.span; c++) range.push(c);
      lanes[lane] = [...(lanes[lane] ?? []), ...range];
      laid.push({ ...seg, weekIndex, lane });
    }
  }

  return laid;
}

export function maxLanePerWeek(segments: Segment[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const s of segments) {
    const cur = map.get(s.weekIndex) ?? 0;
    if (s.lane > cur) map.set(s.weekIndex, s.lane);
  }
  return map;
}

export function formatDayNumber(d: Date): string {
  return String(d.getDate());
}

export function formatMonthYear(d: Date): string {
  return format(d, "MMMM yyyy");
}

export function shiftMonth(year: number, month: number, delta: number): {
  year: number;
  month: number;
} {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

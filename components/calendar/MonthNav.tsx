"use client";

import { formatMonthYear } from "@/lib/date/layout";

type Props = {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
};

export function MonthNav({ year, month, onPrev, onNext }: Props) {
  const label = formatMonthYear(new Date(year, month, 1));
  return (
    <div className="flex items-center justify-between px-2">
      <button
        onClick={onPrev}
        aria-label="Previous month"
        className="w-10 h-10 rounded-lg border border-beige-border bg-transparent hover:bg-beige-button text-ink text-lg flex items-center justify-center"
      >
        ←
      </button>
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">{label}</h2>
      <button
        onClick={onNext}
        aria-label="Next month"
        className="w-10 h-10 rounded-lg border border-beige-border bg-transparent hover:bg-beige-button text-ink text-lg flex items-center justify-center"
      >
        →
      </button>
    </div>
  );
}

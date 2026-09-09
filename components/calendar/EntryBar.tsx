"use client";

import type { EntryPublic, UserPublic } from "@/lib/types";
import type { Segment } from "@/lib/date/layout";

type Props = {
  segment: Segment;
  entry: EntryPublic;
  users: UserPublic[];
  onClick: () => void;
};

export function EntryBar({ segment, entry, users, onClick }: Props) {
  const tentative = entry.status === "Tentative";
  const firstColor = users[0]?.color ?? "#4A90D9";
  const label =
    users.map((u) => u.name).join(", ") + (entry.hasGuests ? " +guest" : "");

  const roundLeft = segment.isStart ? "rounded-l-full" : "";
  const roundRight = segment.isEnd ? "rounded-r-full" : "";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={label + (entry.notes ? ` — ${entry.notes}` : "")}
      className={`relative mx-0.5 h-6 flex overflow-hidden text-xs font-semibold ${roundLeft} ${roundRight} ${
        tentative ? "" : "text-white"
      }`}
      style={{
        gridRow: 2 + segment.lane,
        gridColumn: `${segment.startCol + 1} / span ${segment.span}`,
        alignSelf: "start",
        border: tentative ? `2px dashed ${firstColor}` : "none",
        color: tentative ? firstColor : undefined,
      }}
    >
      {!tentative &&
        users.map((u) => (
          <span
            key={u.id}
            className="flex-1"
            style={{ backgroundColor: u.color }}
            aria-hidden
          />
        ))}
      <span
        className="absolute inset-0 flex items-center px-2.5 truncate"
        style={{
          textShadow: tentative ? "none" : "0 1px 1px rgba(0,0,0,0.15)",
        }}
      >
        {tentative ? `${label} (tentative)` : label}
      </span>
    </button>
  );
}

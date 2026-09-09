"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { ActivityLogPublic, FieldChange } from "@/lib/types";

const FIELD_LABELS: Record<string, string> = {
  startDate: "Start date",
  endDate: "End date",
  status: "Status",
  hasGuests: "Guests",
  notes: "Notes",
  userIds: "Names",
};

function displayValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ") || "(none)";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (v === null || v === undefined || v === "") return "(empty)";
  return String(v);
}

function isFieldChangeArray(v: unknown): v is FieldChange[] {
  return Array.isArray(v);
}

export function HistoryList({ entries }: { entries: ActivityLogPublic[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-beige-border p-8 text-center text-ink-soft">
        No activity yet.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => {
        const isOpen = expanded[e.id] ?? false;
        return (
          <li
            key={e.id}
            className="rounded-2xl border border-beige-border bg-white/40 overflow-hidden"
          >
            <button
              onClick={() => setExpanded((x) => ({ ...x, [e.id]: !isOpen }))}
              className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-beige-button/30"
            >
              <div>
                <p className="text-ink text-sm">{e.summary}</p>
                <p className="text-ink-soft text-xs mt-0.5">
                  {format(parseISO(e.createdAt), "PPP • p")}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  e.action === "Create"
                    ? "border-green-700/40 text-green-800 bg-green-50/50"
                    : e.action === "Delete"
                    ? "border-maroon/40 text-maroon bg-maroon/10"
                    : "border-ink-soft/40 text-ink-soft bg-white/40"
                }`}
              >
                {e.action}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-beige-border/60 pt-3 text-sm text-ink">
                {isFieldChangeArray(e.changes) ? (
                  <ul className="space-y-1.5">
                    {e.changes.map((c, i) => (
                      <li key={i} className="grid grid-cols-[8rem_1fr] gap-2">
                        <span className="text-ink-soft">
                          {FIELD_LABELS[c.field] ?? c.field}
                        </span>
                        <span>
                          <span className="line-through text-ink-soft mr-2">{displayValue(c.old)}</span>
                          <span className="font-medium">→ {displayValue(c.new)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-1.5">
                    {Object.entries(e.changes as Record<string, unknown>).map(([k, v]) => (
                      <li key={k} className="grid grid-cols-[8rem_1fr] gap-2">
                        <span className="text-ink-soft">{FIELD_LABELS[k] ?? k}</span>
                        <span>{displayValue(v)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

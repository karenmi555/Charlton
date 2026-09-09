import type { UserPublic } from "@/lib/types";

export function Legend({ users }: { users: UserPublic[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-ink">
      {users.map((u) => (
        <span key={u.id} className="inline-flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: u.color }}
            aria-hidden
          />
          {u.name}
        </span>
      ))}
      <span className="inline-flex items-center gap-2 text-ink-soft">
        <span
          className="w-3 h-3 rounded-full border-2 border-dashed border-ink-soft"
          aria-hidden
        />
        tentative
      </span>
    </div>
  );
}

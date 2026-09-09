"use client";

import { useState, useTransition } from "react";
import { useUserContext } from "@/lib/identity/context";
import { createEntry, updateEntry, deleteEntry, type EntryInput } from "@/lib/actions/entries";
import type { EntryPublic, EntryStatus, UserPublic } from "@/lib/types";

type Props = {
  users: UserPublic[];
  onClose: () => void;
  onSaved: () => void;
} & (
  | { mode: "create"; prefillDate: string; entry?: undefined }
  | { mode: "edit"; entry: EntryPublic; prefillDate?: undefined }
);

export function EntryModal(props: Props) {
  const { users, onClose, onSaved } = props;
  const { currentUser } = useUserContext();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initial: EntryInput =
    props.mode === "edit"
      ? {
          startDate: props.entry.startDate,
          endDate: props.entry.endDate,
          status: props.entry.status,
          hasGuests: props.entry.hasGuests,
          notes: props.entry.notes,
          userIds: props.entry.userIds,
        }
      : {
          startDate: props.prefillDate,
          endDate: props.prefillDate,
          status: "Confirmed",
          hasGuests: false,
          notes: "",
          userIds: currentUser ? [currentUser.id] : [],
        };

  const [form, setForm] = useState<EntryInput>(initial);

  const allFourAndGuests = form.userIds.length === 4 && form.hasGuests;

  function toggleUser(id: string) {
    setForm((f) => {
      const has = f.userIds.includes(id);
      if (has) return { ...f, userIds: f.userIds.filter((u) => u !== id) };
      return { ...f, userIds: [...f.userIds, id] };
    });
  }

  function onSave() {
    setError(null);
    if (!currentUser) {
      setError("No user is set. Please log in again.");
      return;
    }
    startTransition(async () => {
      try {
        if (props.mode === "create") {
          await createEntry(form, currentUser.id);
        } else {
          await updateEntry(props.entry.id, form, currentUser.id);
        }
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function onDelete() {
    if (props.mode !== "edit" || !currentUser) return;
    startTransition(async () => {
      try {
        await deleteEntry(props.entry.id, currentUser.id);
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-cream rounded-t-2xl sm:rounded-2xl border border-beige-border shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-ink">
              {props.mode === "create" ? "Add a stay" : "Edit stay"}
            </h2>
            <button onClick={onClose} className="text-ink-soft text-2xl leading-none px-2" aria-label="Close">
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-ink-soft">Start</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    startDate: v,
                    endDate: f.endDate < v ? v : f.endDate,
                  }));
                }}
                className="mt-1 w-full rounded-lg border border-beige-border bg-white/60 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink-soft">End</span>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-beige-border bg-white/60 px-3 py-2"
              />
            </label>
          </div>

          <div>
            <span className="text-xs font-medium text-ink-soft block mb-2">Who's staying?</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {users.map((u) => {
                const checked = form.userIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleUser(u.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      checked
                        ? "border-ink bg-white/70"
                        : "border-beige-border bg-transparent hover:bg-beige-button/40"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: u.color }}
                    />
                    <span className="text-ink">{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-ink-soft block mb-2">Status</span>
            <div className="flex gap-2">
              {(["Confirmed", "Tentative"] as EntryStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                    form.status === s
                      ? "border-ink bg-white/70"
                      : "border-beige-border bg-transparent hover:bg-beige-button/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hasGuests}
              onChange={(e) => setForm((f) => ({ ...f, hasGuests: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm text-ink">Bringing guest(s)?</span>
          </label>

          {allFourAndGuests && (
            <p className="text-sm text-maroon bg-maroon/10 rounded-lg px-3 py-2">
              Heads up: this is a 2-bedroom apartment — double-check everyone can fit.
            </p>
          )}

          <label className="block">
            <span className="text-xs font-medium text-ink-soft">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-beige-border bg-white/60 px-3 py-2 text-sm"
            />
          </label>

          {error && <p className="text-sm text-maroon">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {props.mode === "edit" && (
              <button
                type="button"
                onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
                disabled={pending}
                className={`rounded-lg px-4 py-2 text-sm font-medium border ${
                  confirmDelete
                    ? "border-maroon bg-maroon text-cream"
                    : "border-maroon/40 text-maroon hover:bg-maroon/10"
                }`}
              >
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-beige-border px-4 py-2 text-sm text-ink hover:bg-beige-button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={pending || form.userIds.length === 0}
              className="rounded-lg bg-ink px-4 py-2 text-sm text-cream font-medium hover:bg-ink/90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

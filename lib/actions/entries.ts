"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { format, parseISO } from "date-fns";
import type { EntryPublic, EntryStatus, FieldChange } from "@/lib/types";

export type EntryInput = {
  startDate: string;
  endDate: string;
  status: EntryStatus;
  hasGuests: boolean;
  notes: string;
  userIds: string[];
};

function toDbDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromDbDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShort(ymd: string): string {
  return format(parseISO(ymd), "MMM d");
}

function dateRangeLabel(startYmd: string, endYmd: string): string {
  if (startYmd === endYmd) return formatShort(startYmd);
  const start = parseISO(startYmd);
  const end = parseISO(endYmd);
  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, "MMM d, yyyy")}–${format(end, "MMM d, yyyy")}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${format(start, "MMM d")}–${format(end, "MMM d")}`;
  }
  return `${format(start, "MMM d")}–${format(end, "d")}`;
}

function validateInput(input: EntryInput): void {
  if (!input.userIds.length) throw new Error("Pick at least one name.");
  if (input.userIds.length > 4) throw new Error("At most four names.");
  if (input.startDate > input.endDate) {
    throw new Error("End date must be on or after start date.");
  }
  if (!["Confirmed", "Tentative"].includes(input.status)) {
    throw new Error("Invalid status.");
  }
}

async function nameLookup(): Promise<Record<string, string>> {
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  return Object.fromEntries(users.map((u) => [u.id, u.name]));
}

function summarize(
  action: "created" | "updated" | "deleted",
  actorName: string,
  userIds: string[],
  namesById: Record<string, string>,
  startDate: string,
  endDate: string
): string {
  const names = userIds
    .map((id) => namesById[id] ?? id)
    .join(", ");
  return `${actorName} ${action} a stay for ${names} (${dateRangeLabel(startDate, endDate)})`;
}

export async function listEntriesInRange(
  startYmd: string,
  endYmd: string
): Promise<EntryPublic[]> {
  const rows = await prisma.entry.findMany({
    where: {
      startDate: { lte: toDbDate(endYmd) },
      endDate: { gte: toDbDate(startYmd) },
    },
    include: { users: { orderBy: { order: "asc" } } },
    orderBy: [{ startDate: "asc" }, { id: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    startDate: fromDbDate(r.startDate),
    endDate: fromDbDate(r.endDate),
    status: r.status as EntryStatus,
    hasGuests: r.hasGuests,
    notes: r.notes,
    userIds: r.users.map((u) => u.userId),
    createdById: r.createdById,
    updatedById: r.updatedById,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getEntry(id: string): Promise<EntryPublic | null> {
  const r = await prisma.entry.findUnique({
    where: { id },
    include: { users: { orderBy: { order: "asc" } } },
  });
  if (!r) return null;
  return {
    id: r.id,
    startDate: fromDbDate(r.startDate),
    endDate: fromDbDate(r.endDate),
    status: r.status as EntryStatus,
    hasGuests: r.hasGuests,
    notes: r.notes,
    userIds: r.users.map((u) => u.userId),
    createdById: r.createdById,
    updatedById: r.updatedById,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createEntry(input: EntryInput, actorId: string): Promise<string> {
  validateInput(input);
  const names = await nameLookup();
  const actorName = names[actorId] ?? actorId;

  const created = await prisma.$transaction(async (tx) => {
    const entry = await tx.entry.create({
      data: {
        startDate: toDbDate(input.startDate),
        endDate: toDbDate(input.endDate),
        status: input.status,
        hasGuests: input.hasGuests,
        notes: input.notes,
        createdById: actorId,
        users: {
          create: input.userIds.map((userId, i) => ({ userId, order: i })),
        },
      },
    });
    await tx.activityLog.create({
      data: {
        actorId,
        action: "Create",
        entryId: entry.id,
        summary: summarize("created", actorName, input.userIds, names, input.startDate, input.endDate),
        changes: {
          snapshot: {
            startDate: input.startDate,
            endDate: input.endDate,
            status: input.status,
            hasGuests: input.hasGuests,
            notes: input.notes,
            userIds: input.userIds,
          },
        },
      },
    });
    return entry;
  });

  revalidatePath("/calendar");
  revalidatePath("/history");
  return created.id;
}

export async function updateEntry(
  id: string,
  input: EntryInput,
  actorId: string
): Promise<void> {
  validateInput(input);
  const before = await getEntry(id);
  if (!before) throw new Error("Stay not found.");
  const names = await nameLookup();
  const actorName = names[actorId] ?? actorId;

  const changes: FieldChange[] = [];
  const arraysEq = (a: string[], b: string[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  if (before.startDate !== input.startDate)
    changes.push({ field: "startDate", old: before.startDate, new: input.startDate });
  if (before.endDate !== input.endDate)
    changes.push({ field: "endDate", old: before.endDate, new: input.endDate });
  if (before.status !== input.status)
    changes.push({ field: "status", old: before.status, new: input.status });
  if (before.hasGuests !== input.hasGuests)
    changes.push({ field: "hasGuests", old: before.hasGuests, new: input.hasGuests });
  if (before.notes !== input.notes)
    changes.push({ field: "notes", old: before.notes, new: input.notes });
  if (!arraysEq(before.userIds, input.userIds))
    changes.push({
      field: "userIds",
      old: before.userIds,
      new: input.userIds,
    });

  if (changes.length === 0) return;

  await prisma.$transaction([
    prisma.entryUser.deleteMany({ where: { entryId: id } }),
    prisma.entry.update({
      where: { id },
      data: {
        startDate: toDbDate(input.startDate),
        endDate: toDbDate(input.endDate),
        status: input.status,
        hasGuests: input.hasGuests,
        notes: input.notes,
        updatedById: actorId,
        users: {
          create: input.userIds.map((userId, i) => ({ userId, order: i })),
        },
      },
    }),
    prisma.activityLog.create({
      data: {
        actorId,
        action: "Update",
        entryId: id,
        summary: summarize("updated", actorName, input.userIds, names, input.startDate, input.endDate),
        changes: { fields: changes } as Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath("/calendar");
  revalidatePath("/history");
}

export async function deleteEntry(id: string, actorId: string): Promise<void> {
  const before = await getEntry(id);
  if (!before) throw new Error("Stay not found.");
  const names = await nameLookup();
  const actorName = names[actorId] ?? actorId;

  await prisma.$transaction([
    prisma.entry.delete({ where: { id } }),
    prisma.activityLog.create({
      data: {
        actorId,
        action: "Delete",
        entryId: id,
        summary: summarize("deleted", actorName, before.userIds, names, before.startDate, before.endDate),
        changes: {
          snapshot: {
            startDate: before.startDate,
            endDate: before.endDate,
            status: before.status,
            hasGuests: before.hasGuests,
            notes: before.notes,
            userIds: before.userIds,
          },
        },
      },
    }),
  ]);

  revalidatePath("/calendar");
  revalidatePath("/history");
}

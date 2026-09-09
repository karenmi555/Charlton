"use server";

import { prisma } from "@/lib/db";
import type { ActivityLogPublic, FieldChange, LogAction } from "@/lib/types";

export async function listActivity(limit = 200): Promise<ActivityLogPublic[]> {
  const rows = await prisma.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
  });

  return rows.map((r) => {
    const changes = r.changes as { fields?: FieldChange[]; snapshot?: Record<string, unknown> } | null;
    return {
      id: r.id,
      actorId: r.actorId,
      actorName: r.actor.name,
      action: r.action as LogAction,
      entryId: r.entryId,
      summary: r.summary,
      changes: changes?.fields ?? changes?.snapshot ?? {},
      createdAt: r.createdAt.toISOString(),
    };
  });
}

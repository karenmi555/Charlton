"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { UserPublic } from "@/lib/types";

export async function getUsers(): Promise<UserPublic[]> {
  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
  return users.map((u) => ({ id: u.id, name: u.name, color: u.color }));
}

// Case-insensitive name lookup. Deliberately returns only { id } on
// success (no name/color) and { valid: false } on failure — so an
// unauthenticated caller cannot enumerate the whitelist by trial.
export async function resolveName(
  name: string
): Promise<{ valid: true; id: string } | { valid: false }> {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return { valid: false };
  const user = await prisma.user.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  return user ? { valid: true, id: user.id } : { valid: false };
}

export async function updateUserColor(userId: string, color: string): Promise<void> {
  const hex = color.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error("Color must be a 6-digit hex like #4A90D9");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { color: hex },
  });
  revalidatePath("/calendar");
  revalidatePath("/settings");
}

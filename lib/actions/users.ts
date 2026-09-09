"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { UserPublic } from "@/lib/types";

export async function getUsers(): Promise<UserPublic[]> {
  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
  return users.map((u) => ({ id: u.id, name: u.name, color: u.color }));
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

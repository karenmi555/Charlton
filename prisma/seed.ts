import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  { id: "karen",   name: "Karen",   color: "#4A90D9" },
  { id: "cathy",   name: "Cathy",   color: "#1A7A6E" },
  { id: "jeff",    name: "Jeff",    color: "#1A2A5E" },
  { id: "charlie", name: "Charlie", color: "#4ADE80" },
];

async function main() {
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { name: u.name },
      create: u,
    });
  }
  console.log(`Seeded ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

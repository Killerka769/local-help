import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const CITIES = [
  { name: "Махачкала", region: "Дагестан" },
  { name: "Каспийск", region: "Дагестан" },
  { name: "Хасавюрт", region: "Дагестан" },
  { name: "Дербент", region: "Дагестан" },
  { name: "Буйнакск", region: "Дагестан" },
  { name: "Избербаш", region: "Дагестан" },
  { name: "Кизляр", region: "Дагестан" },
  { name: "Кизилюрт", region: "Дагестан" },
  { name: "Дагестанские Огни", region: "Дагестан" },
];

async function main() {
  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: { region: city.region },
      create: city,
    });
  }
  console.log(`Города готовы: ${CITIES.map((c) => c.name).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

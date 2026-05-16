import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const g = globalThis;

function createClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

const prisma = new Proxy(Object.create(null), {
  get(_t, prop) {
    if (!g._prisma) g._prisma = createClient();
    const val = g._prisma[prop];
    return typeof val === "function" ? val.bind(g._prisma) : val;
  },
});

export default prisma;

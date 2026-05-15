import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const g = globalThis;

function createClient() {
  const sql = neon(process.env.DATABASE_URL);
  const adapter = new PrismaNeon(sql);
  return new PrismaClient({ adapter });
}

// Lazy proxy — neon() is only called on first property access, not at module load
const prisma = new Proxy(Object.create(null), {
  get(_t, prop) {
    if (!g._prisma) g._prisma = createClient();
    const val = g._prisma[prop];
    return typeof val === "function" ? val.bind(g._prisma) : val;
  },
});

export default prisma;

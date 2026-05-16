import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const g = globalThis;

function createClient(url) {
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

// Re-read URL on every property access so the env var is always read at
// request time, not module init. Recreate client if the URL changes.
const prisma = new Proxy(Object.create(null), {
  get(_t, prop) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL is not set");
    if (!g._prisma || g._prismaUrl !== url) {
      g._prismaUrl = url;
      g._prisma = createClient(url);
    }
    const val = g._prisma[prop];
    return typeof val === "function" ? val.bind(g._prisma) : val;
  },
});

export default prisma;

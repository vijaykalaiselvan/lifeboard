import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const g = globalThis;

function createClient(url) {
  // PrismaNeonHttp takes the connection string directly and calls neon() internally
  const adapter = new PrismaNeonHttp(url);
  return new PrismaClient({ adapter });
}

// Re-read URL on every property access so the env var is read at request time,
// not at module initialization. Recreate client if the URL changes.
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

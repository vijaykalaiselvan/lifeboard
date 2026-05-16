import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const g = globalThis;

function createClient(url) {
  const sql = neon(url);
  const adapter = new PrismaNeonHttp(sql);
  return new PrismaClient({ adapter });
}

// Re-read URL on every access so env vars are never captured at module init time.
// Recreate client if URL changes (e.g. first call was during warm-up without env vars).
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

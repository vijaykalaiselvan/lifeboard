import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, getProfileId, unauthorized, forbidden } from "@/lib/auth";

export async function POST(request, { params }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();
  const profileId = await getProfileId(request, userId);
  if (!profileId) return forbidden();

  const { id } = await params;
  const accountId = Number(id);

  const account = await prisma.bankAccount.findFirst({ where: { id: accountId, profileId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const { transactions } = await request.json();
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: 0 });
  }

  const data = transactions.map((t) => ({
    profileId,
    accountId,
    date: new Date(t.date),
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category ?? null,
    note: t.note ?? null,
    reference: t.reference ?? null,
    balance: t.balance ?? null,
    importHash: t.importHash,
  }));

  const result = await prisma.transaction.createMany({ data, skipDuplicates: true });

  await prisma.bankAccount.update({
    where: { id: accountId },
    data: { lastImportedAt: new Date() },
  });

  const skipped = transactions.length - result.count;
  return NextResponse.json({ inserted: result.count, skipped });
}

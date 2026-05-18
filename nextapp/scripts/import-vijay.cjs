/**
 * One-time import script: seeds Vijay's financial data from his Google Sheet.
 *
 * Run from the nextapp/ directory:
 *   node scripts/import-vijay.cjs
 *
 * Requires DATABASE_URL to be set in the environment.
 */

"use strict";

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const EMAIL = "vijay.kalaiselvan@gmail.com";

const INCOME = [
  {
    source: "Salary (net take-home)",
    amount: 291830,
    currency: "INR",
    frequency: "monthly",
    receivedAt: new Date("2026-04-07"),
    note: "Net take-home after PF & TDS. Credited on 7th every month.",
  },
];

const DEBTS = [
  {
    name: "Housing Loan 4",
    type: "mortgage",
    principal: 609680,
    interestRate: 11.3,
    minimumPayment: 28815,
    currency: "INR",
    notes: "Highest rate — PAY FIRST. Extra ₹17,000/mo accelerated. Balance as of Mar 30 2026.",
  },
  {
    name: "Car Loan",
    type: "loan",
    principal: 1192143,
    interestRate: 8.3,
    minimumPayment: 25000,
    currency: "INR",
    notes: "EMI auto-debit via Bank of Baroda on 10th. Balance as of Mar 30 2026.",
  },
  {
    name: "Housing Loan 3",
    type: "mortgage",
    principal: 853559,
    interestRate: 8.1,
    minimumPayment: 20000,
    currency: "INR",
    notes: "Balance as of Mar 30 2026.",
  },
  {
    name: "Housing Loan 1",
    type: "mortgage",
    principal: 4710802,
    interestRate: 8.05,
    minimumPayment: 70000,
    currency: "INR",
    notes: "Main home loan. Maintain regular EMI. Balance as of Mar 30 2026.",
  },
  {
    name: "Housing Loan 2",
    type: "mortgage",
    principal: 76505,
    interestRate: 7.9,
    minimumPayment: 800,
    currency: "INR",
    notes: "Small balance — closes ~Jan 2027. Balance as of Mar 30 2026.",
  },
];

const EXPENSES = [
  { category: "Housing",   description: "House expenses",                        amount: 50000, note: "Monthly household running costs" },
  { category: "Transport", description: "Self expenses (fuel / bills / mobile)", amount: 20000, note: "Fuel, utility bills, mobile recharge" },
  { category: "Housing",   description: "House rent",                            amount: 8000,  note: "Monthly rent" },
  { category: "Other",     description: "Post office savings (sister marriage)", amount: 10000, note: "Stops Sep 2026 after sister's marriage" },
  { category: "Other",     description: "Post office investment",                amount: 10000, note: "Recurring post office investment" },
  { category: "Other",     description: "Gold chit",                             amount: 5000,  note: "Monthly gold chit contribution" },
  { category: "Health",    description: "Medical insurance",                     amount: 2013,  note: "Monthly premium" },
  { category: "Other",     description: "Axis FD recurring",                     amount: 2000,  note: "Lock-in — NOT emergency fund" },
  { category: "Other",     description: "Emergency fund (liquid MF)",            amount: 3000,  note: "Building ₹3L Phase 1 target via Axis Bank" },
  { category: "Education", description: "Kid's school fees",                     amount: 7500,  note: "₹90,000/yr ÷ 12 (LKG from Jun 2026)" },
  { category: "Housing",   description: "Property tax (monthly provision)",      amount: 1167,  note: "₹14,000/yr ÷ 12" },
  { category: "Transport", description: "Car insurance (monthly provision)",     amount: 1833,  note: "₹22,000/yr ÷ 12" },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
      include: { profiles: { orderBy: { createdAt: "asc" }, take: 1 } },
    });

    if (!user) {
      console.error(`ERROR: No user found with email "${EMAIL}". Register first.`);
      process.exit(1);
    }

    const profile = user.profiles[0];
    if (!profile) {
      console.error("ERROR: User has no profiles.");
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (id=${user.id})`);
    console.log(`Using profile: "${profile.name}" (id=${profile.id})`);

    // 2. Idempotency guard
    const [existingIncome, existingDebts, existingExpenses] = await Promise.all([
      prisma.income.count({ where: { profileId: profile.id } }),
      prisma.debt.count({ where: { profileId: profile.id } }),
      prisma.expense.count({ where: { profileId: profile.id } }),
    ]);

    if (existingIncome > 0 || existingDebts > 0 || existingExpenses > 0) {
      console.log("\nData already exists for this profile:");
      console.log(`  Income records:  ${existingIncome}`);
      console.log(`  Debt records:    ${existingDebts}`);
      console.log(`  Expense records: ${existingExpenses}`);
      console.log("\nSkipping to avoid duplicates. Delete existing records first to re-import.");
      return;
    }

    // 3. Insert
    const spentAt = new Date("2026-04-01");

    console.log("\nInserting data...");

    await prisma.income.createMany({
      data: INCOME.map((r) => ({ ...r, profileId: profile.id })),
    });
    console.log(`  ✓ ${INCOME.length} income record(s)`);

    await prisma.debt.createMany({
      data: DEBTS.map((r) => ({ ...r, profileId: profile.id })),
    });
    console.log(`  ✓ ${DEBTS.length} debt record(s)`);

    await prisma.expense.createMany({
      data: EXPENSES.map((r) => ({ ...r, profileId: profile.id, currency: "INR", spentAt })),
    });
    console.log(`  ✓ ${EXPENSES.length} expense record(s)`);

    const totalDebt = DEBTS.reduce((s, d) => s + d.principal, 0);
    const totalExpenses = EXPENSES.reduce((s, e) => s + e.amount, 0);
    console.log("\n── Summary ──────────────────────────────");
    console.log(`  Income:           ₹${INCOME[0].amount.toLocaleString("en-IN")}/month`);
    console.log(`  Total debt:       ₹${totalDebt.toLocaleString("en-IN")}`);
    console.log(`  Monthly expenses: ₹${totalExpenses.toLocaleString("en-IN")}`);
    console.log("  Import complete ✓");

  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

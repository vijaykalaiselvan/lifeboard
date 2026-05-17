# Lifeboard

A personal life management dashboard built with Next.js. Track finances, habits, goals, tasks, and notes all in one place.

## Features

### Finance
- **Overview** — combined income, expenses, cash flow, net worth, and savings rate for the current month
- **Income** — manual income sources + bank credits (filterable by month)
- **Expenses** — manual expenses + bank debits with category breakdown and progress bars
- **Investments** — portfolio tracking with current value, cost basis, and gain/loss
- **Debts** — loan tracking with principal, interest rate, and minimum payment
- **Lent Money** — track money lent to friends; record partial repayments over time, see outstanding balance per person, auto-settle when fully repaid
- **Accounts** — bank account management with CSV statement import and duplicate detection
- **Transactions** — searchable, filterable transaction log across all accounts with category tagging

### Productivity
- **Tasks** — todo list with priority, due date, and status tracking
- **Goals** — goal setting with milestone breakdown and progress percentage
- **Habits** — daily/weekly habit tracker with streak logging
- **Notes** — rich text notes with tags and pin support
- **Planning** — free-form planning page

### Dashboard
Single-page summary of the current month: income vs expenses, net worth, active habits, open tasks, and recent transactions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| UI | React 19.2.4, Tailwind CSS v4 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7.8.0 with `@prisma/adapter-pg` |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| HTTP client | axios |

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (or any PostgreSQL database)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/vijaykalaiselvan/lifeboard.git
cd lifeboard/nextapp
npm install
```

### 2. Environment variables

Create `nextapp/.env.local`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

For Supabase, use the **Session mode** connection string from Project Settings → Database → Connection string.

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Apply database schema

If starting fresh, apply the schema to your database:

```bash
npx prisma db push
```

Or run the migrations manually via the Supabase SQL editor using the models defined in `prisma/schema.prisma`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
nextapp/
├── app/
│   ├── api/
│   │   ├── auth/          # login, register, me
│   │   ├── dashboard/     # combined dashboard summary
│   │   └── finance/
│   │       ├── accounts/  # bank account CRUD + CSV import
│   │       ├── debts/
│   │       ├── expenses/
│   │       ├── income/
│   │       ├── investments/
│   │       ├── lent/      # lent money + repayments
│   │       └── transactions/
│   ├── dashboard/
│   ├── finance/
│   ├── goals/
│   ├── habits/
│   ├── notes/
│   ├── planning/
│   └── tasks/
├── components/
│   ├── finance/           # tab components (OverviewTab, IncomeTab, …)
│   ├── AuthContext.jsx
│   ├── Layout.jsx
│   └── ProtectedLayout.jsx
├── lib/
│   ├── api.js             # axios instance with auth headers
│   ├── auth.js            # JWT helpers
│   ├── csvParsers.js      # bank statement CSV parser
│   └── prisma.js          # Prisma client singleton
└── prisma/
    └── schema.prisma
```

## Bank Statement Import

Navigate to Finance → Accounts → select an account → Import CSV.

The parser handles the Indian bank statement format (`Date, Details, Ref No, Debit, Credit, Balance`) including multi-line quoted description fields. Duplicate transactions are automatically skipped using a SHA-256 content hash.

## Authentication

All API routes require a `Bearer <token>` header. The token is issued on login and stored in `localStorage` by the client. Each request also sends an `x-profile-id` header to scope data to the correct profile.

## Production Build

```bash
npm run build
npm start
```

The build script runs `prisma generate` automatically before compiling.

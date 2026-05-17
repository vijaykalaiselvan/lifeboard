/**
 * Client-side CSV parser for Indian bank statements.
 * Detects HDFC / SBI / Axis / Bank of Baroda formats by column headers.
 * Returns an array of normalized transaction objects ready to POST to the API.
 */

const AUTO_CATEGORIES = [
  { re: /SWIGGY|ZOMATO|BIGBASKET|BLINKIT|GROFERS|DUNZO|RESTAURANT|CAFE|HOTEL.*FOOD/i,  cat: "Food" },
  { re: /PETROL|BPCL|HPCL|IOC|INDIAN OIL|NAYARA|SHELL|FUEL/i,                          cat: "Transport" },
  { re: /UBER|OLA|RAPIDO|METRO|IRCTC|RAILWAY|BUS|TOLL/i,                               cat: "Transport" },
  { re: /AMAZON|FLIPKART|MYNTRA|MEESHO|NYKAA|AJIO|SNAPDEAL/i,                          cat: "Shopping" },
  { re: /ELECTRICITY|BESCOM|MSEDCL|TNEB|TSSPDCL|WBSEDCL|WATER BOARD|GAS BILL/i,       cat: "Utilities" },
  { re: /AIRTEL|JIO|VODAFONE|BSNL|VI MOBILE|TATA SKY|DISH TV/i,                        cat: "Utilities" },
  { re: /NETFLIX|SPOTIFY|HOTSTAR|PRIME VIDEO|ZEE5|SONY LIV|YOUTUBE PREMIUM/i,          cat: "Entertainment" },
  { re: /PHARMACY|MEDICAL|HOSPITAL|APOLLO|FORTIS|MAX|CIPLA|MEDPLUS|NETMEDS/i,          cat: "Health" },
  { re: /INSURANCE|LIC|HDFC LIFE|ICICI PRU|SBI LIFE|STAR HEALTH/i,                     cat: "Health" },
  { re: /SCHOOL|COLLEGE|FEES|BYJU|UNACADEMY|VEDANTU|EDUCATION/i,                       cat: "Education" },
  { re: /SALARY|STIPEND/i,                                                              cat: "Income" },
  { re: /EMI|LOAN|MORTGAGE/i,                                                           cat: "Debt" },
  { re: /ATM |ATM-|CASH WITHDRAWAL|ATM WITHDRAWAL/i,                                   cat: "Other" },
];

function autoCategory(description) {
  for (const { re, cat } of AUTO_CATEGORIES) {
    if (re.test(description)) return cat;
  }
  return "Other";
}

// ── SHA-256 via Web Crypto (browser + Node 18+) ──────────────────────────────

async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── CSV splitter ─────────────────────────────────────────────────────────────
// Handles quoted fields containing commas or newlines.

function splitCSVRow(row) {
  const fields = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      fields.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return lines.map(splitCSVRow);
}

// ── Amount parsing ───────────────────────────────────────────────────────────

function parseAmount(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[₹,\s]/g, "");
  return parseFloat(cleaned) || 0;
}

// ── Date parsing ─────────────────────────────────────────────────────────────
// Handles DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, YYYY-MM-DD

function parseDate(str) {
  if (!str) return null;
  str = str.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str);
  // DD/MM/YYYY or DD-MM-YYYY
  const m = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  return new Date(`${y}-${mo}-${d}`);
}

// ── Bank format detectors ────────────────────────────────────────────────────

function detectFormat(headers) {
  const h = headers.map((x) => x.toUpperCase().trim());
  const has = (...keys) => keys.every((k) => h.some((x) => x.includes(k)));

  if (has("NARRATION", "DEBIT AMOUNT", "CREDIT AMOUNT")) return "HDFC_SAVINGS";
  if (has("DESCRIPTION", "AMOUNT") && h.some((x) => x.includes("DR") || x.includes("CR"))) return "HDFC_CC";
  if (has("TXN DATE") || (has("DEBIT", "CREDIT") && h.some((x) => x === "DESCRIPTION"))) return "SBI";
  if (has("PARTICULARS", "DR", "CR") || has("TRAN DATE")) return "AXIS";
  if (has("DEBIT", "CREDIT") && h.some((x) => x.includes("DESCRIPTION") || x.includes("NARRATION"))) return "BOB";
  return "GENERIC";
}

// ── Format-specific parsers ──────────────────────────────────────────────────

function parseHDFCSavings(rows) {
  // Columns: Date, Narration, Value Dt, Debit Amount, Credit Amount, Chq./Ref.No., Closing Balance
  const headerIdx = rows.findIndex((r) => r.some((c) => /narration/i.test(c)));
  if (headerIdx === -1) return [];
  const headers = rows[headerIdx].map((h) => h.toUpperCase().trim());
  const iDate   = headers.findIndex((h) => h === "DATE");
  const iDesc   = headers.findIndex((h) => h.includes("NARRATION"));
  const iDebit  = headers.findIndex((h) => h.includes("DEBIT"));
  const iCredit = headers.findIndex((h) => h.includes("CREDIT"));
  const iRef    = headers.findIndex((h) => h.includes("CHQ") || h.includes("REF"));
  const iBalance= headers.findIndex((h) => h.includes("CLOSING") || h.includes("BALANCE"));

  return rows.slice(headerIdx + 1).map((r) => {
    const date = parseDate(r[iDate]);
    const debit  = parseAmount(r[iDebit]);
    const credit = parseAmount(r[iCredit]);
    if (!date || (debit === 0 && credit === 0)) return null;
    return { date, description: (r[iDesc] || "").trim(), amount: debit || credit, type: debit > 0 ? "debit" : "credit", reference: r[iRef]?.trim(), balance: parseAmount(r[iBalance]) || undefined };
  }).filter(Boolean);
}

function parseHDFCCC(rows) {
  // Columns: Date, Description, Amount (e.g. "500.00 Dr" or "200.00 Cr")
  const headerIdx = rows.findIndex((r) => r.some((c) => /description/i.test(c)));
  if (headerIdx === -1) return [];
  const headers = rows[headerIdx].map((h) => h.toUpperCase().trim());
  const iDate = headers.findIndex((h) => h === "DATE");
  const iDesc = headers.findIndex((h) => h.includes("DESCRIPTION"));
  const iAmt  = headers.findIndex((h) => h.includes("AMOUNT"));

  return rows.slice(headerIdx + 1).map((r) => {
    const date = parseDate(r[iDate]);
    const rawAmt = (r[iAmt] || "").trim();
    const isCredit = /cr/i.test(rawAmt);
    const amount = parseAmount(rawAmt.replace(/dr|cr/i, ""));
    if (!date || amount === 0) return null;
    return { date, description: (r[iDesc] || "").trim(), amount, type: isCredit ? "credit" : "debit", reference: undefined, balance: undefined };
  }).filter(Boolean);
}

function parseSBI(rows) {
  // Columns: Txn Date, Value Date, Description, Ref No./Cheque No., Debit, Credit, Balance
  const headerIdx = rows.findIndex((r) => r.some((c) => /txn date|transaction date/i.test(c)));
  if (headerIdx === -1) return [];
  const headers = rows[headerIdx].map((h) => h.toUpperCase().trim());
  const iDate   = headers.findIndex((h) => h.includes("TXN DATE") || h === "DATE");
  const iDesc   = headers.findIndex((h) => h.includes("DESCRIPTION") || h.includes("NARRATION") || h.includes("PARTICULARS"));
  const iRef    = headers.findIndex((h) => h.includes("REF") || h.includes("CHQ"));
  const iDebit  = headers.findIndex((h) => h === "DEBIT");
  const iCredit = headers.findIndex((h) => h === "CREDIT");
  const iBalance= headers.findIndex((h) => h.includes("BALANCE"));

  return rows.slice(headerIdx + 1).map((r) => {
    const date   = parseDate(r[iDate]);
    const debit  = parseAmount(r[iDebit]);
    const credit = parseAmount(r[iCredit]);
    if (!date || (debit === 0 && credit === 0)) return null;
    return { date, description: (r[iDesc] || "").trim(), amount: debit || credit, type: debit > 0 ? "debit" : "credit", reference: r[iRef]?.trim(), balance: parseAmount(r[iBalance]) || undefined };
  }).filter(Boolean);
}

function parseAxis(rows) {
  // Columns: Tran Date, CHQNO, PARTICULARS, DR, CR, BAL
  const headerIdx = rows.findIndex((r) => r.some((c) => /tran date|particulars/i.test(c)));
  if (headerIdx === -1) return [];
  const headers = rows[headerIdx].map((h) => h.toUpperCase().trim());
  const iDate  = headers.findIndex((h) => h.includes("DATE"));
  const iDesc  = headers.findIndex((h) => h.includes("PARTICULARS") || h.includes("DESCRIPTION") || h.includes("NARRATION"));
  const iRef   = headers.findIndex((h) => h.includes("CHQ") || h.includes("REF"));
  const iDR    = headers.findIndex((h) => h === "DR" || h === "DEBIT");
  const iCR    = headers.findIndex((h) => h === "CR" || h === "CREDIT");
  const iBal   = headers.findIndex((h) => h === "BAL" || h.includes("BALANCE"));

  return rows.slice(headerIdx + 1).map((r) => {
    const date   = parseDate(r[iDate]);
    const dr     = parseAmount(r[iDR]);
    const cr     = parseAmount(r[iCR]);
    if (!date || (dr === 0 && cr === 0)) return null;
    return { date, description: (r[iDesc] || "").trim(), amount: dr || cr, type: dr > 0 ? "debit" : "credit", reference: r[iRef]?.trim(), balance: parseAmount(r[iBal]) || undefined };
  }).filter(Boolean);
}

function parseBOB(rows) {
  // Bank of Baroda: Date, Description, Debit, Credit, Balance (similar to SBI)
  const headerIdx = rows.findIndex((r) => r.some((c) => /debit/i.test(c) && r.some((c2) => /credit/i.test(c2))));
  if (headerIdx === -1) return [];
  const headers = rows[headerIdx].map((h) => h.toUpperCase().trim());
  const iDate   = headers.findIndex((h) => h === "DATE" || h.includes("TXN"));
  const iDesc   = headers.findIndex((h) => h.includes("DESCRIPTION") || h.includes("NARRATION") || h.includes("PARTICULARS"));
  const iDebit  = headers.findIndex((h) => h.includes("DEBIT") || h === "DR");
  const iCredit = headers.findIndex((h) => h.includes("CREDIT") || h === "CR");
  const iBalance= headers.findIndex((h) => h.includes("BALANCE") || h === "BAL");

  return rows.slice(headerIdx + 1).map((r) => {
    const date   = parseDate(r[iDate]);
    const debit  = parseAmount(r[iDebit]);
    const credit = parseAmount(r[iCredit]);
    if (!date || (debit === 0 && credit === 0)) return null;
    return { date, description: (r[iDesc] || "").trim(), amount: debit || credit, type: debit > 0 ? "debit" : "credit", reference: undefined, balance: parseAmount(r[iBalance]) || undefined };
  }).filter(Boolean);
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Parse a CSV string into normalized transactions.
 * Returns { format, transactions } where format is the detected bank format.
 * Each transaction is: { date, description, amount, type, category, reference, balance, importHash }
 */
export async function parseTransactions(csvText, accountId) {
  const rows = parseCSV(csvText).filter((r) => r.some((c) => c.length > 0));
  if (rows.length < 2) return { format: "EMPTY", transactions: [] };

  // Find the header row — first row with >= 3 non-empty cells that looks like headers
  const headerRow = rows.find((r) => r.filter((c) => c.length > 0).length >= 3 && !/^\d{2}[\/\-]/.test(r[0]));
  const format = headerRow ? detectFormat(headerRow) : "GENERIC";

  let rawTxns = [];
  switch (format) {
    case "HDFC_SAVINGS": rawTxns = parseHDFCSavings(rows); break;
    case "HDFC_CC":      rawTxns = parseHDFCCC(rows);     break;
    case "SBI":          rawTxns = parseSBI(rows);         break;
    case "AXIS":         rawTxns = parseAxis(rows);        break;
    case "BOB":          rawTxns = parseBOB(rows);         break;
    default:             rawTxns = parseSBI(rows);         break; // best-effort generic
  }

  // Compute importHash and add auto-category
  const transactions = await Promise.all(
    rawTxns.map(async (t) => {
      const dateISO = t.date instanceof Date ? t.date.toISOString().slice(0, 10) : String(t.date);
      const hashInput = `${accountId}|${dateISO}|${t.amount.toFixed(2)}|${t.description}`;
      const importHash = await sha256(hashInput);
      return {
        ...t,
        date: t.date instanceof Date ? t.date.toISOString() : t.date,
        category: autoCategory(t.description),
        importHash,
      };
    })
  );

  return { format, transactions };
}

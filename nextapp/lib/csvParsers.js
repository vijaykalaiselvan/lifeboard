/**
 * Client-side CSV parser for Indian bank statements.
 * Supports HDFC Savings, HDFC Credit Card, SBI, Axis Bank, Bank of Baroda,
 * and any generic Date/Description/Debit/Credit/Balance format.
 */

// ── Auto-categorization ──────────────────────────────────────────────────────

const AUTO_CATEGORIES = [
  { re: /SWIGGY|ZOMATO|BIGBASKET|BLINKIT|GROFERS|DUNZO|RESTAURANT|CAFE/i,             cat: "Food" },
  { re: /PETROL|BPCL|HPCL|IOC|INDIAN OIL|NAYARA|SHELL|FUEL/i,                        cat: "Transport" },
  { re: /UBER|OLA|RAPIDO|METRO|IRCTC|RAILWAY|BUS|NHAI|TOLL/i,                        cat: "Transport" },
  { re: /AMAZON|FLIPKART|MYNTRA|MEESHO|NYKAA|AJIO|SNAPDEAL/i,                        cat: "Shopping" },
  { re: /ELECTRICITY|BESCOM|MSEDCL|TNEB|TSSPDCL|WATER BOARD|GAS BILL/i,              cat: "Utilities" },
  { re: /AIRTEL|JIO|VODAFONE|BSNL|VI MOBILE|TATA SKY|DISH TV/i,                      cat: "Utilities" },
  { re: /NETFLIX|SPOTIFY|HOTSTAR|PRIME VIDEO|ZEE5|SONY LIV|YOUTUBE PREMIUM/i,        cat: "Entertainment" },
  { re: /PHARMACY|MEDICAL|HOSPITAL|APOLLO|FORTIS|MAX|CIPLA|MEDPLUS|NETMEDS/i,        cat: "Health" },
  { re: /INSURANCE|LIC|HDFC LIFE|ICICI PRU|SBI LIFE|STAR HEALTH/i,                   cat: "Health" },
  { re: /SCHOOL|COLLEGE|FEES|BYJU|UNACADEMY|VEDANTU|EDUCATION/i,                     cat: "Education" },
  { re: /HOUSE RENT|HOME RENT|HOUSE.*RENT|RENT.*HOUSE|KBLR.*RENT|M\/RENT/i,          cat: "Housing" },
  { re: /SALARY|STIPEND/i,                                                            cat: "Income" },
  { re: /DIRECT DR|AUTO DEBIT|NACH |EMI|LOAN|MORTGAGE/i,                             cat: "Debt" },
  { re: /ATM WDL|ATM CASH|ATM-|CASH WITHDRAWAL/i,                                    cat: "Other" },
];

function autoCategory(description) {
  for (const { re, cat } of AUTO_CATEGORIES) {
    if (re.test(description)) return cat;
  }
  return "Other";
}

// ── SHA-256 via Web Crypto ───────────────────────────────────────────────────

async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Proper CSV parser (handles multi-line quoted fields) ─────────────────────
// Parses character-by-character so a newline inside "..." collapses to a space
// rather than breaking the row.

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuote = false;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const ch = text[i];
    const next = i + 1 < len ? text[i + 1] : "";

    if (inQuote) {
      if (ch === '"' && next === '"') {
        field += '"'; i++;                          // escaped quote ""
      } else if (ch === '"') {
        inQuote = false;                            // closing quote
      } else if (ch === '\r' || ch === '\n') {
        field += ' ';                               // newline inside quote → space
        if (ch === '\r' && next === '\n') i++;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ',') {
        row.push(field.trim()); field = '';
      } else if (ch === '\r' || ch === '\n') {
        if (ch === '\r' && next === '\n') i++;
        row.push(field.trim()); field = '';
        if (row.some((c) => c.length > 0)) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }

  row.push(field.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

// ── Amount & date helpers ────────────────────────────────────────────────────

function parseAmount(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[₹,\s]/g, "")) || 0;
}

function parseDate(str) {
  if (!str) return null;
  str = str.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str);
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  return new Date(`${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`);
}

// ── Description cleaner ──────────────────────────────────────────────────────
// Extracts payee name from UPI/IMPS strings; collapses whitespace.
// Returns { description, reference }.

function cleanDescription(raw, csvRef) {
  const s = raw.replace(/\s+/g, " ").trim();

  // UPI: UPI/DR/<refNum>/<PayeeName>/<Bank>/<VPA>
  const upi = s.match(/UPI\/(?:DR|CR)\/(\d+)\/([^\/]+)\//i);
  if (upi) return { description: `UPI - ${upi[2].trim()}`, reference: csvRef || upi[1] };

  // IMPS: IMPS/<refNum>/<Description>/
  const imps = s.match(/IMPS\/(\d+)\/([^\/]+)\//i);
  if (imps) return { description: `IMPS - ${imps[2].trim()}`, reference: csvRef || imps[1] };

  // RTGS
  const rtgs = s.match(/RTGS\s+UTR\s+NO:\s*(\S+)/i);
  if (rtgs) return { description: "RTGS Transfer", reference: csvRef || rtgs[1] };

  // ATM withdrawal
  if (/ATM\s+(?:WDL|CASH)/i.test(s)) {
    const ref = s.match(/(\d{10,})/)?.[1];
    return { description: "ATM Cash Withdrawal", reference: csvRef || ref };
  }

  // DIRECT DR — auto-debit / EMI
  if (/DIRECT\s+DR/i.test(s)) {
    return { description: "Auto Debit (EMI/Standing Order)", reference: csvRef };
  }

  // DEP TFR — credit transfer
  if (/DEP\s+TFR/i.test(s)) {
    return { description: "Incoming Transfer", reference: csvRef };
  }

  // SBI NEFT/NACH style
  const sbiy = s.match(/SBIY\S*\/(?:M\/)?([^A-Z]{0,4}[A-Z][A-Za-z\s]{2,30})\s+(?:OF|AT)/i);
  if (sbiy) return { description: sbiy[1].trim(), reference: csvRef };

  return { description: s.substring(0, 120), reference: csvRef };
}

// ── Format detection ─────────────────────────────────────────────────────────

function detectFormat(headers) {
  const h = headers.map((x) => x.toUpperCase().replace(/\s+/g, " ").trim());
  const has = (...keys) => keys.every((k) => h.some((x) => x.includes(k)));

  if (has("NARRATION", "DEBIT AMOUNT", "CREDIT AMOUNT")) return "HDFC_SAVINGS";
  if (has("DESCRIPTION", "AMOUNT") && h.some((x) => /\bDR\b|\bCR\b/.test(x))) return "HDFC_CC";
  if (has("TXN DATE")) return "SBI";
  if (has("PARTICULARS", "DR", "CR") || has("TRAN DATE")) return "AXIS";
  // Generic: any row with DEBIT + CREDIT + a description-like column
  if (has("DEBIT", "CREDIT") && h.some((x) => /DESCRIPTION|NARRATION|PARTICULARS|DETAILS/.test(x))) return "GENERIC";
  return "GENERIC";
}

// ── Column index finder ───────────────────────────────────────────────────────
// Finds the index of the first column whose header matches any of the given patterns.

function col(headers, ...patterns) {
  return headers.findIndex((h) => patterns.some((p) => h.includes(p)));
}

// ── Generic parser (handles this file + BOB + SBI + similar) ─────────────────
// Works for any bank CSV with: Date, <Description>, [Ref], Debit, Credit, [Balance]

function parseGeneric(rows) {
  // Find the header row: must have Debit AND Credit columns
  const headerIdx = rows.findIndex((r) => {
    const up = r.map((c) => c.toUpperCase().replace(/\s+/g, " ").trim());
    return up.some((c) => /DEBIT|^DR$/.test(c)) && up.some((c) => /CREDIT|^CR$/.test(c));
  });
  if (headerIdx === -1) return [];

  const headers = rows[headerIdx].map((h) => h.toUpperCase().replace(/\s+/g, " ").trim());
  const iDate   = col(headers, "DATE", "TXN DATE", "TRAN DATE", "TRANSACTION DATE", "VALUE DATE");
  const iDesc   = col(headers, "DETAILS", "DESCRIPTION", "NARRATION", "PARTICULARS", "TRANSACTION DETAILS", "REMARKS");
  const iRef    = col(headers, "REF NO", "CHEQUE NO", "CHQNO", "REFERENCE");
  const iDebit  = col(headers, "DEBIT", " DR");
  const iCredit = col(headers, "CREDIT", " CR");
  const iBal    = col(headers, "BALANCE", "BAL");

  if (iDate === -1 || iDesc === -1) return [];

  return rows.slice(headerIdx + 1).flatMap((r) => {
    const date   = parseDate(r[iDate]);
    const debit  = parseAmount(r[iDebit]);
    const credit = parseAmount(r[iCredit]);
    if (!date || (debit === 0 && credit === 0)) return [];
    const rawRef = iRef !== -1 ? r[iRef]?.trim() : undefined;
    const { description, reference } = cleanDescription(r[iDesc] || "", rawRef || undefined);
    const rawDesc = (r[iDesc] || "").replace(/\s+/g, " ").trim();
    return [{
      date,
      description,
      rawDescription: rawDesc,
      amount: debit > 0 ? debit : credit,
      type: debit > 0 ? "debit" : "credit",
      reference: reference || undefined,
      balance: iBal !== -1 ? parseAmount(r[iBal]) || undefined : undefined,
    }];
  });
}

// ── HDFC Savings ──────────────────────────────────────────────────────────────

function parseHDFCSavings(rows) {
  const headerIdx = rows.findIndex((r) => r.some((c) => /narration/i.test(c)));
  if (headerIdx === -1) return [];
  const h = rows[headerIdx].map((c) => c.toUpperCase().replace(/\s+/g, " ").trim());
  const iDate = col(h, "DATE"); const iDesc = col(h, "NARRATION");
  const iDebit = col(h, "DEBIT"); const iCredit = col(h, "CREDIT");
  const iRef = col(h, "CHQ", "REF"); const iBal = col(h, "CLOSING", "BALANCE");
  return rows.slice(headerIdx + 1).flatMap((r) => {
    const date = parseDate(r[iDate]); const deb = parseAmount(r[iDebit]); const crd = parseAmount(r[iCredit]);
    if (!date || (deb === 0 && crd === 0)) return [];
    const rawRef = iRef !== -1 ? r[iRef]?.trim() : undefined;
    const { description, reference } = cleanDescription(r[iDesc] || "", rawRef);
    const rawDesc = (r[iDesc] || "").replace(/\s+/g, " ").trim();
    return [{ date, description, rawDescription: rawDesc, amount: deb || crd, type: deb > 0 ? "debit" : "credit", reference, balance: iBal !== -1 ? parseAmount(r[iBal]) || undefined : undefined }];
  });
}

// ── HDFC Credit Card ──────────────────────────────────────────────────────────

function parseHDFCCC(rows) {
  const headerIdx = rows.findIndex((r) => r.some((c) => /description/i.test(c)));
  if (headerIdx === -1) return [];
  const h = rows[headerIdx].map((c) => c.toUpperCase().trim());
  const iDate = col(h, "DATE"); const iDesc = col(h, "DESCRIPTION"); const iAmt = col(h, "AMOUNT");
  return rows.slice(headerIdx + 1).flatMap((r) => {
    const date = parseDate(r[iDate]); const raw = (r[iAmt] || "").trim();
    const isCredit = /cr/i.test(raw); const amount = parseAmount(raw.replace(/dr|cr/gi, ""));
    if (!date || amount === 0) return [];
    const rawDesc = (r[iDesc] || "").replace(/\s+/g, " ").trim();
    const { description } = cleanDescription(rawDesc, undefined);
    return [{ date, description, rawDescription: rawDesc, amount, type: isCredit ? "credit" : "debit", reference: undefined, balance: undefined }];
  });
}

// ── SBI ───────────────────────────────────────────────────────────────────────

function parseSBI(rows) {
  const headerIdx = rows.findIndex((r) => r.some((c) => /txn date|transaction date/i.test(c)));
  if (headerIdx === -1) return [];
  const h = rows[headerIdx].map((c) => c.toUpperCase().replace(/\s+/g, " ").trim());
  const iDate = col(h, "TXN DATE", "DATE"); const iDesc = col(h, "DESCRIPTION", "NARRATION", "PARTICULARS");
  const iRef = col(h, "REF", "CHQ"); const iDebit = col(h, "DEBIT"); const iCredit = col(h, "CREDIT"); const iBal = col(h, "BALANCE");
  return rows.slice(headerIdx + 1).flatMap((r) => {
    const date = parseDate(r[iDate]); const deb = parseAmount(r[iDebit]); const crd = parseAmount(r[iCredit]);
    if (!date || (deb === 0 && crd === 0)) return [];
    const rawRef = iRef !== -1 ? r[iRef]?.trim() : undefined;
    const rawDesc = (r[iDesc] || "").replace(/\s+/g, " ").trim();
    const { description, reference } = cleanDescription(rawDesc, rawRef);
    return [{ date, description, rawDescription: rawDesc, amount: deb || crd, type: deb > 0 ? "debit" : "credit", reference, balance: iBal !== -1 ? parseAmount(r[iBal]) || undefined : undefined }];
  });
}

// ── Axis Bank ─────────────────────────────────────────────────────────────────

function parseAxis(rows) {
  const headerIdx = rows.findIndex((r) => r.some((c) => /tran date|particulars/i.test(c)));
  if (headerIdx === -1) return [];
  const h = rows[headerIdx].map((c) => c.toUpperCase().replace(/\s+/g, " ").trim());
  const iDate = col(h, "DATE"); const iDesc = col(h, "PARTICULARS", "DESCRIPTION", "NARRATION");
  const iRef = col(h, "CHQ", "REF"); const iDR = col(h, " DR", "DEBIT"); const iCR = col(h, " CR", "CREDIT"); const iBal = col(h, "BAL", "BALANCE");
  return rows.slice(headerIdx + 1).flatMap((r) => {
    const date = parseDate(r[iDate]); const dr = parseAmount(r[iDR]); const cr = parseAmount(r[iCR]);
    if (!date || (dr === 0 && cr === 0)) return [];
    const rawRef = iRef !== -1 ? r[iRef]?.trim() : undefined;
    const rawDesc = (r[iDesc] || "").replace(/\s+/g, " ").trim();
    const { description, reference } = cleanDescription(rawDesc, rawRef);
    return [{ date, description, rawDescription: rawDesc, amount: dr || cr, type: dr > 0 ? "debit" : "credit", reference, balance: iBal !== -1 ? parseAmount(r[iBal]) || undefined : undefined }];
  });
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Parse a CSV string into normalized transactions.
 * @param {string} csvText  Raw CSV content from bank statement
 * @param {number} accountId  The BankAccount id (used in deduplication hash)
 * @returns {{ format: string, transactions: object[] }}
 */
export async function parseTransactions(csvText, accountId) {
  const rows = parseCSV(csvText).filter((r) => r.some((c) => c.length > 0));
  if (rows.length < 2) return { format: "EMPTY", transactions: [] };

  // Find the header row: first row with ≥3 non-empty cells that doesn't start with a date
  const headerRow = rows.find((r) => r.filter((c) => c.length > 0).length >= 3 && !/^\d{1,2}[\/\-]/.test(r[0]));
  const format = headerRow ? detectFormat(headerRow) : "GENERIC";

  let rawTxns = [];
  switch (format) {
    case "HDFC_SAVINGS": rawTxns = parseHDFCSavings(rows); break;
    case "HDFC_CC":      rawTxns = parseHDFCCC(rows);      break;
    case "SBI":          rawTxns = parseSBI(rows);          break;
    case "AXIS":         rawTxns = parseAxis(rows);         break;
    default:             rawTxns = parseGeneric(rows);      break;
  }

  const transactions = await Promise.all(
    rawTxns.map(async (t) => {
      const dateISO = t.date instanceof Date ? t.date.toISOString().slice(0, 10) : String(t.date).slice(0, 10);
      const hashInput = `${accountId}|${dateISO}|${t.amount.toFixed(2)}|${t.rawDescription || t.description}`;
      const importHash = await sha256(hashInput);
      const { rawDescription, ...rest } = t;
      return {
        ...rest,
        date: t.date instanceof Date ? t.date.toISOString() : t.date,
        category: autoCategory(rawDescription || t.description),
        importHash,
      };
    })
  );

  return { format, transactions };
}

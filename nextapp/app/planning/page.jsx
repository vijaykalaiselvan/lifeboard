"use client";
import { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";

function fmtINR(n) {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function addMonthsLabel(months) {
  if (!isFinite(months) || months <= 0) return "—";
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(months));
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function CalcCard({ title, icon, children }) {
  return (
    <div className="bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <span>{icon}</span>{title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InputRow({ label, value, onChange, prefix, suffix, note }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <div className="min-w-0">
        <label className="text-sm text-text-secondary">{label}</label>
        {note && <p className="text-xs text-text-muted">{note}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {prefix && <span className="text-sm text-text-muted">{prefix}</span>}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="w-32 bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-right text-sm text-text-primary focus:outline-none focus:border-accent" />
        {suffix && <span className="text-sm text-text-muted w-6">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultSection({ children }) {
  return (
    <div className="mt-5 bg-bg-elevated rounded-xl p-4 space-y-0 divide-y divide-border">
      {children}
    </div>
  );
}

function ResultRow({ label, value, highlight, positive, negative }) {
  const color = highlight
    ? positive ? "text-green-600 dark:text-green-400"
      : negative ? "text-red-600 dark:text-red-400"
      : "text-accent"
    : "text-text-primary";
  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function ProgressBar({ pct, color = "bg-accent" }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-text-muted mb-1">
        <span>Progress</span><span>{Math.min(pct, 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden border border-border">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// ── Emergency Fund ──────────────────────────────────────────────────────────

function EmergencyFundCalc() {
  const [contribution, setContribution] = useState(3000);
  const [phase1, setPhase1] = useState(300000);
  const [phase2, setPhase2] = useState(660000);
  const [rate, setRate] = useState(7);
  const [current, setCurrent] = useState(0);

  const r = rate / 100 / 12;

  function monthsToTarget(target, existing) {
    const rem = target - existing;
    if (rem <= 0) return 0;
    if (!contribution || contribution <= 0) return Infinity;
    if (r === 0) return Math.ceil(rem / contribution);
    return Math.ceil(Math.log((target * r + contribution) / (existing * r + contribution)) / Math.log(1 + r));
  }

  const m1 = monthsToTarget(phase1, current);
  const m2 = monthsToTarget(phase2, current);
  const pct1 = phase1 > 0 ? (current / phase1) * 100 : 0;

  return (
    <CalcCard title="Emergency Fund" icon="🛡️">
      <InputRow label="Monthly contribution" value={contribution} onChange={setContribution} prefix="₹" />
      <InputRow label="Phase 1 target" value={phase1} onChange={setPhase1} prefix="₹" note="3 months expenses" />
      <InputRow label="Phase 2 target" value={phase2} onChange={setPhase2} prefix="₹" note="6 months expenses" />
      <InputRow label="Expected return" value={rate} onChange={setRate} suffix="%" note="liquid MF / savings" />
      <InputRow label="Current savings" value={current} onChange={setCurrent} prefix="₹" />
      <ProgressBar pct={pct1} />
      <ResultSection>
        <ResultRow label="Phase 1 target" value={fmtINR(phase1)} />
        <ResultRow label="Months to Phase 1" value={m1 === 0 ? "Already reached ✓" : isFinite(m1) ? `${m1} months` : "—"} />
        <ResultRow label="Phase 1 completion" value={m1 === 0 ? "—" : addMonthsLabel(m1)} highlight />
        <ResultRow label="Months to Phase 2" value={m2 === 0 ? "Already reached ✓" : isFinite(m2) ? `${m2} months` : "—"} />
        <ResultRow label="Phase 2 completion" value={m2 === 0 ? "—" : addMonthsLabel(m2)} highlight />
      </ResultSection>
    </CalcCard>
  );
}

// ── Retirement ──────────────────────────────────────────────────────────────

function RetirementCalc() {
  const [currentAge, setCurrentAge] = useState(39);
  const [retireAge, setRetireAge] = useState(58);
  const [monthlyNeed, setMonthlyNeed] = useState(150000);
  const [investReturn, setInvestReturn] = useState(11);
  const [inflation, setInflation] = useState(6);
  const [postReturn, setPostReturn] = useState(7);
  const [retireYears, setRetireYears] = useState(25);
  const [monthlySip, setMonthlySip] = useState(1940);

  const yearsToRetire = Math.max(0, retireAge - currentAge);
  const inflatedNeed = monthlyNeed * Math.pow(1 + inflation / 100, yearsToRetire);
  const annualNeed = inflatedNeed * 12;
  const pr = postReturn / 100;
  const required = pr > 0
    ? annualNeed * (1 - Math.pow(1 + pr, -retireYears)) / pr
    : annualNeed * retireYears;

  const mr = investReturn / 100 / 12;
  const n = yearsToRetire * 12;
  const projected = mr > 0
    ? monthlySip * (Math.pow(1 + mr, n) - 1) / mr * (1 + mr)
    : monthlySip * n;
  const gap = projected - required;

  return (
    <CalcCard title="Retirement Corpus" icon="🏖️">
      <InputRow label="Current age" value={currentAge} onChange={setCurrentAge} suffix="yrs" />
      <InputRow label="Target retirement age" value={retireAge} onChange={setRetireAge} suffix="yrs" />
      <InputRow label="Monthly need (today's ₹)" value={monthlyNeed} onChange={setMonthlyNeed} prefix="₹" />
      <InputRow label="Investment return" value={investReturn} onChange={setInvestReturn} suffix="%" />
      <InputRow label="Inflation rate" value={inflation} onChange={setInflation} suffix="%" />
      <InputRow label="Post-retirement return" value={postReturn} onChange={setPostReturn} suffix="%" />
      <InputRow label="Years in retirement" value={retireYears} onChange={setRetireYears} suffix="yrs" />
      <InputRow label="Monthly SIP" value={monthlySip} onChange={setMonthlySip} prefix="₹" />
      <ResultSection>
        <ResultRow label="Years to retirement" value={`${yearsToRetire} years`} />
        <ResultRow label="Inflation-adj. monthly need" value={fmtINR(Math.round(inflatedNeed))} />
        <ResultRow label="Required corpus" value={fmtINR(Math.round(required))} />
        <ResultRow label="Projected corpus (SIP)" value={fmtINR(Math.round(projected))} />
        <ResultRow
          label={gap >= 0 ? "Surplus" : "Shortfall"}
          value={`${gap >= 0 ? "+" : ""}${fmtINR(Math.round(gap))}`}
          highlight positive={gap >= 0} negative={gap < 0}
        />
      </ResultSection>
    </CalcCard>
  );
}

// ── Education ───────────────────────────────────────────────────────────────

function EducationCalc() {
  const [childAge, setChildAge] = useState(5);
  const [collegeAge, setCollegeAge] = useState(18);
  const [target, setTarget] = useState(4500000);
  const [sip, setSip] = useState(2426);
  const [rate, setRate] = useState(11);

  const years = Math.max(0, collegeAge - childAge);
  const mr = rate / 100 / 12;
  const n = years * 12;
  const projected = mr > 0
    ? sip * (Math.pow(1 + mr, n) - 1) / mr * (1 + mr)
    : sip * n;
  const gap = projected - target;
  const pct = target > 0 ? (projected / target) * 100 : 0;

  return (
    <CalcCard title="Kid's Education" icon="🎓">
      <InputRow label="Child's current age" value={childAge} onChange={setChildAge} suffix="yrs" />
      <InputRow label="College start age" value={collegeAge} onChange={setCollegeAge} suffix="yrs" />
      <InputRow label="Target corpus" value={target} onChange={setTarget} prefix="₹" />
      <InputRow label="Monthly SIP" value={sip} onChange={setSip} prefix="₹" />
      <InputRow label="Expected return" value={rate} onChange={setRate} suffix="%" />
      <ProgressBar pct={pct} />
      <ResultSection>
        <ResultRow label="Years until college" value={`${years} years`} />
        <ResultRow label="Target corpus" value={fmtINR(target)} />
        <ResultRow label="Projected corpus" value={fmtINR(Math.round(projected))} />
        <ResultRow
          label={gap >= 0 ? "Surplus" : "Shortfall"}
          value={`${gap >= 0 ? "+" : ""}${fmtINR(Math.round(gap))}`}
          highlight positive={gap >= 0} negative={gap < 0}
        />
      </ResultSection>
    </CalcCard>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  return (
    <ProtectedLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Planning</h1>
          <p className="text-sm text-text-muted mt-0.5">Financial calculators — all computed client-side in real time.</p>
        </div>
        <div className="space-y-6">
          <EmergencyFundCalc />
          <RetirementCalc />
          <EducationCalc />
        </div>
      </div>
    </ProtectedLayout>
  );
}

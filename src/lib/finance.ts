// Pure financing maths. No imports so it can be unit tested directly in Node.
export interface LoanInput { price: number; down: number; annualRate: number; months: number }
export interface LoanResult { down: number; financed: number; monthly: number; totalInterest: number; totalRepayment: number; totalCost: number }

export function calcLoan({ price, down, annualRate, months }: LoanInput): LoanResult {
  const p = Math.max(0, Number.isFinite(price) ? price : 0);
  const d = Math.min(p, Math.max(0, Number.isFinite(down) ? down : 0));
  const financed = p - d;
  const n = Math.max(1, Math.round(months));
  const r = Math.max(0, annualRate) / 100 / 12;
  let monthly: number;
  if (financed === 0) monthly = 0;
  else if (r === 0) monthly = financed / n;
  else monthly = (financed * r) / (1 - Math.pow(1 + r, -n));
  const totalRepayment = monthly * n;
  return { down: d, financed, monthly, totalInterest: totalRepayment - financed, totalRepayment, totalCost: d + totalRepayment };
}
export const TERMS = [12, 24, 36, 48, 60];

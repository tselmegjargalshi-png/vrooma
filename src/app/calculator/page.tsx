"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LoanCalculator } from "@/components/Calculator";
import { PageHead } from "@/components/ui";
import { useT } from "@/lib/hooks";

function Inner() {
  const { t } = useT();
  const sp = useSearchParams();
  const price = Number(sp.get("price")) || 60_000_000;
  return <div className="container py-8"><PageHead title={t("nav.calculator")} sub={t("calc.sub")} /><LoanCalculator key={price} initialPrice={price} /></div>;
}
export default function CalcPage() { return <Suspense><Inner /></Suspense>; }

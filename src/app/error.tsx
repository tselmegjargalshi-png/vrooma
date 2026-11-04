"use client";
import { useT } from "@/lib/hooks";
import { Empty } from "@/components/ui";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  return <div className="container py-20"><Empty title={t("err.generic")} body={t("err.generic.body")} action={<button onClick={reset} className="btn btn-primary">{t("common.retry")}</button>} /></div>;
}

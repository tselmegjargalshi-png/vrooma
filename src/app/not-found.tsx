"use client";
import Link from "next/link";
import { useT } from "@/lib/hooks";
import { Empty } from "@/components/ui";
export default function NotFound() {
  const { t } = useT();
  return <div className="container py-20"><Empty title={t("err.notfound")} body={t("err.notfound.body")} action={<Link href="/" className="btn btn-primary">{t("nav.home")}</Link>} /></div>;
}

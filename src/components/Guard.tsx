"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT, useUser } from "@/lib/hooks";
import { can, type Perm } from "@/lib/perms";
import type { Role } from "@/lib/types";
import { Empty } from "./ui";

export function Guard({ children, roles, perm }: { children: ReactNode; roles?: Role[]; perm?: Perm }) {
  const user = useUser();
  const { t } = useT();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => { if (!user) router.replace("/login?next=" + encodeURIComponent(path)); }, [user, router, path]);
  if (!user) return null;
  const ok = (!roles || roles.includes(user.role)) && (!perm || can(user.role, perm));
  if (!ok) return <div className="py-16" data-testid="forbidden"><Empty title={t("err.forbidden")} body={t("err.forbidden.body")} action={<Link href="/" className="btn btn-primary">{t("nav.home")}</Link>} /></div>;
  return <>{children}</>;
}

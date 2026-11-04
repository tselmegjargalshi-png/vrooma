"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard, Car, Users, ClipboardCheck, MessageSquare, BarChart3, Megaphone, Building2, User, CheckSquare, Tag, Wallet, Flag, ScrollText } from "lucide-react";
import { useT, useUser } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Guard } from "@/components/Guard";
import { DASH_NAV, can, homeFor } from "@/lib/perms";

const ICONS: Record<string, typeof Car> = { layout: LayoutDashboard, car: Car, users: Users, clipboard: ClipboardCheck, message: MessageSquare, chart: BarChart3, megaphone: Megaphone, building: Building2, user: User, check: CheckSquare, tag: Tag, wallet: Wallet, flag: Flag, log: ScrollText };

function Shell({ children }: { children: ReactNode }) {
  const { t } = useT();
  const user = useUser()!;
  const path = usePathname();
  const router = useRouter();
  const threads = useStore((s) => s.threads);
  useEffect(() => { if (user.role === "customer") router.replace(homeFor("customer")); }, [user.role, router]);
  const items = DASH_NAV.filter((n) => !n.perm || can(user.role, n.perm)).filter((n) => (n.key === "dash.inspections" ? true : true));
  const unread = threads.filter((th) => th.participants.includes(user.id) && th.messages.at(-1) && th.messages.at(-1)!.from !== user.id && (!th.readAt[user.id] || th.readAt[user.id] < th.messages.at(-1)!.at)).length;
  const active = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));
  return (
    <div className="container py-6 grid lg:grid-cols-[250px_1fr] gap-6 items-start">
      <aside className="lg:sticky lg:top-28">
        <div className="card p-3 lg:p-4">
          <div className="hidden lg:block px-2 pb-3 mb-2 border-b border-ink-900/[.07]"><div className="font-bold truncate">{user.name}</div><div className="text-xs text-brass-700 font-semibold">{t("role." + user.role)}</div></div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-none" aria-label="dashboard">
            {items.map((n) => { const I = ICONS[n.icon] ?? Car; return (
              <Link key={n.href} href={n.href} data-testid={"nav-" + n.href.replace(/\//g, "_")} className={`shrink-0 flex items-center gap-2.5 px-3 h-10 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition-colors ${active(n.href) ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-900/5"}`}>
                <I size={16} />{t(n.key)}{n.href === "/messages" && unread > 0 && <span className="ml-auto text-[10px] bg-bad text-white rounded-full px-1.5">{unread}</span>}
              </Link>); })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
export default function DashLayout({ children }: { children: ReactNode }) { return <Guard><Shell>{children}</Shell></Guard>; }

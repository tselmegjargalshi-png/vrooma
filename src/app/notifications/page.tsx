"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useT, useUser } from "@/lib/hooks";
import { Guard } from "@/components/Guard";
import { Empty, PageHead } from "@/components/ui";
import { ago } from "@/lib/format";
import { Bell } from "lucide-react";

function Inner() {
  const { t, lang } = useT();
  const user = useUser()!;
  const router = useRouter();
  const notices = useStore((s) => s.notices).filter((n) => n.userId === user.id);
  const read = useStore((s) => s.markNoticeRead), all = useStore((s) => s.markAllNotices);
  return (
    <div className="container py-8 max-w-3xl">
      <PageHead title={t("ntf.center")} actions={<button className="btn btn-sm btn-outline" onClick={all} data-testid="mark-all">{t("ntf.markall")}</button>} />
      <div className="card overflow-hidden" data-testid="notice-list">
        {notices.length === 0 ? <Empty title={t("ntf.empty")} icon={<Bell size={24} />} /> : (
          <ul>{notices.map((n) => (
            <li key={n.id}><button onClick={() => { read(n.id); if (n.link) router.push(n.link); }} className={`w-full text-left px-5 py-4 border-b border-ink-900/[.05] hover:bg-bone-100 flex gap-3 ${n.read ? "" : "bg-brass-500/[.07]"}`}>
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-brass-500"}`} />
              <span className="min-w-0"><span className="block text-sm font-semibold">{t(n.title, { v: n.body })}</span><span className="block text-xs text-steel-500 mt-0.5">{t("ntf.kind." + n.kind)} · {ago(n.at, lang)}</span></span></button></li>
          ))}</ul>
        )}
      </div>
    </div>
  );
}
export default function Page() { return <Guard><Inner /></Guard>; }

"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { useBrandName, useT, useUser } from "@/lib/hooks";
import { Guard } from "@/components/Guard";
import { Empty, PageHead } from "@/components/ui";
import { ago, fmtDate } from "@/lib/format";

function Inner() {
  const { t, lang } = useT();
  const user = useUser()!;
  const router = useRouter();
  const sp = useSearchParams();
  const threads = useStore((s) => s.threads), users = useStore((s) => s.users), vehicles = useStore((s) => s.vehicles), dealers = useStore((s) => s.dealers);
  const send = useStore((s) => s.sendMessage), read = useStore((s) => s.readThread);
  const brandName = useBrandName();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  // dealer team members also see threads addressed to any agent of the dealership
  const mine = threads.filter((th) => th.participants.includes(user.id) || (user.role === "dealer_owner" && th.participants.some((p) => users.find((u) => u.id === p)?.dealerId === user.dealerId && users.find((u) => u.id === p)?.role === "agent")))
    .sort((a, b) => new Date(b.messages.at(-1)?.at ?? 0).getTime() - new Date(a.messages.at(-1)?.at ?? 0).getTime());
  const sel = threads.find((x) => x.id === sp.get("thread")) ?? null;
  const active = sel && mine.some((m) => m.id === sel.id) ? sel : null;
  useEffect(() => { if (active) { read(active.id); end.current?.scrollIntoView({ block: "end" }); } }, [active?.id, active?.messages.length, read]); // eslint-disable-line react-hooks/exhaustive-deps
  const other = (th: typeof threads[number]) => users.find((u) => u.id === th.participants.find((p) => p !== user.id)) ?? users.find((u) => u.id === th.participants[0]);
  const label = (u?: typeof users[number]) => (u ? (u.dealerId ? dealers.find((d) => d.id === u.dealerId)?.name + " · " : "") + u.name : "?");
  return (
    <div className="container py-8">
      <PageHead title={t("dash.messages")} sub={t("msg.sub")} />
      <div className="card grid md:grid-cols-[320px_1fr] overflow-hidden min-h-[520px]" data-testid="messages">
        <div className={`border-r border-ink-900/[.07] ${active ? "hidden md:block" : ""}`}>
          {mine.length === 0 ? <Empty title={t("msg.empty")} body={t("msg.empty.body")} /> : (
            <ul>{mine.map((th) => {
              const v = vehicles.find((x) => x.id === th.vehicleId); const last = th.messages.at(-1);
              const unread = !!last && last.from !== user.id && (!th.readAt[user.id] || th.readAt[user.id] < last.at);
              return <li key={th.id}><button onClick={() => router.push("/messages?thread=" + th.id)} className={`w-full text-left px-4 py-3.5 border-b border-ink-900/[.05] hover:bg-bone-100 ${active?.id === th.id ? "bg-bone-100" : ""}`} data-testid="thread-item">
                <div className="flex justify-between gap-2"><span className={`text-sm truncate ${unread ? "font-extrabold" : "font-semibold"}`}>{label(other(th))}</span>{last && <span className="text-[11px] text-steel-500 shrink-0">{ago(last.at, lang)}</span>}</div>
                {v && <div className="text-xs text-brass-700 font-semibold truncate">{brandName(v.brandId)} {v.modelName} {v.year}</div>}
                <div className={`text-xs truncate mt-0.5 ${unread ? "text-ink-900" : "text-steel-500"}`}>{last?.text ?? t("msg.new")}</div></button></li>;
            })}</ul>
          )}
        </div>
        <div className={`flex flex-col ${active ? "" : "hidden md:flex"}`}>
          {!active ? <div className="m-auto text-sm text-steel-500 p-10">{t("msg.select")}</div> : (
            <>
              <div className="px-4 py-3 border-b border-ink-900/[.07] flex items-center gap-3">
                <button className="md:hidden h-9 w-9 grid place-items-center rounded-full hover:bg-ink-900/5" onClick={() => router.push("/messages")} aria-label={t("common.back")}><ArrowLeft size={18} /></button>
                <div className="min-w-0"><div className="font-bold truncate">{label(other(active))}</div>{active.vehicleId && (() => { const v = vehicles.find((x) => x.id === active.vehicleId); return v ? <Link href={`/cars/view?id=${v.id}`} className="text-xs text-brass-700 font-semibold hover:underline">{brandName(v.brandId)} {v.modelName} {v.year}</Link> : null; })()}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[420px] min-h-[300px]" data-testid="thread-messages">
                {active.messages.length === 0 && <p className="text-sm text-steel-500 text-center py-10">{t("msg.startconv")}</p>}
                {active.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === user.id ? "justify-end" : ""}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.from === user.id ? "bg-ink-900 text-white rounded-br-md" : "bg-bone-100 rounded-bl-md"}`}>{m.text}<div className={`text-[10px] mt-1 ${m.from === user.id ? "text-white/50" : "text-steel-500"}`}>{fmtDate(m.at, lang, true)}</div></div></div>
                ))}
                <div ref={end} />
              </div>
              <form className="p-3 border-t border-ink-900/[.07] flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; send(active.id, text.trim()); setText(""); }}>
                <input className="input" name="message" aria-label={t("common.message")} placeholder={t("msg.placeholder")} value={text} onChange={(e) => setText(e.target.value)} data-testid="msg-input" />
                <button className="btn btn-primary px-5" aria-label={t("common.send")} data-testid="msg-send"><Send size={16} /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default function MessagesPage() { return <Guard><Suspense><Inner /></Suspense></Guard>; }

"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Guard } from "@/components/Guard";
import { ListingForm } from "@/components/ListingForm";
import { Empty, PageHead } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useT, useUser } from "@/lib/hooks";
import { can } from "@/lib/perms";

function Inner({ id }: { id: string }) {
  const { t } = useT();
  const user = useUser()!;
  const v = useStore((s) => s.vehicles).find((x) => x.id === id);
  const allowed = !!v && (can(user.role, "listing.all") || v.sellerId === user.id || (!!v.dealerId && v.dealerId === user.dealerId));
  if (!allowed) return <Empty title={t("err.forbidden")} body={t("err.forbidden.body")} />;
  return <><PageHead title={t("lst.edit")} /><ListingForm vehicle={v} /></>;
}
function EditListingInner({ id }: { id: string }) {
  return <Guard><Inner id={id} /></Guard>;
}

function EditListingQuery() { const id = useSearchParams().get("id") ?? ""; return <EditListingInner key={id} id={id} />; }
export default function EditListing() { return <Suspense fallback={null}><EditListingQuery /></Suspense>; }

"use client";
import { use } from "react";
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
export default function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Guard><Inner id={id} /></Guard>;
}

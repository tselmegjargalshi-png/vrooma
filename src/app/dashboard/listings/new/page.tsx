"use client";
import { Guard } from "@/components/Guard";
import { ListingForm } from "@/components/ListingForm";
import { PageHead } from "@/components/ui";
import { useT } from "@/lib/hooks";

export default function NewListing() {
  const { t } = useT();
  return <Guard perm="listing.create"><PageHead title={t("lst.new")} sub={t("lst.new.sub")} /><ListingForm /></Guard>;
}

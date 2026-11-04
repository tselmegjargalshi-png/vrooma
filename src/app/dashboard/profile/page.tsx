"use client";
import { Guard } from "@/components/Guard";
import { ProfileForm } from "@/components/ProfileForm";
import { PageHead } from "@/components/ui";
import { useT } from "@/lib/hooks";
export default function Profile() { const { t } = useT(); return <Guard><PageHead title={t("dash.profile")} /><ProfileForm /></Guard>; }

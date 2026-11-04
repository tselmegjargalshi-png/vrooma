"use client";
import { useEffect } from "react";
import type { Role } from "@/lib/types";
import { homeFor } from "@/lib/perms";

/** Sends users whose role does not belong on this surface to their own home. */
export function redirectHome(role: Role, router: { replace: (p: string) => void }, expect: "customer" | "staff") {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const isCustomer = role === "customer";
    if ((expect === "customer" && !isCustomer) || (expect === "staff" && isCustomer)) router.replace(homeFor(role));
  }, [role, expect, router]);
}

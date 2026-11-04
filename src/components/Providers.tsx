"use client";
import { useEffect, type ReactNode } from "react";
import { useHydrated } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { LogoMark } from "./Logo";
import { Toast } from "./ui";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CompareTray } from "./CompareTray";

export function Providers({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const lang = useStore((s) => s.lang);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { if (hydrated) useStore.getState().tick(); }, [hydrated]);
  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center bg-ink-900" aria-busy="true" aria-label="Vrooma">
        <div className="animate-pulse"><LogoMark size={56} tone="light" /></div>
      </div>
    );
  }
  return (
    <>
      <Header />
      <main id="main" className="min-h-[70vh]">{children}</main>
      <Footer />
      <CompareTray />
      <Toast />
    </>
  );
}

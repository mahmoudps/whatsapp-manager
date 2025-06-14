"use client";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { Locale } from "./i18n";

const locales: Locale[] = ["ar", "en"];

export function useCurrentLocale(): Locale {
  const pathname = usePathname();
  return useMemo(() => {
    const first = pathname.split("/")[1];
    if (locales.includes(first as Locale)) return first as Locale;
    return "ar";
  }, [pathname]);
}

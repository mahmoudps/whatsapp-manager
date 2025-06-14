"use client";

import type React from "react";
import { AppProvider } from "@/lib/app-context";
import { WebSocketProvider } from "@/lib/websocket-context";
import { I18nProvider } from "@/lib/i18n";
import { useCurrentLocale } from "@/lib/use-locale";
import "./globals.css";
import "../styles/globals.css";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useCurrentLocale();
  return (
    <WebSocketProvider>
      <AppProvider>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </AppProvider>
    </WebSocketProvider>
  );
}

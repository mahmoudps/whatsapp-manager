"use client";

import type React from "react";
import { AppProvider } from "@/lib/app-context";
import { WebSocketProvider } from "@/lib/websocket-context";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import "../styles/globals.css";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebSocketProvider>
      <AppProvider>
        {children}
        <Toaster />
      </AppProvider>
    </WebSocketProvider>
  );
}

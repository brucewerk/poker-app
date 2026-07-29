// app/providers.js
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme/ThemeContext";
import { ToastProvider } from "@/components/Toast/ToastManager";

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

// app/providers.js
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  return (
    <SessionProvider
      // 🔥 Forçar refresh periódico da sessão
      refetchInterval={5 * 60} // 5 minutos
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}

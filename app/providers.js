// app/providers.js
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
      // 🔥 Força o caminho base para garantir que as requisições sejam feitas corretamente
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}

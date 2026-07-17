// app/providers.js
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
      // 🔥 BASE PATH PARA GARANTIR QUE AS REQUISIÇÕES ESTEJAM CORRETAS
    >
      {children}
    </SessionProvider>
  );
}

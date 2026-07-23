// app/providers.js - COM GAME CONTEXT
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme/ThemeContext";
import { GameProvider } from "@/lib/context/GameContext";

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <GameProvider>{children}</GameProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

// app/theme/ThemeContext.jsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 🔥 CORRIGIDO (bug crítico): este efeito roda no carregamento inicial
    // do app inteiro (ThemeProvider envolve toda a aplicação). Antes ele
    // chamava localStorage.getItem/.setItem diretamente, sem tratamento de
    // erro. No Safari do iPad (modo privado, ou com "Impedir rastreamento
    // entre sites" combinado com certas políticas, ou armazenamento
    // bloqueado por perfil MDM/gerenciado), localStorage.setItem() lança
    // uma exceção - e como não havia tema salvo na primeira visita, o
    // código SEMPRE tentava salvar um tema logo de cara, o que travava a
    // aplicação inteira bem no início, antes de qualquer coisa renderizar
    // (exatamente o sintoma relatado: "só aparece o fundo verde").
    // Agora usamos os wrappers seguros (safeGetItem/safeSetItem), que
    // nunca lançam - se o armazenamento estiver bloqueado, o app
    // simplesmente segue usando o tema em memória sem persistir entre
    // sessões, em vez de travar por completo.
    const savedTheme = safeGetItem("poker-theme");

    // 🔥 SE TIVER TEMA SALVO, USA ELE
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      return;
    }

    // 🔥 SE NÃO TIVER TEMA SALVO, USA PREFERÊNCIA DO SISTEMA
    let prefersLight = false;
    try {
      prefersLight =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches;
    } catch (e) {
      // matchMedia pode falhar em alguns webviews restritos - seguimos
      // com o padrão (escuro) sem travar o app.
      prefersLight = false;
    }

    if (prefersLight) {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
      safeSetItem("poker-theme", "light");
    } else {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      safeSetItem("poker-theme", "dark");
    }
  }, []);

  // 🔥 FUNÇÃO PARA ALTERNAR TEMA
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    safeSetItem("poker-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // 🔥 FUNÇÃO PARA FORÇAR UM TEMA ESPECÍFICO (USADO EM CASOS ESPECIAIS)
  const setThemeForced = (newTheme) => {
    if (newTheme !== "dark" && newTheme !== "light") return;
    setTheme(newTheme);
    safeSetItem("poker-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // 🔥 EVITAR HIDRATAÇÃO INCORRETA
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme: setThemeForced }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

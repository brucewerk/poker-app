// app/theme/ThemeContext.jsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 🔥 RECUPERAR TEMA SALVO DO LOCALSTORAGE
    const savedTheme = localStorage.getItem("poker-theme");

    // 🔥 SE TIVER TEMA SALVO, USA ELE
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      console.log(`🎨 Tema carregado: ${savedTheme}`);
      return;
    }

    // 🔥 SE NÃO TIVER TEMA SALVO, USA PREFERÊNCIA DO SISTEMA
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("poker-theme", "light");
      console.log("🎨 Tema claro detectado (preferência do sistema)");
    } else {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("poker-theme", "dark");
      console.log("🎨 Tema escuro (padrão)");
    }
  }, []);

  // 🔥 FUNÇÃO PARA ALTERNAR TEMA
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("poker-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    console.log(`🎨 Tema alterado para: ${newTheme}`);
  };

  // 🔥 FUNÇÃO PARA FORÇAR UM TEMA ESPECÍFICO (USADO EM CASOS ESPECIAIS)
  const setThemeForced = (newTheme) => {
    if (newTheme !== "dark" && newTheme !== "light") return;
    setTheme(newTheme);
    localStorage.setItem("poker-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    console.log(`🎨 Tema forçado para: ${newTheme}`);
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

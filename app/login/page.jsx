// app/login/page.jsx - COMPLETO COM TRATAMENTO DE ERROS AMIGÁVEL
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // 🔥 INTERCEPTAR ERROS DE CONSOLE PARA NÃO APARECER NO CONSOLE
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      // 🔥 Filtrar erros de autenticação que são esperados
      const message = args[0];
      if (typeof message === "string" && 
          (message.includes("401") || message.includes("Unauthorized") || 
           message.includes("POST http://localhost:3000/api/auth"))) {
        console.info("🔐 Autenticação tratada:", message);
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        // 🔥 TRATAR COMO MENSAGEM AMIGÁVEL, NÃO COMO ERRO NO CONSOLE
        console.info("🔐 Tentativa de login:", username);
        setError("❌ Usuário ou senha inválidos. Tente novamente.");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        console.info(`✅ Login bem-sucedido: ${username}`);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      // 🔥 EVITAR LOG DE ERRO DESNECESSÁRIO
      console.info("🔐 Falha na autenticação:", username);
      setError("❌ Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="auth-header">
          <div className="auth-icon">🃏</div>
          <h1 className="auth-title">Poker</h1>
          <p className="auth-subtitle">Faça login para continuar</p>
          <motion.button
            onClick={toggleTheme}
            style={{
              position: "absolute",
              top: "15px",
              right: "15px",
              background: "var(--bg-button)",
              border: "1px solid var(--border-light)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1.2rem",
              transition: "all 0.2s ease",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Usuário</label>
            <input
              type="text"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Senha</label>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <motion.div
              className="auth-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "⏳ Entrando..." : "🚀 Entrar"}
          </button>
        </form>

        <div className="auth-footer">
          Não tem uma conta?{" "}
          <Link href="/register" className="auth-link">
            Registre-se
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

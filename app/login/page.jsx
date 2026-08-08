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
      // 🔥 CORRIGIDO: o filtro antigo só reconhecia a string literal
      // "POST http://localhost:3000/api/auth" - nunca funcionava em
      // produção (domínio diferente) e não reconhecia o formato real do
      // NextAuth (ex: "[next-auth][error][CLIENT_FETCH_ERROR]"), então
      // esses erros esperados (ex: sessão ainda não carregada, tentativa
      // de login inválida) acabavam aparecendo no console mesmo assim.
      // Agora verificamos todos os argumentos, não só o primeiro, e
      // cobrimos os padrões reais de mensagem do NextAuth.
      const combined = args
        .map((a) => (typeof a === "string" ? a : ""))
        .join(" ");

      const isExpectedAuthNoise =
        combined.includes("401") ||
        combined.includes("Unauthorized") ||
        combined.includes("/api/auth") ||
        combined.includes("[next-auth]") ||
        combined.includes("CLIENT_FETCH_ERROR");

      if (isExpectedAuthNoise) {
        console.info("🔐 Autenticação tratada:", combined || args[0]);
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

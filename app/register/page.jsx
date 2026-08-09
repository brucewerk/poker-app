// app/register/page.jsx - COMPLETO COM TRATAMENTO DE ERROS AMIGÁVEL
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // 🔥 CORRIGIDO: mesmo problema do login/page.jsx - localStorage direto
    // (risco de travar no Safari/iPad) e chave "theme" divergente da
    // usada no resto do app ("poker-theme"). Ver ThemeContext.jsx.
    const savedTheme = safeGetItem("poker-theme", "dark");
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // 🔥 INTERCEPTAR ERROS DE FETCH PARA NÃO APARECER NO CONSOLE
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      // 🔥 CORRIGIDO: o filtro antigo dependia da string literal
      // "POST http://localhost:3000/api/register", que nunca corresponde
      // em produção (domínio diferente). Agora verifica todos os
      // argumentos e usa padrões que funcionam em qualquer domínio.
      const combined = args
        .map((a) => (typeof a === "string" ? a : ""))
        .join(" ");

      const isExpectedRegisterNoise =
        combined.includes("400") ||
        combined.includes("Bad Request") ||
        combined.includes("/api/register");

      if (isExpectedRegisterNoise) {
        console.info("📝 Registro tratado:", combined || args[0]);
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
    safeSetItem("poker-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("❌ As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("❌ A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (username.length < 3) {
      setError("❌ O usuário deve ter pelo menos 3 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 🔥 TRATAR COMO MENSAGEM AMIGÁVEL
        if (data.error?.includes("já existe")) {
          console.info(
            `📝 Tentativa de registro: "${username}" - Usuário já existe`,
          );
          setError("❌ Este usuário já está registrado. Tente outro nome.");
        } else {
          console.info(
            `📝 Tentativa de registro: "${username}" - ${data.error || "Erro"}`,
          );
          setError(`❌ ${data.error || "Erro ao registrar"}`);
        }
        setLoading(false);
        return;
      }

      console.info(`✅ Registro bem-sucedido: ${username}`);
      setSuccess("✅ Conta criada com sucesso! Redirecionando...");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      // 🔥 EVITAR LOG DE ERRO DESNECESSÁRIO
      console.info("📝 Erro de conexão no registro");
      setError("❌ Erro de conexão. Tente novamente.");
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
          <h1 className="auth-title">Registrar</h1>
          <p className="auth-subtitle">Crie sua conta para jogar</p>
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
              placeholder="Escolha um nome de usuário"
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
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Confirmar Senha</label>
            <input
              type="password"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
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

          {success && (
            <motion.div
              style={{
                background: "rgba(76,175,80,0.12)",
                border: "1px solid #4caf50",
                borderRadius: 15,
                padding: "10px 15px",
                color: "#4caf50",
                textAlign: "center",
                fontSize: "0.9rem",
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {success}
            </motion.div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "⏳ Criando conta..." : "🚀 Criar Conta"}
          </button>
        </form>

        <div className="auth-footer">
          Já tem uma conta?{" "}
          <Link href="/login" className="auth-link">
            Faça login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

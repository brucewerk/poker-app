// app/login/page.jsx
"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Monitora a sessão e redireciona quando autenticado
  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("✅ Sessão ativa, redirecionando...");
      window.location.href = "/";
    }
  }, [status, session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: "/",
      });

      console.log("📡 Resultado do login:", result);

      if (result?.error) {
        setError("Usuário ou senha inválidos");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        console.log("✅ Login bem-sucedido!");
        // 🔥 Força redirecionamento imediato
        window.location.href = "/";
      } else {
        setError("Erro ao fazer login. Tente novamente.");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Erro ao fazer login:", error);
      setError("Erro de conexão. Verifique o servidor.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        fontFamily: "'Segoe UI','Poppins',system-ui,sans-serif",
      }}
    >
      <div
        style={{
          background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
          padding: "40px",
          borderRadius: 30,
          maxWidth: 400,
          width: "100%",
          border: "2px solid gold",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: "4rem" }}>♠️</div>
          <h1 style={{ color: "gold", margin: "10px 0 5px", fontSize: "2rem" }}>
            Poker App
          </h1>
          <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
            Faça login para continuar
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(244,67,54,0.15)",
              border: "1px solid #f44336",
              borderRadius: 15,
              padding: "10px 15px",
              color: "#f44336",
              marginBottom: 20,
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label
              style={{
                color: "#ffefb9",
                fontSize: "0.9rem",
                fontWeight: "bold",
                display: "block",
                marginBottom: 5,
              }}
            >
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 15px",
                borderRadius: 15,
                border: "1px solid rgba(255,215,0,0.3)",
                background: "rgba(0,0,0,0.3)",
                color: "white",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              placeholder="Digite seu usuário"
              required
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                color: "#ffefb9",
                fontSize: "0.9rem",
                fontWeight: "bold",
                display: "block",
                marginBottom: 5,
              }}
            >
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 15px",
                borderRadius: 15,
                border: "1px solid rgba(255,215,0,0.3)",
                background: "rgba(0,0,0,0.3)",
                color: "white",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading
                ? "rgba(255,255,255,0.1)"
                : "radial-gradient(#f7d97c,#d6a12e)",
              border: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              padding: "14px 30px",
              borderRadius: 60,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 0 #7a4c1a",
              color: loading ? "#666" : "#2e241f",
              width: "100%",
              opacity: loading ? 0.5 : 1,
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "⏳ Entrando..." : "🎯 Entrar"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link
            href="/register"
            style={{
              color: "#aaa",
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Não tem conta? <span style={{ color: "gold" }}>Cadastre-se</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

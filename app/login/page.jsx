// app/login/page.jsx - CORREÇÃO DO ERRO DE LOGIN
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        // 🔥 MENSAGEM AMIGÁVEL PARA USUÁRIO INEXISTENTE
        setError("❌ Usuário ou senha incorretos. Tente novamente.");
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (err) {
      setError("❌ Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle()}>
      <div style={cardStyle()}>
        <h1 style={titleStyle()}>🃏 Poker App</h1>
        <p style={subtitleStyle()}>Faça login para jogar</p>

        <form onSubmit={handleSubmit} style={formStyle()}>
          <div style={inputGroupStyle()}>
            <label style={labelStyle()}>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle()}
              placeholder="Digite seu usuário"
              required
              disabled={loading}
            />
          </div>

          <div style={inputGroupStyle()}>
            <label style={labelStyle()}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle()}
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </div>

          {error && <div style={errorStyle()}>{error}</div>}

          <button type="submit" style={buttonStyle(loading)} disabled={loading}>
            {loading ? "⏳ Entrando..." : "🎯 Entrar"}
          </button>
        </form>

        <p style={registerStyle()}>
          Não tem uma conta? <a href="/register">Registre-se</a>
        </p>
      </div>
    </div>
  );
}

// ====================== ESTILOS ======================
function containerStyle() {
  return {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
    padding: "20px",
  };
}

function cardStyle() {
  return {
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "40px",
    borderRadius: "30px",
    maxWidth: "400px",
    width: "100%",
    color: "white",
    border: "2px solid gold",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  };
}

function titleStyle() {
  return {
    textAlign: "center",
    color: "gold",
    fontSize: "2rem",
    margin: "0 0 5px",
  };
}

function subtitleStyle() {
  return {
    textAlign: "center",
    color: "#aaa",
    marginBottom: "30px",
  };
}

function formStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };
}

function inputGroupStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  };
}

function labelStyle() {
  return {
    color: "#ffefb9",
    fontSize: "0.9rem",
    fontWeight: "bold",
  };
}

function inputStyle() {
  return {
    padding: "12px 15px",
    borderRadius: "15px",
    border: "1px solid rgba(255,215,0,0.3)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: "1rem",
    outline: "none",
    transition: "border-color 0.3s ease",
  };
}

function errorStyle() {
  return {
    padding: "10px",
    background: "rgba(244,67,54,0.15)",
    border: "1px solid #f44336",
    borderRadius: "10px",
    color: "#f44336",
    textAlign: "center",
    fontSize: "0.9rem",
  };
}

function buttonStyle(loading) {
  return {
    background: loading ? "#666" : "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "1rem",
    padding: "12px",
    borderRadius: "60px",
    cursor: loading ? "not-allowed" : "pointer",
    boxShadow: loading ? "none" : "0 4px 0 #7a4c1a",
    color: loading ? "#888" : "#2e241f",
    opacity: loading ? 0.5 : 1,
    transition: "all 0.3s ease",
  };
}

function registerStyle() {
  return {
    textAlign: "center",
    color: "#888",
    marginTop: "20px",
    fontSize: "0.9rem",
  };
}

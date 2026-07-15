// app/register/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
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

      if (data.success) {
        console.log("✅ Usuário registrado com sucesso!");
        router.push("/login");
      } else {
        setError(data.error || "Erro ao criar conta");
      }
    } catch (error) {
      console.error("Erro ao registrar:", error);
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
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
          <div style={{ fontSize: "4rem" }}>🃏</div>
          <h1 style={{ color: "gold", margin: "10px 0 5px", fontSize: "2rem" }}>
            Criar Conta
          </h1>
          <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
            Comece a jogar poker agora!
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
              placeholder="Escolha um usuário"
              required
              disabled={loading}
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
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
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              placeholder="Digite a senha novamente"
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
            {loading ? "⏳ Criando..." : "🎯 Criar Conta"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link
            href="/login"
            style={{
              color: "#aaa",
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Já tem conta? <span style={{ color: "gold" }}>Faça login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

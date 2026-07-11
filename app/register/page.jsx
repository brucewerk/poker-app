// app/register/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (form.password.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("✅ Cadastro realizado! Faça login.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Erro no cadastro");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor");
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
      }}
    >
      <div
        style={{
          background: "linear-gradient(145deg,#2a6e3a,#0a4122)",
          padding: "40px 50px",
          borderRadius: 50,
          textAlign: "center",
          color: "#ffefb9",
          boxShadow: "0 0 50px rgba(0,0,0,0.5)",
          border: "2px solid gold",
          maxWidth: 400,
          width: "100%",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: "2rem" }}>🎴 CADASTRO 🎴</h2>
        <p style={{ marginBottom: 20 }}>Crie sua conta e comece a jogar:</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usuário (3-20 caracteres)"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            style={{
              padding: "12px 20px",
              fontSize: "1rem",
              borderRadius: 50,
              border: "none",
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: 12,
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <input
            type="password"
            placeholder="Senha (mínimo 4 caracteres)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={{
              padding: "12px 20px",
              fontSize: "1rem",
              borderRadius: 50,
              border: "none",
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: 12,
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <input
            type="password"
            placeholder="Confirmar senha"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            required
            style={{
              padding: "12px 20px",
              fontSize: "1rem",
              borderRadius: 50,
              border: "none",
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: 20,
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "radial-gradient(#f7d97c,#d6a12e)",
              border: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              padding: "12px 30px",
              borderRadius: 60,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 0 #7a4c1a",
              color: "#2e241f",
              width: "100%",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "CADASTRANDO..." : "CADASTRAR"}
          </button>
        </form>

        {error && (
          <div
            style={{
              color: "#ff8888",
              fontSize: "0.9rem",
              marginTop: 15,
              background: "rgba(255,0,0,0.1)",
              padding: "10px",
              borderRadius: 30,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              color: "#88ff88",
              fontSize: "0.9rem",
              marginTop: 15,
              background: "rgba(0,255,0,0.1)",
              padding: "10px",
              borderRadius: 30,
            }}
          >
            {success}
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: "0.9rem" }}>
          Já tem conta?{" "}
          <Link
            href="/login"
            style={{ color: "#ffd700", textDecoration: "none" }}
          >
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}

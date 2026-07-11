// app/login/page.jsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Usuário ou senha inválidos");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError("Erro ao fazer login");
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
        <h2 style={{ margin: "0 0 20px", fontSize: "2rem" }}>
          🎴 TEXAS HOLD'EM 🎴
        </h2>
        <p style={{ marginBottom: 20 }}>Faça login para jogar:</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usuário"
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
            placeholder="Senha"
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
            {loading ? "ENTRANDO..." : "ENTRAR"}
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

        <div style={{ marginTop: 20, fontSize: "0.9rem" }}>
          Não tem conta?{" "}
          <Link
            href="/register"
            style={{ color: "#ffd700", textDecoration: "none" }}
          >
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}

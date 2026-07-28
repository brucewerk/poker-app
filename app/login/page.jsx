// app/login/page.jsx - CORRIGIDO COM TEMA
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🃏 Poker App</h1>
        <p className="auth-subtitle">Faça login para jogar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
              placeholder="Digite seu usuário"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "⏳ Entrando..." : "🎯 Entrar"}
          </button>
        </form>

        <p className="auth-footer">
          Não tem uma conta?{" "}
          <Link href="/register" className="auth-link">
            Registre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

// app/register/page.jsx - CORRIGIDO COM TEMA
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🃏</div>
          <h1 className="auth-title">Criar Conta</h1>
          <p className="auth-subtitle">Comece a jogar poker agora!</p>
        </div>

        {error && <div className="auth-error">❌ {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
              placeholder="Escolha um usuário"
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
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              placeholder="Digite a senha novamente"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "⏳ Criando..." : "🎯 Criar Conta"}
          </button>
        </form>

        <div className="auth-footer">
          <Link href="/login" className="auth-link">
            Já tem conta?{" "}
            <span className="auth-link-highlight">Faça login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

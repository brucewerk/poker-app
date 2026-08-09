// app/error.jsx - Error Boundary da rota principal
//
// 🔥 NOVO: o app nunca teve NENHUM error boundary. Isso significa que
// qualquer erro não tratado durante a renderização (um clique em
// localStorage bloqueado pelo Safari em modo privado/ITP, uma resposta
// inesperada de uma API, um valor undefined não esperado, etc.) derrubava
// a árvore inteira do React silenciosamente - o usuário via só o fundo
// (CSS) da página, sem nenhuma mensagem, sem nenhum jeito de se
// recuperar sem fechar e reabrir o app manualmente. Isso é exatamente o
// sintoma relatado no iPad ("só um fundo verde").
//
// Esta é a convenção oficial do Next.js App Router: qualquer arquivo
// "error.jsx" dentro de app/ é automaticamente usado como Error Boundary
// para aquele segmento de rota e tudo abaixo dele. Precisa ser um Client
// Component.
"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Loga o erro real para conseguirmos diagnosticar problemas futuros
    // (ex: abrir o console remoto do Safari conectado a um Mac via cabo)
    console.error("💥 Erro capturado pelo Error Boundary:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary, #0a2f1f)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Segoe UI', 'Poppins', system-ui, sans-serif",
        color: "#ffffff",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,215,0,0.25)",
          borderRadius: "24px",
          padding: "clamp(20px, 5vh, 36px) clamp(18px, 5vw, 32px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: "clamp(2.4rem, 8vh, 3.4rem)", marginBottom: 10 }}>
          🃏💥
        </div>
        <h1
          style={{
            fontSize: "clamp(1.1rem, 4vh, 1.5rem)",
            fontWeight: 800,
            color: "#ffd700",
            margin: "0 0 10px",
          }}
        >
          Ops! Algo deu errado.
        </h1>
        <p
          style={{
            fontSize: "clamp(0.8rem, 2.4vh, 0.95rem)",
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.5,
            margin: "0 0 22px",
          }}
        >
          A mesa travou por um instante. Toque no botão abaixo para tentar
          novamente - suas fichas e seu progresso estão salvos com
          segurança.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: "linear-gradient(145deg, #ffd700, #d6a12e)",
            border: "none",
            color: "#2e241f",
            fontWeight: 800,
            fontSize: "clamp(0.85rem, 2.4vh, 1rem)",
            padding: "clamp(10px, 2.2vh, 14px) clamp(20px, 6vw, 32px)",
            borderRadius: "40px",
            cursor: "pointer",
            boxShadow: "0 4px 0 #7a4c1a",
            width: "100%",
            marginBottom: "10px",
          }}
        >
          🔄 Tentar novamente
        </button>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)",
            fontWeight: 600,
            fontSize: "clamp(0.75rem, 2vh, 0.85rem)",
            padding: "clamp(8px, 1.8vh, 11px) 20px",
            borderRadius: "40px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          🏠 Voltar ao início
        </button>
      </div>
    </div>
  );
}

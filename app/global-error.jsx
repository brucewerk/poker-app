// app/global-error.jsx - Error Boundary do layout raiz
//
// Cobre o caso (mais raro) de um erro acontecer no próprio app/layout.js
// ou nos providers, fora do alcance do app/error.jsx. Precisa renderizar
// suas próprias tags <html>/<body> pois substitui o layout raiz inteiro
// quando ativado.
"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("💥 Erro crítico no layout raiz:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0a2f1f",
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
            padding: "28px 24px",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 10 }}>🃏💥</div>
          <h1
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              color: "#ffd700",
              margin: "0 0 10px",
            }}
          >
            Não foi possível carregar o app
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.5,
              margin: "0 0 22px",
            }}
          >
            Tente recarregar a página. Se o problema continuar, verifique
            sua conexão com a internet ou tente novamente em alguns
            instantes.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "linear-gradient(145deg, #ffd700, #d6a12e)",
              border: "none",
              color: "#2e241f",
              fontWeight: 800,
              fontSize: "1rem",
              padding: "12px 28px",
              borderRadius: "40px",
              cursor: "pointer",
              boxShadow: "0 4px 0 #7a4c1a",
              width: "100%",
            }}
          >
            🔄 Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}

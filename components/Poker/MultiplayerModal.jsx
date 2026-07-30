// components/Poker/MultiplayerModal.jsx - COMPLETO COM CORREÇÃO DE TEMA CLARO
"use client";

import { useState } from "react";

export default function MultiplayerModal({ onStart, onClose }) {
  const [player1Name, setPlayer1Name] = useState("Jogador 1");
  const [player2Name, setPlayer2Name] = useState("Jogador 2");

  const handleStart = () => {
    onStart({
      players: [
        { name: player1Name || "Jogador 1", chips: 0 }, // 🔥 Usará fichas do usuário logado
        { name: player2Name || "Jogador 2", chips: 1000 },
      ],
    });
  };

  return (
    <div style={overlayStyle()}>
      <div style={modalStyle()}>
        <button onClick={onClose} style={closeButtonStyle()}>
          ✕
        </button>

        <h2 style={titleStyle()}>👥 MODO 2 JOGADORES</h2>
        <p style={subtitleStyle()}>Configure os nomes dos jogadores:</p>

        <div style={formStyle()}>
          <div style={inputGroupStyle()}>
            <label style={labelStyle()}>Jogador 1:</label>
            <input
              type="text"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              style={inputStyle()}
              placeholder="Nome do Jogador 1"
            />
          </div>

          <div style={inputGroupStyle()}>
            <label style={labelStyle()}>Jogador 2:</label>
            <input
              type="text"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              style={inputStyle()}
              placeholder="Nome do Jogador 2"
            />
          </div>
        </div>

        <div style={infoStyle()}>
          <p style={infoTitleStyle()}>📌 Como funciona:</p>
          <ul style={listStyle()}>
            <li>Os jogadores alternam turnos</li>
            <li>Cada um vê suas cartas</li>
            <li>O jogo alterna automaticamente</li>
            <li>As fichas são compartilhadas</li>
          </ul>
        </div>

        <button onClick={handleStart} style={buttonStyle()}>
          🎮 INICIAR PARTIDA
        </button>
      </div>
    </div>
  );
}

// ====================== ESTILOS ======================
function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: 20,
  };
}

function modalStyle() {
  return {
    background: "var(--bg-modal)",
    padding: "30px 40px",
    borderRadius: 30,
    maxWidth: 450,
    width: "100%",
    color: "var(--text-primary)",
    border: "2px solid var(--border-gold)",
    position: "relative",
    transition: "var(--transition-theme)",
  };
}

function closeButtonStyle() {
  return {
    position: "absolute",
    top: 15,
    right: 20,
    background: "none",
    border: "none",
    color: "var(--text-primary)",
    fontSize: "1.5rem",
    cursor: "pointer",
    transition: "var(--transition-theme)",
  };
}

function titleStyle() {
  return {
    textAlign: "center",
    color: "var(--text-primary)",
    margin: "0 0 5px",
    fontSize: "1.8rem",
    transition: "var(--transition-theme)",
  };
}

function subtitleStyle() {
  return {
    textAlign: "center",
    color: "var(--text-muted)",
    marginBottom: "20px",
    fontSize: "0.9rem",
    transition: "var(--transition-theme)",
  };
}

function formStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginBottom: "20px",
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
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    fontWeight: "bold",
    transition: "var(--transition-theme)",
  };
}

function inputStyle() {
  return {
    padding: "10px 15px",
    borderRadius: 15,
    border: "1px solid var(--border-input)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: "1rem",
    transition: "var(--transition-theme)",
  };
}

function infoStyle() {
  return {
    background: "rgba(255,215,0,0.05)",
    padding: "15px",
    borderRadius: 15,
    marginBottom: "20px",
    border: "1px solid rgba(255,215,0,0.1)",
  };
}

function infoTitleStyle() {
  return {
    color: "var(--text-primary)",
    margin: "0 0 8px 0",
    fontWeight: "bold",
    transition: "var(--transition-theme)",
  };
}

function listStyle() {
  return {
    color: "var(--text-secondary)",
    fontSize: "0.85rem",
    paddingLeft: "20px",
    margin: "5px 0",
    transition: "var(--transition-theme)",
  };
}

function buttonStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "1rem",
    padding: "12px 30px",
    borderRadius: 60,
    cursor: "pointer",
    boxShadow: "0 4px 0 #7a4c1a",
    color: "#2e241f",
    width: "100%",
    transition: "all 0.3s ease",
  };
}

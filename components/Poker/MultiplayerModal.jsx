// components/Poker/MultiplayerModal.jsx
"use client";

import { useState } from "react";

export default function MultiplayerModal({ onStart, onClose }) {
  const [player1Name, setPlayer1Name] = useState("Jogador 1");
  const [player2Name, setPlayer2Name] = useState("Jogador 2");

  const handleStart = () => {
    onStart({
      players: [
        { name: player1Name || "Jogador 1", chips: 1000 },
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
          <p>📌 Como funciona:</p>
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
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "30px 40px",
    borderRadius: 30,
    maxWidth: 450,
    width: "100%",
    color: "white",
    border: "2px solid gold",
    position: "relative",
  };
}

function closeButtonStyle() {
  return {
    position: "absolute",
    top: 15,
    right: 20,
    background: "none",
    border: "none",
    color: "white",
    fontSize: "1.5rem",
    cursor: "pointer",
  };
}

function titleStyle() {
  return {
    textAlign: "center",
    color: "gold",
    margin: "0 0 5px",
    fontSize: "1.8rem",
  };
}

function subtitleStyle() {
  return {
    textAlign: "center",
    color: "#aaa",
    marginBottom: "20px",
    fontSize: "0.9rem",
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
    color: "#ffefb9",
    fontSize: "0.9rem",
    fontWeight: "bold",
  };
}

function inputStyle() {
  return {
    padding: "10px 15px",
    borderRadius: 15,
    border: "1px solid rgba(255,215,0,0.3)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: "1rem",
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

function listStyle() {
  return {
    color: "#ccc",
    fontSize: "0.85rem",
    paddingLeft: "20px",
    margin: "5px 0",
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
  };
}

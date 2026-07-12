// components/Poker/FindingsModal.jsx
"use client";

import { useState, useEffect } from "react";
import { FINDINGS } from "@/lib/findings";

export default function FindingsModal({ onClose, newFindings = [] }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    try {
      const res = await fetch("/api/get-level");
      const data = await res.json();
      if (data.success) {
        setFindings(data.findings || []);
      }
    } catch (error) {
      console.error("Erro ao carregar achados:", error);
    } finally {
      setLoading(false);
    }
  };

  const allFindings = Object.values(FINDINGS);
  const unlockedIds = findings.map((f) => f.id);

  if (loading) {
    return (
      <div style={overlayStyle()}>
        <div style={modalStyle()}>
          <h2 style={titleStyle()}>🏅 ACHADOS</h2>
          <p style={{ textAlign: "center", color: "#aaa" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle()}>
      <div style={modalStyle()}>
        <button onClick={onClose} style={closeButtonStyle()}>
          ✕
        </button>

        <h2 style={titleStyle()}>🏅 ACHADOS</h2>
        <p style={subtitleStyle()}>
          Descubra todos os achados escondidos no jogo!
        </p>

        {newFindings.length > 0 && (
          <div style={newFindingsStyle()}>
            <h3>🎉 Novos Achados!</h3>
            <div style={newFindingsListStyle()}>
              {newFindings.map((f, i) => (
                <div key={i} style={newFindingItemStyle()}>
                  <span style={findingIconStyle()}>{f.icon || "🏅"}</span>
                  <div>
                    <div style={findingNameStyle(true)}>{f.name}</div>
                    <div style={findingDescStyle()}>{f.description}</div>
                    <div style={findingXpStyle()}>+{f.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={progressStyle()}>
          <span style={{ color: "#ddd" }}>
            Progresso: {unlockedIds.length}/{allFindings.length}
          </span>
          <div style={progressBarStyle()}>
            <div
              style={{
                ...progressFillStyle(),
                width: `${(unlockedIds.length / allFindings.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div style={findingsListStyle()}>
          {allFindings.map((f) => {
            const unlocked = unlockedIds.includes(f.id);
            return (
              <div key={f.id} style={findingItemStyle(unlocked)}>
                <span style={findingIconStyle()}>
                  {unlocked ? f.icon || "✅" : "🔒"}
                </span>
                <div style={findingContentStyle()}>
                  <div style={findingNameStyle(unlocked)}>
                    {f.name}
                    {unlocked && " ✅"}
                  </div>
                  <div style={findingDescStyle()}>{f.description}</div>
                  <div style={findingXpStyle()}>
                    {unlocked ? `+${f.xp} XP (desbloqueado)` : `+${f.xp} XP`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} style={buttonStyle()}>
          FECHAR
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
    zIndex: 1002,
    padding: 20,
  };
}

function modalStyle() {
  return {
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "30px 35px",
    borderRadius: 30,
    maxWidth: 550,
    width: "100%",
    maxHeight: "80vh",
    overflowY: "auto",
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

function progressStyle() {
  return {
    marginBottom: "20px",
    padding: "10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 10,
  };
}

function progressBarStyle() {
  return {
    width: "100%",
    height: "8px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    marginTop: "5px",
    overflow: "hidden",
  };
}

function progressFillStyle() {
  return {
    height: "100%",
    background: "linear-gradient(90deg, #4caf50, gold)",
    borderRadius: 10,
    transition: "width 0.5s ease",
  };
}

function findingsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
  };
}

function findingItemStyle(unlocked) {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 15px",
    borderRadius: 10,
    background: unlocked ? "rgba(76,175,80,0.1)" : "rgba(255,255,255,0.03)",
    border: unlocked
      ? "1px solid rgba(76,175,80,0.3)"
      : "1px solid rgba(255,255,255,0.05)",
    opacity: unlocked ? 1 : 0.6,
  };
}

function findingIconStyle() {
  return {
    fontSize: "1.5rem",
    minWidth: "40px",
    textAlign: "center",
  };
}

function findingContentStyle() {
  return {
    flex: 1,
  };
}

function findingNameStyle(unlocked) {
  return {
    fontWeight: "bold",
    color: unlocked ? "#4caf50" : "#aaa",
    fontSize: "0.95rem",
  };
}

function findingDescStyle() {
  return {
    fontSize: "0.8rem",
    color: "#ccc",
    marginTop: "2px",
  };
}

function findingXpStyle() {
  return {
    fontSize: "0.7rem",
    color: "gold",
    marginTop: "2px",
  };
}

function newFindingsStyle() {
  return {
    background: "rgba(255,215,0,0.12)",
    padding: "15px",
    borderRadius: 15,
    marginBottom: "20px",
    border: "2px solid gold",
    animation: "pulse 2s ease-in-out infinite",
  };
}

function newFindingsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
  };
}

function newFindingItemStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 8,
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

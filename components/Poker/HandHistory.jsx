// components/Poker/HandHistory.jsx
"use client";

import { useState, useEffect } from "react";

export default function HandHistory({ username }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      const res = await fetch(
        `/api/get-hand-history?username=${encodeURIComponent(username)}`,
      );
      const data = await res.json();

      if (data.success) {
        setHistory(data.handHistory || []);
      } else {
        // ✅ Se a API não existir, usa dados vazios
        console.log("ℹ️ API de histórico não disponível, usando dados vazios");
        setHistory([]);
      }
    } catch (error) {
      // ✅ Em caso de erro, usa dados vazios
      console.log("ℹ️ Erro ao carregar histórico, usando dados vazios");
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [username]);

  if (loading) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>📜 HISTÓRICO</h3>
        <p style={emptyStyle()}>Carregando histórico...</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div style={panelStyle()}>
        <div style={headerStyle()}>
          <h3 style={titleStyle()}>📜 HISTÓRICO</h3>
          <button
            onClick={fetchHistory}
            style={refreshButtonStyle()}
            disabled={refreshing}
          >
            🔄
          </button>
        </div>
        <p style={emptyStyle()}>Nenhuma mão jogada ainda.</p>
        <p style={subEmptyStyle()}>
          Jogue algumas mãos para ver seu histórico aqui!
        </p>
      </div>
    );
  }

  return (
    <div style={panelStyle()}>
      <div style={headerStyle()}>
        <h3 style={titleStyle()}>📜 HISTÓRICO</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={fetchHistory}
            style={refreshButtonStyle()}
            disabled={refreshing}
          >
            {refreshing ? "⏳" : "🔄"}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={toggleButtonStyle()}
          >
            {showHistory ? "▲" : "▼"} ({history.length})
          </button>
        </div>
      </div>

      {showHistory && (
        <div style={historyListStyle()}>
          {history.slice(0, 5).map((hand, index) => (
            <div key={index} style={handItemStyle(hand.result)}>
              <div style={handResultStyle(hand.result)}>
                {hand.result === "win"
                  ? "🏆"
                  : hand.result === "loss"
                    ? "💔"
                    : "🤝"}
              </div>
              <div style={handDetailStyle()}>
                <div style={handInfoStyle()}>
                  <span style={resultLabelStyle(hand.result)}>
                    {hand.result === "win"
                      ? "Vitória"
                      : hand.result === "loss"
                        ? "Derrota"
                        : "Empate"}
                  </span>
                  <span style={handChipsStyle(hand.result)}>
                    {hand.result === "win"
                      ? `+${hand.chipsWon || 0}`
                      : hand.result === "loss"
                        ? `-${hand.chipsLost || 0}`
                        : `+${hand.split || 0}`}
                  </span>
                </div>
                <div style={handCardsStyle()}>
                  <span>Você: {hand.playerHand || "???"}</span>
                  <span>CPU: {hand.cpuHand || "???"}</span>
                </div>
                <div style={handTimeStyle()}>
                  {hand.timestamp
                    ? new Date(hand.timestamp).toLocaleTimeString()
                    : "Agora"}
                </div>
              </div>
            </div>
          ))}
          {history.length > 5 && (
            <div style={moreStyle()}>
              + {history.length - 5} mãos anteriores
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ====================== ESTILOS ======================
function panelStyle() {
  return {
    background: "#1a2a1ecc",
    backdropFilter: "blur(4px)",
    borderRadius: 20,
    padding: 15,
    marginTop: 10,
    color: "white",
    border: "1px solid rgba(255,215,0,0.2)",
  };
}

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: "0 0 10px",
    fontSize: "1rem",
  };
}

function toggleButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "gold",
    fontSize: "1rem",
    cursor: "pointer",
    padding: "4px 8px",
  };
}

function refreshButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "1rem",
    cursor: "pointer",
    padding: "4px 8px",
    transition: "all 0.3s ease",
  };
}

function emptyStyle() {
  return {
    textAlign: "center",
    color: "#888",
    padding: "10px 0",
    fontSize: "0.85rem",
  };
}

function subEmptyStyle() {
  return {
    textAlign: "center",
    color: "#666",
    fontSize: "0.75rem",
    marginTop: "-5px",
  };
}

function historyListStyle() {
  return {
    maxHeight: "300px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };
}

function handItemStyle(result) {
  const colors = {
    win: "rgba(76,175,80,0.15)",
    loss: "rgba(244,67,54,0.15)",
    tie: "rgba(255,193,7,0.15)",
  };
  return {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    borderRadius: 10,
    background: colors[result] || "rgba(255,255,255,0.05)",
    border: `1px solid ${colors[result] || "rgba(255,255,255,0.05)"}`,
  };
}

function handResultStyle(result) {
  return {
    fontSize: "1.5rem",
    minWidth: "35px",
    textAlign: "center",
  };
}

function handDetailStyle() {
  return {
    flex: 1,
  };
}

function handInfoStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
}

function resultLabelStyle(result) {
  const colors = {
    win: "#4caf50",
    loss: "#f44336",
    tie: "#ffc107",
  };
  return {
    fontWeight: "bold",
    color: colors[result] || "#fff",
    fontSize: "0.85rem",
  };
}

function handChipsStyle(result) {
  const colors = {
    win: "#4caf50",
    loss: "#f44336",
    tie: "#ffc107",
  };
  return {
    fontWeight: "bold",
    color: colors[result] || "#fff",
    fontSize: "0.85rem",
  };
}

function handCardsStyle() {
  return {
    display: "flex",
    gap: "15px",
    fontSize: "0.75rem",
    color: "#aaa",
    marginTop: "2px",
  };
}

function handTimeStyle() {
  return {
    fontSize: "0.65rem",
    color: "#666",
    marginTop: "2px",
  };
}

function moreStyle() {
  return {
    textAlign: "center",
    fontSize: "0.75rem",
    color: "#888",
    padding: "5px 0",
  };
}

// components/Poker/HandHistory.jsx - CORRIGIDO (SEM DUPLICAÇÃO)
"use client";

import { useState, useEffect, useRef } from "react";

export default function HandHistory({ username, isResultModalOpen = false }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [total, setTotal] = useState(0);
  const [clearing, setClearing] = useState(false);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

  const fetchHistory = async (silent = false) => {
    if (!username || !mountedRef.current || isFetchingRef.current) return;

    // 🔥 EVITAR FETCH DUPLICADO NO MESMO SEGUNDO
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      console.log("⏳ Fetch muito rápido, ignorando...");
      return;
    }
    lastFetchRef.current = now;

    try {
      isFetchingRef.current = true;
      if (!silent) setLoading(true);

      const res = await fetch(
        `/api/get-hand-history?username=${encodeURIComponent(username)}&t=${Date.now()}`,
      );
      const data = await res.json();

      if (data.success && mountedRef.current) {
        // 🔥 GARANTIR QUE NÃO HÁ DUPLICATAS
        const historyData = data.history || [];

        // Remover duplicatas baseado em timestamp (se existir)
        const uniqueHistory = historyData.filter((hand, index, self) => {
          // Se tiver ID, usar ID
          if (hand.id) {
            return index === self.findIndex((h) => h.id === hand.id);
          }
          // Se não tiver ID, usar timestamp + resultado + pote como chave
          const key = `${hand.timestamp}_${hand.result}_${hand.pot}`;
          return (
            index ===
            self.findIndex((h) => `${h.timestamp}_${h.result}_${h.pot}` === key)
          );
        });

        setHistory(uniqueHistory);
        setTotal(uniqueHistory.length || 0);

        if (!silent) {
          console.log(
            `📜 [HISTORY] Carregadas ${uniqueHistory.length} partidas (total: ${data.total || 0})`,
          );
        }
      }
    } catch (error) {
      if (!silent) console.error("❌ Erro ao carregar histórico:", error);
    } finally {
      isFetchingRef.current = false;
      if (!silent && mountedRef.current) setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!username) return;

    if (
      !window.confirm(
        "⚠️ Tem certeza que deseja limpar todo o histórico de partidas?",
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      const res = await fetch("/api/clear-hand-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory([]);
        setTotal(0);
        alert("✅ Histórico limpo com sucesso!");
        // 🔥 RECARREGAR APÓS LIMPAR
        setTimeout(() => fetchHistory(false), 500);
      }
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      alert("❌ Erro ao limpar histórico");
    } finally {
      setClearing(false);
    }
  };

  // 🔥 EFETUAR FETCH INICIAL E CONFIGURAR INTERVALO
  useEffect(() => {
    mountedRef.current = true;

    if (username) {
      // 🔥 FETCH INICIAL (SEM SILÊNCIO)
      fetchHistory(false);

      // 🔥 CONFIGURAR INTERVALO (COM SILÊNCIO)
      intervalRef.current = setInterval(() => {
        if (isResultModalOpen) {
          console.log("🔍 [HISTORY] Pausado - Modal aberto");
          return;
        }
        if (username && mountedRef.current) {
          fetchHistory(true); // 🔥 TRUE = SILENCIOSO
        }
      }, 15000); // 🔥 15 SEGUNDOS EM VEZ DE 10
    } else {
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [username, isResultModalOpen]);

  // 🔥 RECARREGAR QUANDO O MODAL DE RESULTADO FECHAR
  useEffect(() => {
    if (!isResultModalOpen && username && mountedRef.current) {
      // 🔥 PEQUENO DELAY PARA EVITAR CONFLITOS
      const timer = setTimeout(() => {
        fetchHistory(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isResultModalOpen]);

  if (loading) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>📜 HISTÓRICO</h3>
        <p style={emptyStyle()}>Carregando...</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>📜 HISTÓRICO</h3>
        <p style={emptyStyle()}>Nenhuma partida registrada.</p>
      </div>
    );
  }

  return (
    <div style={panelStyle()}>
      <div style={headerStyle()}>
        <h3 style={titleStyle()}>📜 HISTÓRICO</h3>
        <div style={headerButtonsStyle()}>
          <span style={countStyle()}>{total} partidas</span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={toggleButtonStyle()}
          >
            {showHistory ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {showHistory && (
        <div style={historyListStyle()}>
          {history.map((hand, index) => {
            const isWin = hand.result === "win";
            const isTie = hand.result === "tie";
            const resultColor = isWin
              ? "#4caf50"
              : isTie
                ? "#ffc107"
                : "#f44336";
            const resultIcon = isWin ? "🏆" : isTie ? "🤝" : "💔";

            // 🔥 CHAVE ÚNICA PARA CADA ITEM
            const uniqueKey = hand.id
              ? `hand-${hand.id}`
              : `hand-${index}-${hand.timestamp || Date.now()}`;

            return (
              <div key={uniqueKey} style={historyItemStyle(isWin, isTie)}>
                <div style={historyHeaderStyle()}>
                  <span style={historyResultStyle(resultColor)}>
                    {resultIcon} {hand.result?.toUpperCase() || "—"}
                  </span>
                  <span style={historyHandStyle()}>
                    {hand.playerHand || "?"}
                  </span>
                </div>
                <div style={historyDetailStyle()}>
                  <span>💰 {hand.pot || 0}</span>
                  {hand.chipsWon > 0 && (
                    <span style={winAmountStyle()}>+{hand.chipsWon}</span>
                  )}
                  {hand.chipsLost > 0 && (
                    <span style={loseAmountStyle()}>-{hand.chipsLost}</span>
                  )}
                  <span style={historyTimeStyle()}>
                    {hand.timestamp
                      ? new Date(hand.timestamp).toLocaleString()
                      : ""}
                  </span>
                </div>
              </div>
            );
          })}

          {total > 10 && (
            <div style={moreStyle()}>+{total - 10} mais partidas</div>
          )}

          <button
            onClick={clearHistory}
            disabled={clearing}
            style={clearButtonStyle(clearing)}
          >
            {clearing ? "⏳" : "🗑️ Limpar histórico"}
          </button>
        </div>
      )}
    </div>
  );
}

// ====================== ESTILOS ======================
function panelStyle() {
  return {
    background: "var(--bg-panel)",
    backdropFilter: "blur(4px)",
    borderRadius: 20,
    padding: 15,
    marginTop: 10,
    color: "var(--text-primary)",
    border: "1px solid var(--border-gold)",
    transition: "var(--transition-theme)",
  };
}

function titleStyle() {
  return {
    color: "var(--text-primary)",
    margin: "0 0 10px",
    fontSize: "1rem",
    fontWeight: "700",
    borderBottom: "2px solid var(--border-gold)",
    paddingBottom: 8,
    transition: "var(--transition-theme)",
  };
}

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
}

function headerButtonsStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
}

function countStyle() {
  return {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    transition: "var(--transition-theme)",
  };
}

function toggleButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "gold",
    fontSize: "1rem",
    cursor: "pointer",
    padding: "0 5px",
  };
}

function emptyStyle() {
  return {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    padding: "10px 0",
    transition: "var(--transition-theme)",
  };
}

function historyListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "300px",
    overflowY: "auto",
  };
}

function historyItemStyle(isWin, isTie) {
  return {
    background: isWin
      ? "rgba(76,175,80,0.1)"
      : isTie
        ? "rgba(255,193,7,0.1)"
        : "rgba(244,67,54,0.1)",
    border: isWin
      ? "1px solid rgba(76,175,80,0.2)"
      : isTie
        ? "1px solid rgba(255,193,7,0.2)"
        : "1px solid rgba(244,67,54,0.2)",
    borderRadius: 8,
    padding: "6px 10px",
  };
}

function historyHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
}

function historyResultStyle(color) {
  return {
    fontWeight: "bold",
    fontSize: "0.75rem",
    color: color,
  };
}

function historyHandStyle() {
  return {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    transition: "var(--transition-theme)",
  };
}

function historyDetailStyle() {
  return {
    display: "flex",
    gap: "10px",
    fontSize: "0.65rem",
    color: "var(--text-muted)",
    marginTop: "2px",
    alignItems: "center",
    transition: "var(--transition-theme)",
  };
}

function winAmountStyle() {
  return {
    color: "#4caf50",
    fontWeight: "bold",
  };
}

function loseAmountStyle() {
  return {
    color: "#f44336",
    fontWeight: "bold",
  };
}

function historyTimeStyle() {
  return {
    marginLeft: "auto",
    color: "var(--text-muted)",
    fontSize: "0.6rem",
    transition: "var(--transition-theme)",
  };
}

function moreStyle() {
  return {
    textAlign: "center",
    fontSize: "0.65rem",
    color: "var(--text-muted)",
    padding: "4px",
    transition: "var(--transition-theme)",
  };
}

function clearButtonStyle(clearing) {
  return {
    background: clearing ? "#555" : "rgba(244,67,54,0.2)",
    border: clearing ? "none" : "1px solid rgba(244,67,54,0.3)",
    borderRadius: 15,
    padding: "4px 12px",
    color: clearing ? "#888" : "#f44336",
    fontSize: "0.7rem",
    cursor: clearing ? "not-allowed" : "pointer",
    marginTop: "8px",
    width: "100%",
    transition: "all 0.3s ease",
    opacity: clearing ? 0.5 : 1,
  };
}

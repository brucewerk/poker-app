// components/Poker/StatusPanel.jsx
"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function StatusPanel({
  stage,
  pot,
  currentBet,
  playerBet,
  cpuBet,
  nextRaise,
  notification,
  stageNames,
  gameStatus,
  winnerMsg,
  isTurbo,
}) {
  // 🔥 CORREÇÃO: Dados do status com keys únicas
  const statusItems = [
    {
      id: "stage",
      label: "🎯 Fase",
      value: stageNames?.[stage] || stage || "Aguardando",
    },
    { id: "pot", label: "💰 Pote", value: `$${pot || 0}` },
    { id: "bet", label: "📊 Aposta", value: `$${currentBet || 0}` },
    {
      id: "mode",
      label: "🚀 Modo",
      value: isTurbo ? "Turbo" : "Normal",
      color: isTurbo ? "#ff9800" : "#4caf50",
    },
  ];

  return (
    <motion.div
      style={panelStyle()}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 style={titleStyle()}>📊 STATUS</h3>

      <AnimatePresence>
        {notification?.visible && (
          <motion.div
            key="notification"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            style={{
              background: notification.isError
                ? "rgba(244,67,54,0.15)"
                : "rgba(76,175,80,0.15)",
              border: notification.isError
                ? "1px solid #f44336"
                : "1px solid #4caf50",
              borderRadius: 10,
              padding: "6px 10px",
              marginBottom: "8px",
              color: notification.isError ? "#f44336" : "#4caf50",
              fontSize: "0.8rem",
              textAlign: "center",
            }}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={statusGridStyle()}>
        {statusItems.map((item) => (
          <motion.div
            key={item.id} // 🔥 CHAVE ÚNICA!
            style={statusItemStyle()}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span style={statusLabelStyle()}>{item.label}</span>
            <motion.span
              key={`${item.id}-${item.value}`}
              style={statusValueStyle(item.color)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {item.value}
            </motion.span>
          </motion.div>
        ))}
      </div>

      <div style={betsStyle()}>
        <motion.span
          key={`playerBet-${playerBet}`}
          style={betStyle()}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          👤 Você: ${playerBet || 0}
        </motion.span>
        <motion.span
          key={`cpuBet-${cpuBet}`}
          style={betStyle()}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          🤖 CPU: ${cpuBet || 0}
        </motion.span>
        {nextRaise > 0 && (
          <span key="nextRaise" style={nextRaiseStyle()}>
            Próximo aumento: ${nextRaise}
          </span>
        )}
      </div>

      <AnimatePresence>
        {gameStatus && !winnerMsg && (
          <motion.div
            key="gameStatus"
            style={gameStatusStyle()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {gameStatus}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {winnerMsg && (
          <motion.div
            key="winnerMsg"
            style={{
              ...gameStatusStyle(),
              background: "rgba(255,215,0,0.15)",
              border: "1px solid gold",
              color: "gold",
              fontWeight: "bold",
            }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {winnerMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

function titleStyle() {
  return {
    color: "gold",
    margin: "0 0 10px",
    fontSize: "1rem",
  };
}

function statusGridStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  };
}

function statusItemStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    padding: "6px 8px",
    borderRadius: 10,
    textAlign: "center",
    cursor: "default",
  };
}

function statusLabelStyle() {
  return {
    display: "block",
    fontSize: "0.65rem",
    color: "#aaa",
    marginBottom: "2px",
  };
}

function statusValueStyle(color = "#fff") {
  return {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: color,
  };
}

function betsStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "8px",
    fontSize: "0.75rem",
    color: "#aaa",
    flexWrap: "wrap",
    gap: "4px",
  };
}

function betStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    padding: "2px 10px",
    borderRadius: 10,
    display: "inline-block",
  };
}

function nextRaiseStyle() {
  return {
    background: "rgba(255,215,0,0.1)",
    padding: "2px 10px",
    borderRadius: 10,
    color: "gold",
  };
}

function gameStatusStyle() {
  return {
    marginTop: "8px",
    padding: "6px 10px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    fontSize: "0.8rem",
    textAlign: "center",
    color: "#ffefb9",
  };
}

// components/Poker/StatusPanel.jsx - CORRIGIDO PARA REALTIME
"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function StatusPanel(props) {
  const {
    stage = "preflop",
    pot = 0,
    currentBet = 0,
    playerBet = 0,
    cpuBet = 0,
    nextRaise = 0,
    notification = { msg: "", isError: false, visible: false },
    stageNames = {},
    gameStatus = "",
    winnerMsg = "",
    isTurbo = false,
  } = props || {};
  
  // 🔥 FORÇAR RE-RENDER COM KEY
  const updateKey = `${stage}-${pot}-${currentBet}-${playerBet}-${cpuBet}-${isTurbo}`;
  
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
      key={updateKey}
      className="status-panel"
      style={{
        background: "var(--bg-panel)",
        backdropFilter: "blur(4px)",
        borderRadius: 20,
        padding: 15,
        marginTop: 10,
        color: "var(--text-primary)",
        border: "1px solid var(--border-gold)",
        transition: "var(--transition-theme)",
        boxShadow: "var(--shadow-dark)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3
        className="card-title"
        style={{
          color: "gold",
          margin: "0 0 10px",
          fontSize: "1rem",
          fontWeight: "700",
          borderBottom: "2px solid var(--border-gold)",
          paddingBottom: 8,
          transition: "var(--transition-theme)",
        }}
      >
        📊 STATUS
      </h3>

      <AnimatePresence>
        {notification?.visible && (
          <motion.div
            key="notification"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className={
              notification.isError
                ? "status-notification-error"
                : "status-notification"
            }
            style={{
              borderRadius: 10,
              padding: "6px 10px",
              marginBottom: "8px",
              fontSize: "0.8rem",
              textAlign: "center",
              transition: "var(--transition-theme)",
            }}
          >
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        {statusItems.map((item) => (
          <motion.div
            key={item.id}
            className="status-item"
            style={{
              background: "var(--bg-status-item)",
              padding: "6px 8px",
              borderRadius: 10,
              textAlign: "center",
              cursor: "default",
              border: "1px solid var(--border-light)",
              transition: "var(--transition-theme)",
            }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span
              className="status-label"
              style={{
                display: "block",
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                marginBottom: "2px",
                fontWeight: "600",
                transition: "var(--transition-theme)",
              }}
            >
              {item.label}
            </span>
            <motion.span
              key={`${item.id}-${item.value}`}
              className="status-value"
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: "700",
                color: item.color || "var(--text-primary)",
                transition: "var(--transition-theme)",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {item.value}
            </motion.span>
          </motion.div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          flexWrap: "wrap",
          gap: "6px",
          transition: "var(--transition-theme)",
        }}
      >
        <motion.span
          key={`playerBet-${playerBet}`}
          className="status-bet"
          style={{
            background: "var(--bg-status-item)",
            padding: "4px 12px",
            borderRadius: 12,
            display: "inline-block",
            border: "1px solid var(--border-light)",
            transition: "var(--transition-theme)",
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          👤 Você: ${playerBet || 0}
        </motion.span>
        <motion.span
          key={`cpuBet-${cpuBet}`}
          className="status-bet"
          style={{
            background: "var(--bg-status-item)",
            padding: "4px 12px",
            borderRadius: 12,
            display: "inline-block",
            border: "1px solid var(--border-light)",
            transition: "var(--transition-theme)",
            fontWeight: 600,
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          🤖 CPU: ${cpuBet || 0}
        </motion.span>
        {nextRaise > 0 && (
          <span
            key="nextRaise"
            style={{
              background: "var(--gold-dim)",
              padding: "4px 12px",
              borderRadius: 12,
              color: "gold",
              fontSize: "0.75rem",
              fontWeight: "700",
              transition: "var(--transition-theme)",
              textShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            Próximo aumento: ${nextRaise}
          </span>
        )}
      </div>

      <AnimatePresence>
        {gameStatus && !winnerMsg && (
          <motion.div
            key="gameStatus"
            className="status-game-status"
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 12,
              fontSize: "0.85rem",
              textAlign: "center",
              color: "var(--text-secondary)",
              transition: "var(--transition-theme)",
              border: "1px solid var(--border-light)",
              fontWeight: 600,
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
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
            className="status-winner-msg"
            style={{
              marginTop: "8px",
              padding: "6px 10px",
              background: "rgba(255,215,0,0.12)",
              borderRadius: 10,
              fontSize: "0.85rem",
              textAlign: "center",
              color: "gold",
              fontWeight: "700",
              border: "1px solid rgba(255,215,0,0.3)",
              transition: "var(--transition-theme)",
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
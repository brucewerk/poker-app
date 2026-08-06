// components/Poker/ActionButtons.jsx - FONTES MAIORES
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ActionButtons({
  disabled,
  canRaise,
  toCall,
  nextRaise,
  onFold,
  onCall,
  onRaise,
  onAllIn,
  onReset,
  onNewHand,
  playerMoney,
  isWaitingForNewHand,
  cpuAction,
}) {
  const [actionHistory, setActionHistory] = useState([]);

  const addActionToHistory = (action, amount = 0) => {
    const newAction = {
      action,
      amount,
      timestamp: Date.now(),
    };
    setActionHistory((prev) => [newAction, ...prev].slice(0, 5));
  };

  useEffect(() => {
    if (cpuAction) {
      addActionToHistory(cpuAction.action, cpuAction.amount);
    }
  }, [cpuAction]);

  const handleAction = (action, callback, amount = 0) => {
    if (action !== "new-hand" && action !== "reset" && disabled) {
      console.log(
        `🔍 [ActionButtons] Ação ${action} bloqueada - disabled=true`,
      );
      return;
    }
    if (!callback) {
      console.log(`🔍 [ActionButtons] Ação ${action} - callback não definido!`);
      return;
    }
    const actionName = action === "new-hand" ? "new-hand" : action;
    addActionToHistory(actionName, amount);
    callback();
  };

  const ActionHistory = () => {
    if (actionHistory.length === 0) return null;

    return (
      <div className="action-history">
        <span className="action-history-label">Últimas ações:</span>
        {actionHistory.map((item, index) => (
          <span
            key={index}
            className={`action-history-item action-history-item-${item.action}`}
          >
            {item.action.toUpperCase()}
            {item.amount > 0 && ` R$ ${item.amount}`}
          </span>
        ))}
      </div>
    );
  };

  // 🔥 SÓ MOSTRA O BOTÃO RENOVAR FICHAS QUANDO SEM FICHAS E ESPERANDO
  const showRenewChips = isWaitingForNewHand === true && playerMoney <= 0;

  // 🔥 DETERMINA SE OS BOTÕES ESTÃO DISPONÍVEIS
  const isGameActive = !isWaitingForNewHand && !disabled && playerMoney > 0;

  return (
    <div className="action-buttons-container">
      {/* 🔥 BOTÃO RENOVAR FICHAS - SÓ APARECE SEM FICHAS */}
      {showRenewChips && (
        <motion.button
          onClick={() => {
            console.log(
              `🔍 [ActionButtons] Clique RENOVAR FICHAS - playerMoney: ${playerMoney}`,
            );
            handleAction("reset", onReset);
          }}
          className="action-btn-reset"
          style={{
            width: "100%",
            marginBottom: "10px",
            padding: "14px 8px",
            background: "radial-gradient(#f7d97c, #d6a12e)",
            border: "none",
            borderRadius: "12px",
            fontWeight: "700",
            fontSize: "0.9rem",
            color: "#2e241f",
            boxShadow: "0 4px 0 #7a4c1a",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "all 0.2s ease",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span style={{ fontSize: "1.2rem" }}>🔄</span>
          RENOVAR FICHAS (1000)
        </motion.button>
      )}

      {/* 🔥 5 BOTÕES EM UMA LINHA - FONTES MAIORES */}
      <div
        className="action-buttons-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "6px",
          width: "100%",
        }}
      >
        {/* FOLD */}
        <button
          onClick={() => {
            console.log("🔍 [ActionButtons] Clique FOLD");
            handleAction("fold", onFold);
          }}
          disabled={!isGameActive}
          className="action-btn action-btn-fold"
          style={{
            padding: "6px 3px",
            fontSize: "clamp(0.55rem, 0.8rem, 0.85rem)",
            minHeight: "clamp(38px, 5.5vh, 50px)",
            borderRadius: "8px",
            border: "none",
            fontWeight: "700",
            cursor: !isGameActive ? "not-allowed" : "pointer",
            color: "#ffffff",
            boxShadow: "0 3px 0 rgba(0,0,0,0.25)",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            background: "linear-gradient(145deg, #ef5350, #c62828)",
            opacity: !isGameActive ? 0.4 : 1,
          }}
        >
          <span
            className="action-btn-icon"
            style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.1rem)" }}
          >
            🏳️
          </span>
          <span
            style={{
              fontSize: "clamp(0.45rem, 0.7vw, 0.7rem)",
              fontWeight: 800,
            }}
          >
            FOLD
          </span>
        </button>

        {/* CALL/CHECK */}
        <button
          onClick={() => {
            console.log(
              `🔍 [ActionButtons] Clique ${toCall <= 0 ? "CHECK" : "CALL"} - toCall: ${toCall}`,
            );
            handleAction(toCall <= 0 ? "check" : "call", onCall, toCall);
          }}
          disabled={!isGameActive}
          className={`action-btn ${toCall <= 0 ? "action-btn-check" : "action-btn-call"}`}
          style={{
            padding: "6px 3px",
            fontSize: "clamp(0.55rem, 0.8rem, 0.85rem)",
            minHeight: "clamp(38px, 5.5vh, 50px)",
            borderRadius: "8px",
            border: "none",
            fontWeight: "700",
            cursor: !isGameActive ? "not-allowed" : "pointer",
            color: "#ffffff",
            boxShadow: "0 3px 0 rgba(0,0,0,0.25)",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            background:
              toCall <= 0
                ? "linear-gradient(145deg, #42a5f5, #1565c0)"
                : "linear-gradient(145deg, #66bb6a, #2e7d32)",
            opacity: !isGameActive ? 0.4 : 1,
          }}
        >
          <span
            className="action-btn-icon"
            style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.1rem)" }}
          >
            {toCall <= 0 ? "✅" : "💰"}
          </span>
          <span
            style={{
              fontSize: "clamp(0.45rem, 0.7vw, 0.7rem)",
              fontWeight: 800,
            }}
          >
            {toCall <= 0 ? "CHECK" : `CALL ${toCall}`}
          </span>
        </button>

        {/* RAISE */}
        <button
          onClick={() => {
            console.log(
              `🔍 [ActionButtons] Clique RAISE - nextRaise: ${nextRaise}`,
            );
            handleAction("raise", onRaise, nextRaise);
          }}
          disabled={!isGameActive || !canRaise}
          className="action-btn action-btn-raise"
          style={{
            padding: "6px 3px",
            fontSize: "clamp(0.55rem, 0.8rem, 0.85rem)",
            minHeight: "clamp(38px, 5.5vh, 50px)",
            borderRadius: "8px",
            border: "none",
            fontWeight: "700",
            cursor: !isGameActive || !canRaise ? "not-allowed" : "pointer",
            color: "#ffffff",
            boxShadow: "0 3px 0 rgba(0,0,0,0.25)",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            background: "linear-gradient(145deg, #ffa726, #e65100)",
            opacity: !isGameActive || !canRaise ? 0.4 : 1,
          }}
        >
          <span
            className="action-btn-icon"
            style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.1rem)" }}
          >
            📈
          </span>
          <span
            style={{
              fontSize: "clamp(0.45rem, 0.7vw, 0.7rem)",
              fontWeight: 800,
            }}
          >
            RAISE {nextRaise}
          </span>
        </button>

        {/* ALL-IN */}
        <button
          onClick={() => {
            console.log("🔍 [ActionButtons] Clique ALL-IN");
            handleAction("all-in", onAllIn);
          }}
          disabled={!isGameActive}
          className="action-btn action-btn-allin"
          style={{
            padding: "6px 3px",
            fontSize: "clamp(0.55rem, 0.8rem, 0.85rem)",
            minHeight: "clamp(38px, 5.5vh, 50px)",
            borderRadius: "8px",
            border: "none",
            fontWeight: "700",
            cursor: !isGameActive ? "not-allowed" : "pointer",
            color: "#ffffff",
            boxShadow: "0 3px 0 rgba(0,0,0,0.25)",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            background: "linear-gradient(145deg, #ec407a, #880e4f)",
            opacity: !isGameActive ? 0.4 : 1,
          }}
        >
          <span
            className="action-btn-icon"
            style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.1rem)" }}
          >
            ⚡
          </span>
          <span
            style={{
              fontSize: "clamp(0.45rem, 0.7vw, 0.7rem)",
              fontWeight: 800,
            }}
          >
            ALL-IN
          </span>
        </button>

        {/* 🔥 NOVA MÃO */}
        <button
          onClick={() => {
            console.log("🔍 [ActionButtons] Clique NOVA MÃO");
            handleAction("new-hand", onNewHand);
          }}
          disabled={
            !onNewHand || isWaitingForNewHand === false || playerMoney <= 0
          }
          className="action-btn"
          style={{
            padding: "6px 3px",
            fontSize: "clamp(0.55rem, 0.8rem, 0.85rem)",
            minHeight: "clamp(38px, 5.5vh, 50px)",
            borderRadius: "8px",
            border: "none",
            fontWeight: "700",
            cursor:
              !onNewHand || isWaitingForNewHand === false || playerMoney <= 0
                ? "not-allowed"
                : "pointer",
            color: "#ffffff",
            boxShadow: "0 3px 0 rgba(0,0,0,0.25)",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            background: "linear-gradient(145deg, #78909c, #37474f)",
            opacity:
              !onNewHand || isWaitingForNewHand === false || playerMoney <= 0
                ? 0.4
                : 1,
          }}
        >
          <span
            className="action-btn-icon"
            style={{ fontSize: "clamp(0.8rem, 1.4vw, 1.1rem)" }}
          >
            🃏
          </span>
          <span
            style={{
              fontSize: "clamp(0.45rem, 0.7vw, 0.7rem)",
              fontWeight: 800,
            }}
          >
            NOVA
          </span>
        </button>
      </div>

      <ActionHistory />
    </div>
  );
}

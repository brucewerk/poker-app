// components/Poker/ActionButtons.jsx - VERSÃO FINAL COMPLETA
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
    // 🔥 SÓ BLOQUEIA SE FOR AÇÃO DE JOGO (NÃO BLOQUEIA NEW-HAND E RESET)
    if (action !== "new-hand" && action !== "reset" && disabled) {
      console.log(`🔍 [ActionButtons] Ação ${action} bloqueada - disabled=true`);
      return;
    }
    if (!callback) {
      console.log(`🔍 [ActionButtons] Ação ${action} - callback não definido!`);
      return;
    }
    // 🔥 Normalizar nome da ação para o histórico
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

  // 🔥 BOTÃO NOVA MÃO - SÓ APARECE QUANDO ESTÁ ESPERANDO E TEM FICHAS
  const showNewHand = isWaitingForNewHand === true && playerMoney > 0;
  
  // 🔥 BOTÃO RENOVAR FICHAS - SÓ APARECE QUANDO ESTÁ ESPERANDO E SEM FICHAS
  const showRenewChips = isWaitingForNewHand === true && playerMoney <= 0;

  return (
    <div className="action-buttons-container">
      {/* 🔥 BOTÃO RENOVAR FICHAS - SÓ APARECE SEM FICHAS */}
      {showRenewChips && (
        <motion.button
          onClick={() => {
            console.log(`🔍 [ActionButtons] Clique RENOVAR FICHAS - playerMoney: ${playerMoney}`);
            handleAction("reset", onReset);
          }}
          className="action-btn-reset"
          style={{
            width: "100%",
            marginBottom: "8px",
            padding: "10px 8px",
            background: "radial-gradient(#fbbf24, #d97706)",
            border: "none",
            borderRadius: "12px",
            fontWeight: "700",
            fontSize: "0.95rem",
            color: "#2e241f",
            boxShadow: "0 4px 0 #7a4c1a",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span style={{ fontSize: "1rem" }}>🔄</span>
          RENOVAR FICHAS (1000)
        </motion.button>
      )}

      {/* 🔥 BOTÕES DE AÇÃO - BLOQUEADOS SE disabled OU SEM FICHAS */}
      <div className="action-buttons-grid" style={{
        display: "grid",
        gridTemplateColumns: showNewHand ? "auto 1fr 1fr 1fr 1fr" : "repeat(4, 1fr)",
        gap: "3px",
      }}>
        {/* Botão NOVA MÃO antes do FOLD */}
        {showNewHand && (
          <button
            onClick={() => {
              console.log(`🔍 [ActionButtons] Clique NOVA MÃO - playerMoney: ${playerMoney}`);
              handleAction("new-hand", onNewHand);
            }}
            className="action-btn-reset"
            style={{
              minHeight: "28px",
              padding: "3px 6px",
              background: "radial-gradient(#fbbf24, #d97706)",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.8rem",
              color: "#2e241f",
              boxShadow: "0 3px 0 #7a4c1a",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: "0.85rem" }}>🃏</span>
            NOVA MÃO
          </button>
        )}

        {/* Botão FOLD */}
        <button
          onClick={() => {
            console.log("🔍 [ActionButtons] Clique FOLD");
            handleAction("fold", onFold);
          }}
          disabled={disabled || playerMoney <= 0 || isWaitingForNewHand}
          className="action-btn action-btn-fold"
          style={{
            minHeight: "28px",
            fontSize: "0.8rem",
            padding: "3px 6px",
          }}
        >
          <span className="action-btn-icon">🏳️</span>
          DESISTIR
        </button>

        <button
          onClick={() => {
            console.log(`🔍 [ActionButtons] Clique ${toCall <= 0 ? "CHECK" : "CALL"} - toCall: ${toCall}`);
            handleAction(toCall <= 0 ? "check" : "call", onCall, toCall);
          }}
          disabled={disabled || playerMoney <= 0 || isWaitingForNewHand}
          className={`action-btn ${toCall <= 0 ? "action-btn-check" : "action-btn-call"}`}
          style={{
            minHeight: "28px",
            fontSize: "0.8rem",
            padding: "3px 6px",
          }}
        >
          <span className="action-btn-icon">{toCall <= 0 ? "✅" : "💰"}</span>
          {toCall <= 0 ? "CHECK" : `PAGAR ${toCall}`}
        </button>

        <button
          onClick={() => {
            console.log(`🔍 [ActionButtons] Clique RAISE - nextRaise: ${nextRaise}`);
            handleAction("raise", onRaise, nextRaise);
          }}
          disabled={!canRaise || disabled || playerMoney <= 0 || isWaitingForNewHand}
          className="action-btn action-btn-raise"
          style={{
            minHeight: "28px",
            fontSize: "0.8rem",
            padding: "3px 6px",
          }}
        >
          <span className="action-btn-icon">📈</span>
          AUMENTAR {nextRaise}
        </button>

        <button
          onClick={() => {
            console.log("🔍 [ActionButtons] Clique ALL-IN");
            handleAction("all-in", onAllIn);
          }}
          disabled={disabled || playerMoney <= 0 || isWaitingForNewHand}
          className="action-btn action-btn-allin"
          style={{
            minHeight: "28px",
            fontSize: "0.8rem",
            padding: "3px 6px",
          }}
        >
          <span className="action-btn-icon">⚡</span>
          ALL-IN
        </button>
      </div>

      <ActionHistory />
    </div>
  );
}
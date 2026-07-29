// components/Poker/ActionButtons.jsx - COMPLETO COM TEMA
"use client";

import { useState, useEffect } from "react";

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
    if (disabled) return;
    addActionToHistory(action, amount);
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

  return (
    <div className="action-buttons-container">
      <div className="action-buttons-grid">
        {/* Botão FOLD */}
        <button
          onClick={() => handleAction("fold", onFold)}
          disabled={disabled}
          className="action-btn action-btn-fold"
        >
          <span className="action-btn-icon">🏳️</span>
          DESISTIR
        </button>

        {/* Botão CALL/CHECK */}
        <button
          onClick={() =>
            handleAction(toCall <= 0 ? "check" : "call", onCall, toCall)
          }
          disabled={disabled}
          className={`action-btn ${toCall <= 0 ? "action-btn-check" : "action-btn-call"}`}
        >
          <span className="action-btn-icon">{toCall <= 0 ? "✅" : "💰"}</span>
          {toCall <= 0 ? "CHECK" : `PAGAR ${toCall}`}
        </button>

        {/* Botão RAISE */}
        <button
          onClick={() => handleAction("raise", onRaise, nextRaise)}
          disabled={!canRaise || disabled}
          className="action-btn action-btn-raise"
        >
          <span className="action-btn-icon">📈</span>
          AUMENTAR {nextRaise}
        </button>

        {/* Botão ALL-IN */}
        <button
          onClick={() => handleAction("all-in", onAllIn)}
          disabled={disabled}
          className="action-btn action-btn-allin"
        >
          <span className="action-btn-icon">⚡</span>
          ALL-IN
        </button>
      </div>

      {/* Botão RESET */}
      <button
        onClick={() => handleAction("reset", onReset)}
        className="action-btn-reset"
      >
        🔄 RENOVAR FICHAS
      </button>

      {/* Histórico de ações */}
      <ActionHistory />
    </div>
  );
}

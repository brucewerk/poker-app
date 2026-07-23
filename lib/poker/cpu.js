// lib/poker/cpu.js - COM DECISÕES MEMOIZADAS
import { getHandRank, getHandName } from "./evaluation.js";
import { calculateHandStrength } from "./strength.js";

// ============================================================
// 🔥 CACHE PARA DECISÕES DA CPU
// ============================================================
const decisionCache = new Map();
const DECISION_CACHE_MAX = 500;

function getDecisionCacheKey(gameState) {
  const key = {
    stage: gameState.stage,
    pot: gameState.pot,
    currentBet: gameState.currentBet,
    cpuBet: gameState.cpuBet,
    cpuMoney: gameState.cpuMoney,
    playerBet: gameState.playerBet,
    playerMoney: gameState.playerMoney,
    communityLength: gameState.community?.length || 0,
    playerAllin: gameState.playerAllin,
    cpuAllin: gameState.cpuAllin,
    raiseCounter: gameState.raiseCounter,
  };
  return JSON.stringify(key);
}

function getCachedDecision(key) {
  if (decisionCache.has(key)) {
    return decisionCache.get(key);
  }
  return null;
}

function setCachedDecision(key, decision) {
  if (decisionCache.size >= DECISION_CACHE_MAX) {
    const firstKey = decisionCache.keys().next().value;
    decisionCache.delete(firstKey);
  }
  decisionCache.set(key, decision);
}

// ============================================================
// 🔥 FUNÇÃO PRINCIPAL DE DECISÃO
// ============================================================
export function getCpuDecision(
  gameState,
  advanceStage,
  showNotification,
  user,
) {
  const cacheKey = getDecisionCacheKey(gameState);
  const cached = getCachedDecision(cacheKey);

  if (cached) {
    return cached;
  }

  const decision = calculateCpuDecision(
    gameState,
    advanceStage,
    showNotification,
    user,
  );
  setCachedDecision(cacheKey, decision);

  return decision;
}

function calculateCpuDecision(gameState, advanceStage, showNotification, user) {
  const {
    cpuCards,
    community,
    pot,
    currentBet,
    cpuBet,
    cpuMoney,
    playerBet,
    playerAllin,
    stage,
    cpuAllin,
  } = gameState;

  // 🔥 SE JÁ ESTIVER ALL-IN, APENAS PAGAR OU DESISTIR
  if (cpuAllin) {
    return { ...gameState, waitingPlayer: true };
  }

  // 🔥 CALCULAR FORÇA DA MÃO
  const handStrength = calculateHandStrength(cpuCards, community);
  const handRank = getHandRank(cpuCards, community);
  const handName = getHandName(handRank);

  // 🔥 CALCULAR ODDS DO POTE
  const toCall = currentBet - cpuBet;
  const potOdds = pot > 0 ? toCall / (pot + toCall) : 0;

  // 🔥 AJUSTAR FORÇA COM BASE NA FASE
  let adjustedStrength = handStrength;
  if (stage === "preflop") {
    adjustedStrength = handStrength * 0.9 + 0.1;
  } else if (stage === "flop") {
    adjustedStrength = handStrength * 0.95 + 0.05;
  }

  // 🔥 FATOR DE AGRESSIVIDADE (VARIA PARA SIMULAR PERSONALIDADE)
  const aggression = 0.3 + Math.random() * 0.3;
  const callThreshold = 0.35 - aggression * 0.15;
  const raiseThreshold = 0.65 + aggression * 0.15;

  // 🔥 DECISÃO BASEADA NA FORÇA DA MÃO
  let action = "check";
  let amount = 0;

  // 🔥 SE O JOGADOR ESTIVER ALL-IN, CPU AVALIA SE PAGA
  if (playerAllin) {
    const willCall =
      adjustedStrength > 0.3 || toCall <= 50 || handStrength > 0.6;
    if (willCall && cpuMoney > 0) {
      const callAmount = Math.min(toCall, cpuMoney);
      action = "call";
      amount = callAmount;
    } else {
      action = "fold";
    }
    const result = executeAction(
      action,
      amount,
      gameState,
      showNotification,
      user,
    );
    return result;
  }

  // 🔥 DECISÃO NORMAL
  if (toCall === 0) {
    // Check ou Raise
    if (adjustedStrength > raiseThreshold && cpuMoney > 100) {
      const raiseAmount = Math.min(
        50 + Math.floor(Math.random() * 100),
        cpuMoney,
      );
      action = "raise";
      amount = currentBet + raiseAmount;
    } else {
      action = "check";
    }
  } else if (adjustedStrength > raiseThreshold && cpuMoney > toCall + 100) {
    // Raise
    const raiseAmount = Math.min(
      50 + Math.floor(Math.random() * 150),
      cpuMoney - toCall,
    );
    action = "raise";
    amount = currentBet + raiseAmount;
  } else if (adjustedStrength > callThreshold || toCall <= 25) {
    // Call
    const callAmount = Math.min(toCall, cpuMoney);
    action = "call";
    amount = callAmount;
  } else if (adjustedStrength < 0.15 && Math.random() < 0.15) {
    // Blefe (15% de chance)
    const bluffAmount = Math.min(
      50 + Math.floor(Math.random() * 100),
      cpuMoney,
    );
    action = "raise";
    amount = currentBet + bluffAmount;
  } else {
    // Fold
    action = "fold";
  }

  // 🔥 SE A CPU NÃO TIVER DINHEIRO SUFICIENTE PARA PAGAR
  if (action === "call" && amount > cpuMoney) {
    amount = cpuMoney;
  }

  if (action === "raise" && amount > cpuMoney) {
    if (cpuMoney > currentBet) {
      amount = cpuMoney;
      action = "call";
    } else {
      action = "fold";
    }
  }

  const result = executeAction(
    action,
    amount,
    gameState,
    showNotification,
    user,
  );
  return result;
}

function executeAction(action, amount, gameState, showNotification, user) {
  let state = { ...gameState };

  switch (action) {
    case "fold":
      state.handActive = false;
      state.playerMoney += state.pot;
      state.winnerMsg = "🤖 CPU DESISTIU! Você vence!";
      state.gameStatus = "CPU Fold";
      state.cpuThought = "🤖 CPU: 'Muito caro... Desisto.' 😞";
      showNotification(
        `🤖 CPU desistiu! Você ganhou ${state.pot} fichas!`,
        false,
      );
      break;

    case "check":
      state.cpuThought = "🤖 CPU: 'Vou ver o que sai...'";
      showNotification("🤖 CPU deu CHECK", false);
      state.waitingPlayer = true;
      break;

    case "call":
      if (amount > 0) {
        state.cpuMoney -= amount;
        state.cpuBet += amount;
        state.pot += amount;
        if (state.cpuMoney === 0) {
          state.cpuAllin = true;
          showNotification(`🤖 CPU pagou ${amount} e está ALL-IN!`, true);
        } else {
          showNotification(`🤖 CPU pagou ${amount} fichas`, false);
        }
        state.cpuThought = `🤖 CPU: 'Vou pagar ${amount}.'`;
      } else {
        state.cpuThought = "🤖 CPU: 'Vou ver.'";
        showNotification("🤖 CPU deu CHECK", false);
      }
      state.waitingPlayer = true;
      break;

    case "raise":
      const raiseAmount = amount - state.currentBet;
      state.cpuMoney -= raiseAmount;
      state.cpuBet += raiseAmount;
      state.pot += raiseAmount;
      state.currentBet = amount;
      state.raiseCounter++;
      if (state.cpuMoney === 0) {
        state.cpuAllin = true;
        showNotification(`🤖 CPU aumentou para ${amount} e está ALL-IN!`, true);
      } else {
        showNotification(`🤖 CPU aumentou para ${amount}!`, false);
      }
      state.cpuThought = `🤖 CPU: 'Vou aumentar para ${amount}.'`;
      state.waitingPlayer = true;
      break;
  }

  return state;
}

// ============================================================
// 🔥 FUNÇÃO PARA LIMPAR CACHE
// ============================================================
export function clearCpuCache() {
  decisionCache.clear();
  console.log("🧹 Cache de decisões da CPU limpo");
}

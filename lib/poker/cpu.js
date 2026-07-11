// lib/poker/cpu.js
import { calculateHandStrength } from "./strength.js";

/**
 * Calcula o valor de raise baseado na força da mão
 * @param {number} strength - Força da mão (0-1)
 * @param {number} potSize - Tamanho do pote
 * @param {number} currentBet - Aposta atual
 * @param {number} playerBet - Aposta do jogador
 * @param {number} raiseCounter - Contador de raises
 * @param {number} cpuMoney - Fichas da CPU
 * @returns {number}
 */
export function calculateRaiseAmount(
  strength,
  potSize,
  currentBet,
  playerBet,
  raiseCounter,
  cpuMoney,
) {
  let baseRaise = 50 + raiseCounter * 50;
  let potBasedRaise = Math.floor(potSize * 0.3);

  let multiplier = 0.7;
  if (strength > 0.9) multiplier = 2.5;
  else if (strength > 0.8) multiplier = 2.0;
  else if (strength > 0.7) multiplier = 1.5;
  else if (strength > 0.6) multiplier = 1.2;
  else if (strength > 0.5) multiplier = 0.9;

  let finalRaise = Math.max(baseRaise, Math.floor(potBasedRaise * multiplier));

  if (playerBet > 0 && strength > 0.65) {
    finalRaise = Math.max(finalRaise, Math.floor(currentBet * 1.5));
  }

  finalRaise = Math.ceil(finalRaise / 25) * 25;
  return Math.min(finalRaise, cpuMoney);
}

/**
 * Decide se a CPU deve ir all-in
 */
export function shouldGoAllIn(
  strength,
  toCall,
  potSize,
  cpuChipsLeft,
  bigBlind = 50,
) {
  if (strength > 0.92) return true;
  if (strength > 0.85 && potSize > 300) return true;
  const mRatio = cpuChipsLeft / (bigBlind * 1.5);
  if (strength > 0.65 && mRatio < 3) return true;
  if (strength > 0.35 && cpuChipsLeft < 150) return true;
  if (strength > 0.35 && cpuChipsLeft < 200 && Math.random() < 0.1) return true;
  if (toCall > 0 && toCall >= cpuChipsLeft && strength > 0.45) return true;
  return false;
}

/**
 * Decisão da CPU (call, raise, fold, check)
 */
export function getCpuDecision(state, advanceStage, showNotification, user) {
  let newState = { ...state };
  let toCall = Math.max(0, state.currentBet - state.cpuBet);

  if (state.cpuAllin) {
    newState.cpuThought = "🤖 CPU: 'Já estou all-in...'";
    if (state.playerBet === state.currentBet) {
      return advanceStage(newState, user);
    }
    return { ...newState, waitingPlayer: true };
  }

  const strength = calculateHandStrength(state.cpuCards, state.community);
  const bigBlind = 50;

  if (shouldGoAllIn(strength, toCall, state.pot, state.cpuMoney, bigBlind)) {
    const amount = state.cpuMoney;
    if (amount > 0) {
      newState.cpuMoney = 0;
      newState.cpuBet += amount;
      newState.pot += amount;
      if (newState.cpuBet > newState.currentBet) {
        newState.currentBet = newState.cpuBet;
        newState.raiseCounter++;
      }
      newState.cpuAllin = true;
      newState.cpuThought = "🤖 CPU: 'ALL-IN! Vamos ver!' 💀⚡";
      newState.gameStatus = `CPU ALL-IN de ${amount}!`;
      showNotification(`🤖⚡ CPU declarou ALL-IN de ${amount}!`, true);

      if (newState.playerBet === newState.currentBet || newState.playerAllin) {
        return advanceStage(newState, user);
      }
      return { ...newState, waitingPlayer: true };
    }
  }

  let shouldRaise = false;
  let raiseAmount = 0;

  if (toCall === 0 && strength > 0.55 && state.cpuMoney >= 50) {
    const chance = strength > 0.8 ? 0.85 : strength > 0.65 ? 0.6 : 0.35;
    if (Math.random() < chance) {
      shouldRaise = true;
      raiseAmount = calculateRaiseAmount(
        strength,
        state.pot,
        state.currentBet,
        state.playerBet,
        state.raiseCounter,
        state.cpuMoney,
      );
    }
  } else if (toCall > 0 && strength > 0.6 && state.cpuMoney >= 50) {
    const chance = strength > 0.85 ? 0.75 : strength > 0.7 ? 0.55 : 0.35;
    if (Math.random() < chance) {
      shouldRaise = true;
      raiseAmount = Math.max(
        calculateRaiseAmount(
          strength,
          state.pot,
          state.currentBet,
          state.playerBet,
          state.raiseCounter,
          state.cpuMoney,
        ),
        state.currentBet + 25,
      );
    }
  }

  if (shouldRaise && raiseAmount > 0) {
    const totalNeeded = state.currentBet - state.cpuBet + raiseAmount;
    if (totalNeeded <= state.cpuMoney) {
      newState.cpuMoney -= raiseAmount;
      newState.cpuBet += raiseAmount;
      newState.pot += raiseAmount;
      newState.currentBet = newState.cpuBet;
      newState.raiseCounter++;
      newState.cpuThought = `🤖 CPU: 'Vou aumentar para ${newState.currentBet}!' 📈`;
      newState.gameStatus = `CPU dá RAISE para ${newState.currentBet}!`;
      showNotification(`🤖 CPU AUMENTOU para ${newState.currentBet}!`, false);

      if (newState.playerBet === newState.currentBet || newState.playerAllin) {
        return advanceStage(newState, user);
      }
      return { ...newState, waitingPlayer: true };
    }
  }

  if (toCall > 0) {
    const callAmount = Math.min(toCall, state.cpuMoney);
    const potOdds = toCall / (state.pot + toCall);
    const adjustedStrength = strength * 0.7 + (1 - potOdds) * 0.3;
    const willCall =
      adjustedStrength > 0.35 ||
      callAmount <= 75 ||
      (strength > 0.4 && callAmount <= 150) ||
      strength > 0.65 ||
      (Math.random() < 0.2 && callAmount <= 100);

    if (willCall && state.cpuMoney > 0) {
      newState.cpuMoney -= callAmount;
      newState.cpuBet += callAmount;
      newState.pot += callAmount;

      if (newState.cpuMoney === 0) {
        newState.cpuAllin = true;
        newState.cpuThought = "🤖 CPU: 'Pago tudo! ALL-IN!' ⚡";
        showNotification(`🤖 CPU paga ${callAmount} e está ALL-IN!`, true);
      } else {
        newState.cpuThought = `🤖 CPU: 'Pago ${callAmount}.' 🎴`;
        showNotification(`🤖 CPU paga ${callAmount} fichas`, false);
      }
      newState.gameStatus = `CPU paga ${callAmount}`;

      if (
        newState.playerBet === newState.currentBet &&
        newState.cpuBet === newState.currentBet
      ) {
        return advanceStage(newState, user);
      }
      return { ...newState, waitingPlayer: true };
    } else {
      newState.handActive = false;
      newState.playerMoney += newState.pot;
      newState.winnerMsg = "🤖 CPU DESISTIU! Você vence!";
      newState.gameStatus = "CPU Fold";
      newState.cpuThought = "🤖 CPU: 'Muito caro... Desisto.' 😞";
      showNotification(
        `🤖 CPU desistiu! Você ganhou ${newState.pot} fichas!`,
        false,
      );
      return newState;
    }
  }

  if (toCall === 0) {
    newState.cpuThought = "🤖 CPU: 'Vou dar CHECK.' 🤔";
    newState.gameStatus = "CPU CHECK";
    showNotification("🤖 CPU deu CHECK", false);
    return advanceStage(newState, user);
  }

  return newState;
}

// lib/poker/cpu.js
import { calculateHandStrength } from "./strength.js";
import { getHandRank } from "./evaluation.js";

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

  // NOVA: Ajuste baseado em pot odds
  if (potSize > 500) {
    multiplier *= 1.1;
  }

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
  // NOVA: Análise mais sofisticada de all-in
  if (strength > 0.92) return true;
  if (strength > 0.85 && potSize > 300) return true;

  // NOVA: M-Ratio para análise de stack curta
  const mRatio = cpuChipsLeft / (bigBlind * 1.5);
  if (strength > 0.65 && mRatio < 3) return true;
  if (strength > 0.35 && cpuChipsLeft < 150) return true;
  if (strength > 0.35 && cpuChipsLeft < 200 && Math.random() < 0.1) return true;

  // NOVA: All-in como blefe em situações específicas
  if (strength > 0.45 && cpuChipsLeft < 300 && Math.random() < 0.15) {
    return true;
  }

  if (toCall > 0 && toCall >= cpuChipsLeft && strength > 0.45) return true;
  return false;
}

/**
 * NOVA: Calcula pot odds para decisões mais precisas
 */
function calculatePotOdds(toCall, potSize) {
  if (toCall === 0 || potSize === 0) return 0;
  return toCall / (potSize + toCall);
}

/**
 * NOVA: Avalia se a CPU deve blefar
 */
function shouldBluff(strength, potSize, cpuMoney, raiseCounter) {
  // Só blefa se tiver fichas suficientes
  if (cpuMoney < 100) return false;

  // Força da mão está no range de blefe (20-45%)
  if (strength < 0.2 || strength > 0.45) return false;

  // Chance de blefe baseada no tamanho do pote e histórico
  let bluffChance = 0.15;
  if (potSize > 300) bluffChance += 0.05;
  if (raiseCounter > 1) bluffChance += 0.05;

  // Mais agressivo quando está perdendo
  if (cpuMoney < 500) bluffChance += 0.1;

  return Math.random() < bluffChance;
}

/**
 * Decisão da CPU (call, raise, fold, check)
 * VERSÃO MELHORADA com mais estratégias
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

  // NOVA: Avaliar mão atual para decisões mais precisas
  const handEvaluation =
    state.community.length >= 3
      ? getHandRank(state.cpuCards, state.community)
      : null;

  // NOVA: Verificar se deve blefar
  const shouldBluffNow = shouldBluff(
    strength,
    state.pot,
    state.cpuMoney,
    state.raiseCounter,
  );

  // NOVA: Decisão baseada em pot odds
  const potOdds = calculatePotOdds(toCall, state.pot);
  const adjustedStrength = strength * 0.7 + (1 - potOdds) * 0.3;

  // Verificar all-in
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

      // Frases variadas para all-in
      const allInPhrases = [
        "🤖 CPU: 'ALL-IN! Vamos ver!' 💀⚡",
        "🤖 CPU: 'Tudo ou nada!' 🔥",
        "🤖 CPU: 'Vai que cola!' 🎯",
        "🤖 CPU: 'O destino decide!' ⚡",
      ];
      newState.cpuThought =
        allInPhrases[Math.floor(Math.random() * allInPhrases.length)];
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

  // NOVA: Decisão de raise com consideração de blefe
  if (toCall === 0) {
    // Pode dar check ou apostar
    if (shouldBluffNow) {
      shouldRaise = true;
      raiseAmount = calculateRaiseAmount(
        strength * 0.6, // Blefe com aposta menor
        state.pot,
        state.currentBet,
        state.playerBet,
        state.raiseCounter,
        state.cpuMoney,
      );
    } else if (strength > 0.55 && state.cpuMoney >= 50) {
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
    }
  } else if (toCall > 0 && state.cpuMoney >= 50) {
    // Com aposta do jogador
    if (shouldBluffNow && strength > 0.25) {
      shouldRaise = true;
      raiseAmount = Math.max(
        calculateRaiseAmount(
          strength * 0.5,
          state.pot,
          state.currentBet,
          state.playerBet,
          state.raiseCounter,
          state.cpuMoney,
        ),
        state.currentBet + 25,
      );
    } else if (strength > 0.6) {
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
  }

  if (shouldRaise && raiseAmount > 0) {
    const totalNeeded = state.currentBet - state.cpuBet + raiseAmount;
    if (totalNeeded <= state.cpuMoney) {
      newState.cpuMoney -= raiseAmount;
      newState.cpuBet += raiseAmount;
      newState.pot += raiseAmount;
      newState.currentBet = newState.cpuBet;
      newState.raiseCounter++;

      // Frases variadas para raise
      const raisePhrases = [
        `🤖 CPU: 'Vou aumentar para ${newState.currentBet}!' 📈`,
        `🤖 CPU: 'Sua vez, amigo!' 💪`,
        `🤖 CPU: 'Vamos elevar a aposta!' 🚀`,
        `🤖 CPU: 'Não vai ser fácil!' 😏`,
      ];
      newState.cpuThought =
        raisePhrases[Math.floor(Math.random() * raisePhrases.length)];
      newState.gameStatus = `CPU dá RAISE para ${newState.currentBet}!`;
      showNotification(`🤖 CPU AUMENTOU para ${newState.currentBet}!`, false);

      if (newState.playerBet === newState.currentBet || newState.playerAllin) {
        return advanceStage(newState, user);
      }
      return { ...newState, waitingPlayer: true };
    }
  }

  // NOVA: Decisão de call com análise de pot odds
  if (toCall > 0) {
    const callAmount = Math.min(toCall, state.cpuMoney);

    // NOVA: Análise mais precisa de call
    let willCall = false;

    // Call com mão forte
    if (strength > 0.65) {
      willCall = true;
    }
    // Call baseado em pot odds
    else if (adjustedStrength > 0.4) {
      willCall = true;
    }
    // Call por valor baixo
    else if (callAmount <= 75) {
      willCall = true;
    }
    // Call com draw bom (avaliado pela força com cartas comunitárias)
    else if (
      state.community.length >= 3 &&
      strength > 0.35 &&
      callAmount <= 150
    ) {
      willCall = true;
    }
    // Call com blefe (pequena chance)
    else if (Math.random() < 0.2 && callAmount <= 100) {
      willCall = true;
    }
    // NOVA: Call por desespero (poucas fichas)
    else if (state.cpuMoney < 200 && strength > 0.25) {
      willCall = true;
    }

    if (willCall && state.cpuMoney > 0) {
      newState.cpuMoney -= callAmount;
      newState.cpuBet += callAmount;
      newState.pot += callAmount;

      if (newState.cpuMoney === 0) {
        newState.cpuAllin = true;
        newState.cpuThought = "🤖 CPU: 'Pago tudo! ALL-IN!' ⚡";
        showNotification(`🤖 CPU paga ${callAmount} e está ALL-IN!`, true);
      } else {
        // Frases variadas para call
        const callPhrases = [
          `🤖 CPU: 'Pago ${callAmount}.' 🎴`,
          `🤖 CPU: 'Vamos ver o que você tem!' 👀`,
          `🤖 CPU: 'Aceito o desafio!' 🤝`,
          `🤖 CPU: 'Pago para ver!' 🃏`,
        ];
        newState.cpuThought =
          callPhrases[Math.floor(Math.random() * callPhrases.length)];
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

      // Frases variadas para fold
      const foldPhrases = [
        "🤖 CPU: 'Muito caro... Desisto.' 😞",
        "🤖 CPU: 'Dessa vez não dá.' 😐",
        "🤖 CPU: 'Melhor não arriscar.' 🤔",
        "🤖 CPU: 'Fico pra próxima.' 😅",
      ];
      newState.winnerMsg = "🤖 CPU DESISTIU! Você vence!";
      newState.gameStatus = "CPU Fold";
      newState.cpuThought =
        foldPhrases[Math.floor(Math.random() * foldPhrases.length)];
      showNotification(
        `🤖 CPU desistiu! Você ganhou ${newState.pot} fichas!`,
        false,
      );
      return newState;
    }
  }

  // Check
  if (toCall === 0) {
    const checkPhrases = [
      "🤖 CPU: 'Vou dar CHECK.' 🤔",
      "🤖 CPU: 'Deixa eu ver a próxima.' 🃏",
      "🤖 CPU: 'Check por enquanto.' 👀",
      "🤖 CPU: 'Vamos devagar.' 🐢",
    ];
    newState.cpuThought =
      checkPhrases[Math.floor(Math.random() * checkPhrases.length)];
    newState.gameStatus = "CPU CHECK";
    showNotification("🤖 CPU deu CHECK", false);
    return advanceStage(newState, user);
  }

  return newState;
}

/**
 * NOVA: Função para obter estatísticas da CPU
 */
export function getCPUStats(handHistory) {
  const stats = {
    totalHands: 0,
    wins: 0,
    folds: 0,
    raises: 0,
    allIns: 0,
    bluffSuccess: 0,
  };

  // Processar histórico se disponível
  if (handHistory && handHistory.length > 0) {
    // Implementar estatísticas baseadas no histórico
    stats.totalHands = handHistory.length;
  }

  return stats;
}

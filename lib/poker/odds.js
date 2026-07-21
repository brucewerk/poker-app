// lib/poker/odds.js

/**
 * Calcula as pot odds
 * @param {number} callAmount - Valor para pagar a aposta
 * @param {number} pot - Tamanho atual do pote
 * @returns {number} Pot odds como porcentagem
 */
export function calculatePotOdds(callAmount, pot) {
  if (callAmount === 0) return 0;
  if (pot === 0) return 1;
  return callAmount / (pot + callAmount);
}

/**
 * Calcula o valor esperado de uma ação
 * @param {number} winProbability - Probabilidade de vitória (0-1)
 * @param {number} pot - Tamanho do pote
 * @param {number} callAmount - Valor para pagar
 * @returns {number} Valor esperado
 */
export function calculateExpectedValue(winProbability, pot, callAmount) {
  const evWin = winProbability * (pot + callAmount);
  const evLose = (1 - winProbability) * callAmount;
  return evWin - evLose;
}

/**
 * Calcula a probabilidade de melhorar a mão
 * @param {Array} playerCards - Cartas do jogador
 * @param {Array} communityCards - Cartas comunitárias
 * @param {string} round - Rodada atual (preflop, flop, turn, river)
 * @returns {number} Probabilidade de melhorar
 */
export function calculateImprovementOdds(playerCards, communityCards, round) {
  const totalCards = 52;
  const usedCards = [...playerCards, ...communityCards];
  const remainingCards = totalCards - usedCards.length;

  // Calcular outs (cartas que melhoram a mão)
  const outs = countOuts(playerCards, communityCards);

  // Probabilidade baseada no número de cartas restantes
  const cardsToCome = getCardsToCome(round);
  let probability = 0;

  for (let i = 0; i < cardsToCome; i++) {
    probability += outs / (remainingCards - i);
  }

  return Math.min(probability, 1);
}

/**
 * Conta os outs (cartas que melhoram a mão)
 */
function countOuts(playerCards, communityCards) {
  const allCards = [...playerCards, ...communityCards];
  const suits = allCards.map((c) => c.suit);
  const ranks = allCards.map((c) => c.rank);

  let outs = 0;
  const suitCounts = {};
  suits.forEach((suit) => {
    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
  });

  // Flush draw outs
  for (const count of Object.values(suitCounts)) {
    if (count >= 4) {
      outs += 13 - count; // Cartas restantes do naipe
    }
  }

  // Straight draw outs
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
  if (uniqueRanks.length >= 3) {
    for (let i = 0; i < uniqueRanks.length - 2; i++) {
      const gap = uniqueRanks[i + 2] - uniqueRanks[i];
      if (gap <= 4) {
        outs += 4 - gap; // Cartas para completar o straight
      }
    }
  }

  return Math.min(outs, 20);
}

/**
 * Retorna quantas cartas ainda virão
 */
function getCardsToCome(round) {
  switch (round) {
    case "preflop":
      return 5;
    case "flop":
      return 2;
    case "turn":
      return 1;
    case "river":
      return 0;
    default:
      return 0;
  }
}

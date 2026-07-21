// lib/poker/strength.js
import { getHandRank } from "./evaluation.js";

/**
 * Calcula a força da mão baseada nas cartas da mão e comunitárias
 * @param {Array<{rank: number, suit: string}>} holeCards
 * @param {Array<{rank: number, suit: string}>} communityCards
 * @returns {number} Valor entre 0 e 1
 */
export function calculateHandStrength(holeCards, communityCards) {
  if (!holeCards || holeCards.length < 2) return 0.3;

  const high = Math.max(holeCards[0].rank, holeCards[1].rank);
  const isPair = holeCards[0].rank === holeCards[1].rank;
  const isSuited = holeCards[0].suit === holeCards[1].suit;

  // NOVO: Análise com cartas comunitárias mais precisa
  if (communityCards.length >= 3) {
    const handResult = getHandRank(holeCards, communityCards);
    const handType = Math.floor(handResult.score / 10 ** 10);

    // Mapeamento mais preciso de força por tipo de mão
    if (handType >= 8) return 0.99; // Royal Flush / Straight Flush
    if (handType >= 7) return 0.97; // Quadra
    if (handType >= 6) return 0.95; // Full House
    if (handType >= 5) return 0.9; // Flush
    if (handType >= 4) return 0.85; // Sequência
    if (handType >= 3) return 0.75; // Trinca
    if (handType >= 2) return 0.65; // Dois Pares

    // NOVO: Análise de draws (potencial de melhoria)
    if (communityCards.length < 5) {
      const drawStrength = calculateDrawStrength(holeCards, communityCards);
      return 0.3 + drawStrength * 0.4;
    }

    return 0.4; // Um Par
  }

  // Pré-flop: avalia apenas as duas cartas iniciais
  if (isPair) {
    if (high >= 13) return 0.96; // AA, KK
    if (high >= 12) return 0.9; // QQ
    if (high >= 11) return 0.85; // JJ
    if (high >= 10) return 0.8; // TT
    if (high >= 8) return 0.7; // 88, 99
    return 0.6; // Pares baixos
  }

  // NOVO: Ranking mais preciso para cartas altas
  const low = Math.min(holeCards[0].rank, holeCards[1].rank);

  // AK, AQ, AJ
  if (high === 14 && low >= 11) {
    if (isSuited) return 0.92;
    return 0.88;
  }
  if (high === 14 && low >= 10) {
    if (isSuited) return 0.85;
    return 0.8;
  }

  // KQ, KJ, K10
  if (high === 13 && low >= 11) {
    if (isSuited) return 0.82;
    return 0.78;
  }
  if (high === 13 && low >= 10) {
    if (isSuited) return 0.75;
    return 0.7;
  }

  // QJ, Q10
  if (high === 12 && low >= 10) {
    if (isSuited) return 0.72;
    return 0.65;
  }

  // Conectores altos (J10, 109, 98)
  if (high - low === 1 && high >= 10) {
    if (isSuited) return 0.68;
    return 0.6;
  }

  // Cartas médias
  if (high >= 10 && low >= 8) {
    if (isSuited) return 0.55;
    return 0.45;
  }

  // Cartas baixas
  return 0.35;
}

/**
 * NOVO: Calcula força de draws (potencial de melhoria)
 */
function calculateDrawStrength(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  const suits = allCards.map((c) => c.suit);
  const ranks = allCards.map((c) => c.rank);

  let drawStrength = 0;

  // Verificar flush draw
  const suitCounts = {};
  suits.forEach((suit) => {
    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
  });

  for (const count of Object.values(suitCounts)) {
    if (count === 4) drawStrength = Math.max(drawStrength, 0.8); // Flush draw
    if (count === 3 && communityCards.length < 3)
      drawStrength = Math.max(drawStrength, 0.4);
  }

  // Verificar straight draw
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
  if (uniqueRanks.length >= 3) {
    for (let i = 0; i < uniqueRanks.length - 2; i++) {
      if (uniqueRanks[i + 2] - uniqueRanks[i] <= 4) {
        drawStrength = Math.max(drawStrength, 0.7); // Open-ended straight draw
        break;
      }
      if (uniqueRanks[i + 2] - uniqueRanks[i] <= 5) {
        drawStrength = Math.max(drawStrength, 0.5); // Gutshot straight draw
        break;
      }
    }
  }

  return drawStrength;
}

/**
 * NOVO: Obtém descrição textual da força da mão
 */
export function getStrengthDescription(strength) {
  if (strength >= 0.95) return "Mão quase imbatível 🏆";
  if (strength >= 0.85) return "Mão muito forte 💪";
  if (strength >= 0.75) return "Mão forte 🔥";
  if (strength >= 0.65) return "Mão acima da média 📈";
  if (strength >= 0.5) return "Mão média 😐";
  if (strength >= 0.35) return "Mão fraca 😕";
  return "Mão muito fraca 😰";
}

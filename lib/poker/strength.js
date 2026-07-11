// lib/poker/strength.js

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

  // Se já tem cartas comunitárias, avalia a mão atual
  if (communityCards.length >= 3) {
    const handType = Math.floor(
      getHandRank(holeCards, communityCards) / 10 ** 10,
    );
    if (handType >= 7) return 0.98; // Full House ou melhor
    if (handType >= 5) return 0.92; // Straight ou melhor
    if (handType >= 4) return 0.85; // Trinca
    if (handType >= 3) return 0.7; // Dois Pares
    if (handType >= 2) return 0.55; // Um Par
    return 0.4; // Carta Alta
  }

  // Pré-flop: avalia apenas as duas cartas iniciais
  if (isPair) {
    if (high >= 13) return 0.96; // AA, KK
    if (high >= 12) return 0.9; // QQ
    if (high >= 10) return 0.8; // TT
    if (high >= 8) return 0.7; // 88, 99
    return 0.6; // Pares baixos
  }

  // Cartas altas (não par)
  if (high === 14 && Math.min(holeCards[0].rank, holeCards[1].rank) >= 12) {
    return 0.88; // AK, AQ
  }
  if (high >= 13 && Math.min(holeCards[0].rank, holeCards[1].rank) >= 12) {
    return 0.82; // KQ
  }
  if (high >= 12 && isSuited) return 0.78; // QJ suited
  if (high >= 12) return 0.7; // QJ offsuit
  if (high >= 10 && isSuited) return 0.65; // JT suited
  if (high >= 10) return 0.55; // JT offsuit
  if (high >= 8 && isSuited) return 0.5; // 98 suited
  return 0.35; // Cartas baixas
}

// Import necessário para a função acima
import { getHandRank } from "./evaluation.js";

// lib/poker/evaluation.js - CORRIGIDO PARA EMPATES
import { RANK_VALUES } from "./deck.js";

// 🔥 ORDEM DAS MÃOS (MAIOR = MELHOR)
const HAND_RANKINGS = {
  "Royal Flush": 10,
  "Straight Flush": 9,
  Quadra: 8,
  "Full House": 7,
  Flush: 6,
  Sequencia: 5,
  Trinca: 4,
  "Dois Pares": 3,
  "Um Par": 2,
  "Carta Alta": 1,
};

// 🔥 FUNÇÃO PARA OBTER VALOR NUMÉRICO DA CARTA
function getCardValue(card) {
  return card?.value || RANK_VALUES[card?.rank] || 0;
}

// 🔥 FUNÇÃO PARA OBTER O RANK DA CARTA (2, 3, 4, ..., A)
function getRankValue(card) {
  return getCardValue(card);
}

// 🔥 VERIFICAR SE É FLUSH (MESMO NAIPE)
function isFlush(cards) {
  const suits = cards.map((c) => c.suit);
  return suits.every((s) => s === suits[0]);
}

// 🔥 VERIFICAR SE É SEQUÊNCIA - CORRIGIDO
function isStraight(cards) {
  const values = cards.map((c) => getRankValue(c)).sort((a, b) => a - b);

  // Verificar sequência normal
  let consecutive = 1;
  for (let i = 1; i < values.length; i++) {
    if (values[i] === values[i - 1] + 1) {
      consecutive++;
      if (consecutive >= 5) return true;
    } else if (values[i] !== values[i - 1]) {
      consecutive = 1;
    }
  }

  // Verificar sequência baixa (A-2-3-4-5)
  if (
    values[0] === 2 &&
    values[1] === 3 &&
    values[2] === 4 &&
    values[3] === 5 &&
    values[values.length - 1] === 14
  ) {
    return true;
  }

  return false;
}

// 🔥 CONTAR OCORRÊNCIAS DE CADA RANK
function countRanks(cards) {
  const counts = {};
  cards.forEach((card) => {
    const value = getRankValue(card);
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

// 🔥 FUNÇÃO PRINCIPAL PARA AVALIAR A MÃO
export function getHandRank(playerCards, communityCards) {
  const allCards = [...playerCards, ...communityCards];

  if (allCards.length < 5) {
    return { rank: 0, name: "Carta Alta", score: 0 };
  }

  const combinations = getCombinations(allCards, 5);
  let bestScore = 0;
  let bestHandName = "Carta Alta";
  let bestHand = null;

  for (const combo of combinations) {
    const result = evaluateFiveCards(combo);
    if (result.score > bestScore) {
      bestScore = result.score;
      bestHandName = result.name;
      bestHand = result;
    }
  }

  return {
    rank: HAND_RANKINGS[bestHandName] || 1,
    name: bestHandName,
    score: bestScore,
    raw: bestScore,
    hand: bestHand,
  };
}

// 🔥 AVALIAR 5 CARTAS ESPECÍFICAS
function evaluateFiveCards(cards) {
  const flush = isFlush(cards);
  const straight = isStraight(cards);
  const rankCounts = countRanks(cards);
  const counts = Object.values(rankCounts);
  const ranks = Object.keys(rankCounts).map(Number);

  // ROYAL FLUSH
  if (flush && straight) {
    const values = cards.map((c) => getRankValue(c)).sort((a, b) => a - b);
    if (values[0] === 10 && values[4] === 14) {
      return { name: "Royal Flush", score: 9000000 };
    }
    return { name: "Straight Flush", score: 8000000 + Math.max(...ranks) };
  }

  // QUADRA
  if (counts.includes(4)) {
    const quadRank = Number(
      Object.keys(rankCounts).find((k) => rankCounts[k] === 4),
    );
    const kicker = Math.max(...ranks.filter((r) => r !== quadRank));
    return {
      name: "Quadra",
      score: 7000000 + quadRank * 100 + kicker,
    };
  }

  // FULL HOUSE
  if (counts.includes(3) && counts.includes(2)) {
    const threeRank = Number(
      Object.keys(rankCounts).find((k) => rankCounts[k] === 3),
    );
    const pairRank = Number(
      Object.keys(rankCounts).find((k) => rankCounts[k] === 2),
    );
    return { name: "Full House", score: 6000000 + threeRank * 100 + pairRank };
  }

  // FLUSH
  if (flush) {
    const values = cards.map((c) => getRankValue(c)).sort((a, b) => b - a);
    let score = 5000000;
    values.forEach((v, i) => {
      score += v * Math.pow(14, 4 - i);
    });
    return { name: "Flush", score };
  }

  // SEQUÊNCIA
  if (straight) {
    const values = cards.map((c) => getRankValue(c)).sort((a, b) => a - b);
    let high = values[4];
    // A-2-3-4-5
    if (values[0] === 2 && values[4] === 14 && values[3] === 5) {
      high = 5;
    }
    return { name: "Sequencia", score: 4000000 + high };
  }

  // TRINCA
  if (counts.includes(3)) {
    const threeRank = Number(
      Object.keys(rankCounts).find((k) => rankCounts[k] === 3),
    );
    const kickers = ranks.filter((r) => r !== threeRank).sort((a, b) => b - a);
    let score = 3000000 + threeRank * 100;
    kickers.forEach((k, i) => {
      score += k * Math.pow(14, 1 - i);
    });
    return { name: "Trinca", score };
  }

  // DOIS PARES
  if (counts.filter((c) => c === 2).length === 2) {
    const pairs = Object.keys(rankCounts)
      .filter((k) => rankCounts[k] === 2)
      .map(Number)
      .sort((a, b) => b - a);
    const kicker = ranks.filter((r) => rankCounts[r] === 1)[0] || 0;
    let score = 2000000 + pairs[0] * 10000 + pairs[1] * 100 + kicker;
    return { name: "Dois Pares", score };
  }

  // UM PAR
  if (counts.includes(2)) {
    const pairRank = Number(
      Object.keys(rankCounts).find((k) => rankCounts[k] === 2),
    );
    const kickers = ranks.filter((r) => r !== pairRank).sort((a, b) => b - a);
    let score = 1000000 + pairRank * 1000;
    kickers.forEach((k, i) => {
      score += k * Math.pow(14, 2 - i);
    });
    return { name: "Um Par", score };
  }

  // CARTA ALTA
  const values = cards.map((c) => getRankValue(c)).sort((a, b) => b - a);
  let score = values.reduce((acc, v, i) => acc + v * Math.pow(14, 4 - i), 0);
  return { name: "Carta Alta", score };
}

// 🔥 GERAR COMBINAÇÕES DE N ELEMENTOS
function getCombinations(arr, n) {
  if (n === 0) return [[]];
  if (arr.length === 0) return [];

  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, n - 1).map((c) => [first, ...c]);
  const withoutFirst = getCombinations(rest, n);

  return [...withFirst, ...withoutFirst];
}

// 🔥 FUNÇÃO PARA OBTER NOME DA MÃO
export function getHandName(handRank) {
  if (!handRank) return "Carta Alta";
  if (typeof handRank === "string") return handRank;
  return handRank.name || "Carta Alta";
}

// 🔥 FUNÇÃO PARA COMPARAR DUAS MÃOS - MELHORADA PARA EMPATES
export function compareHands(hand1, hand2) {
  const score1 = hand1?.score || 0;
  const score2 = hand2?.score || 0;

  if (score1 > score2) return 1;
  if (score1 < score2) return -1;
  return 0; // Empate
}

// 🔥 FUNÇÃO PARA VERIFICAR SE É EMPATE PERFEITO
export function isPerfectTie(hand1, hand2) {
  if (!hand1 || !hand2) return false;
  return hand1.score === hand2.score && hand1.name === hand2.name;
}

// lib/poker/evaluation.js - COM CACHE DE AVALIAÇÃO
import { getCardValue, getSuitSymbol } from "./utils.js";

// ============================================================
// 🔥 CACHE PARA AVALIAÇÃO DE MÃOS
// ============================================================
const handCache = new Map();
const CACHE_MAX_SIZE = 2000;
let cacheHits = 0;
let cacheMisses = 0;

function getCacheKey(playerCards, communityCards) {
  const pCards = [...playerCards].sort((a, b) => a.rank - b.rank);
  const cCards = [...communityCards].sort((a, b) => a.rank - b.rank);
  return `${pCards.map((c) => `${c.rank}${c.suit}`).join("|")}|${cCards.map((c) => `${c.rank}${c.suit}`).join("|")}`;
}

function getFromCache(key) {
  if (handCache.has(key)) {
    cacheHits++;
    return handCache.get(key);
  }
  cacheMisses++;
  return null;
}

function setInCache(key, value) {
  if (handCache.size >= CACHE_MAX_SIZE) {
    // Remover o mais antigo (primeiro da lista)
    const firstKey = handCache.keys().next().value;
    handCache.delete(firstKey);
  }
  handCache.set(key, value);
}

function getCacheStats() {
  const total = cacheHits + cacheMisses;
  return {
    size: handCache.size,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: total > 0 ? ((cacheHits / total) * 100).toFixed(1) + "%" : "0%",
  };
}

// ============================================================
// 🔥 FUNÇÕES DE AVALIAÇÃO (OTIMIZADAS)
// ============================================================

export function getHandRank(playerCards, communityCards) {
  const key = getCacheKey(playerCards, communityCards);
  const cached = getFromCache(key);

  if (cached) {
    return cached;
  }

  const result = calculateHandRank(playerCards, communityCards);
  setInCache(key, result);

  return result;
}

function calculateHandRank(playerCards, communityCards) {
  const allCards = [...playerCards, ...communityCards];
  const ranks = allCards.map((c) => c.rank).sort((a, b) => a - b);
  const suits = allCards.map((c) => c.suit);

  // Verificar flush
  const isFlush = suits.every((s, i, arr) => s === arr[0]);

  // Verificar straight
  let isStraight = false;
  const uniqueRanks = [...new Set(ranks)];
  if (uniqueRanks.length >= 5) {
    const sortedRanks = uniqueRanks.sort((a, b) => a - b);
    for (let i = 0; i <= sortedRanks.length - 5; i++) {
      if (sortedRanks[i + 4] - sortedRanks[i] === 4) {
        isStraight = true;
        break;
      }
    }
    // Verificar A-2-3-4-5
    if (
      sortedRanks.includes(14) &&
      sortedRanks.includes(2) &&
      sortedRanks.includes(3) &&
      sortedRanks.includes(4) &&
      sortedRanks.includes(5)
    ) {
      isStraight = true;
    }
  }

  // Contar frequências
  const counts = {};
  ranks.forEach((r) => {
    counts[r] = (counts[r] || 0) + 1;
  });
  const values = Object.values(counts);

  const isFour = values.includes(4);
  const isThree = values.includes(3);
  const pairs = values.filter((v) => v === 2).length;
  const isFullHouse = isThree && pairs === 1;
  const isTwoPair = pairs === 2;
  const isOnePair = pairs === 1;

  // Determinar o tipo da mão (score base)
  let score = 0;
  if (isFlush && isStraight) score = 9;
  else if (isFour) score = 8;
  else if (isFullHouse) score = 7;
  else if (isFlush) score = 6;
  else if (isStraight) score = 5;
  else if (isThree) score = 4;
  else if (isTwoPair) score = 3;
  else if (isOnePair) score = 2;
  else score = 1;

  // Calcular kickers para desempate
  const kickers = ranks.slice().sort((a, b) => b - a);
  const rankValue =
    score * 10 ** 10 + kickers.reduce((acc, r) => acc * 100 + r, 0);

  const handName = getHandName(score);

  return {
    score: rankValue,
    raw: score,
    name: handName,
    isFlush,
    isStraight,
    isFour,
    isFullHouse,
    isThree,
    pairs,
    isTwoPair,
    isOnePair,
    kickers,
  };
}

export function getHandName(handRank) {
  if (!handRank) return "Carta Alta";

  const score = typeof handRank === "object" ? handRank.raw : handRank;
  const names = [
    "",
    "Carta Alta",
    "Um Par",
    "Dois Pares",
    "Trinca",
    "Sequencia",
    "Flush",
    "Full House",
    "Quadra",
    "Straight Flush",
    "Royal Flush",
  ];
  return names[score] || "Carta Alta";
}

export function compareHands(hand1, hand2) {
  const score1 = typeof hand1 === "object" ? hand1.score : hand1;
  const score2 = typeof hand2 === "object" ? hand2.score : hand2;

  if (score1 > score2) return 1;
  if (score1 < score2) return -1;
  return 0;
}

export function getHandRankDescription(handRank) {
  const name = getHandName(handRank);
  const score = typeof handRank === "object" ? handRank.raw : handRank;
  const descriptions = {
    1: "Carta mais alta",
    2: "Um par",
    3: "Dois pares",
    4: "Três cartas iguais",
    5: "Sequência de cinco cartas",
    6: "Cinco cartas do mesmo naipe",
    7: "Três + Par",
    8: "Quatro cartas iguais",
    9: "Sequência do mesmo naipe",
    10: "A-10 do mesmo naipe",
  };
  return descriptions[score] || name;
}

// ============================================================
// 🔥 FUNÇÃO PARA LIMPAR CACHE (ÚTIL EM TESTES)
// ============================================================
export function clearHandCache() {
  handCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  console.log("🧹 Cache de mãos limpo");
}

export function getHandCacheStats() {
  return getCacheStats();
}

// lib/poker/evaluation.js

/**
 * Avalia 5 cartas e retorna um score numérico
 * @param {Array<{rank: number, suit: string}>} cards
 * @returns {number}
 */
export function evaluate5(cards) {
  const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);

  // Verifica flush
  const flush = suits.every((s) => s === suits[0]);

  // Verifica straight
  const uniqueRanks = [...new Set(ranks)];
  let straight = false;

  if (uniqueRanks.length === 5) {
    // Straight normal
    if (ranks[4] - ranks[0] === 4) {
      straight = true;
    }
    // Straight com Ás como 1 (A-2-3-4-5)
    if (
      ranks[0] === 2 &&
      ranks[1] === 3 &&
      ranks[2] === 4 &&
      ranks[3] === 5 &&
      ranks[4] === 14
    ) {
      straight = true;
    }
  }

  // Conta frequências
  const counts = {};
  ranks.forEach((r) => {
    counts[r] = (counts[r] || 0) + 1;
  });
  const values = Object.values(counts);

  // Determina o tipo de mão
  const isFour = values.includes(4);
  const isThree = values.includes(3);
  const pairs = values.filter((v) => v === 2).length;
  const isFullHouse = isThree && pairs === 1;
  const isTwoPair = pairs === 2;
  const isOnePair = pairs === 1;

  // Atribui score baseado no tipo
  let score = 0;
  if (flush && straight)
    score = 9; // Straight Flush
  else if (isFour)
    score = 8; // Quadra
  else if (isFullHouse)
    score = 7; // Full House
  else if (flush)
    score = 6; // Flush
  else if (straight)
    score = 5; // Straight
  else if (isThree)
    score = 4; // Trinca
  else if (isTwoPair)
    score = 3; // Dois Pares
  else if (isOnePair)
    score = 2; // Um Par
  else score = 1; // Carta Alta

  // Cria um valor único: tipo * 10^10 + kickers
  const kickers = ranks.slice().sort((a, b) => b - a);
  const kickerValue = kickers.reduce((acc, val) => acc * 100 + val, 0);

  return score * 10 ** 10 + kickerValue;
}

/**
 * Avalia a melhor mão de 5 cartas entre 2 cartas da mão e as comunitárias
 * @param {Array<{rank: number, suit: string}>} holeCards
 * @param {Array<{rank: number, suit: string}>} communityCards
 * @returns {number}
 */
export function getHandRank(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  let bestScore = 0;

  // Testa todas as combinações de 5 cartas
  for (let i = 0; i < allCards.length; i++) {
    for (let j = i + 1; j < allCards.length; j++) {
      for (let k = j + 1; k < allCards.length; k++) {
        for (let l = k + 1; l < allCards.length; l++) {
          for (let m = l + 1; m < allCards.length; m++) {
            const score = evaluate5([
              allCards[i],
              allCards[j],
              allCards[k],
              allCards[l],
              allCards[m],
            ]);
            if (score > bestScore) bestScore = score;
          }
        }
      }
    }
  }

  return bestScore;
}

/**
 * Retorna o nome da mão baseado no score
 * @param {number} score
 * @returns {string}
 */
export function getHandName(score) {
  const type = Math.floor(score / 10 ** 10);
  const names = [
    "",
    "Carta Alta",
    "Um Par",
    "Dois Pares",
    "Trinca",
    "Sequência",
    "Flush",
    "Full House",
    "Quadra",
    "Straight Flush",
  ];
  return names[type] || "Carta Alta";
}

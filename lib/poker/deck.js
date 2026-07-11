// lib/poker/deck.js

/**
 * Cria um baralho de 52 cartas embaralhado
 * @returns {Array<{rank: number, suit: string}>}
 */
export function createDeck() {
  const suits = ["♥", "♦", "♣", "♠"];
  const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  let deck = [];

  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ rank, suit });
    }
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Obtém a representação textual de uma carta
 * @param {{rank: number, suit: string}} card
 * @returns {string}
 */
export function getCardDisplay(card) {
  let rank = card.rank;
  if (rank === 11) rank = "J";
  else if (rank === 12) rank = "Q";
  else if (rank === 13) rank = "K";
  else if (rank === 14) rank = "A";
  return `${rank}${card.suit}`;
}

/**
 * Verifica se uma carta é vermelha
 * @param {{rank: number, suit: string}} card
 * @returns {boolean}
 */
export function isRedCard(card) {
  return card.suit === "♥" || card.suit === "♦";
}

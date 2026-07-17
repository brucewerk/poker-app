// lib/poker/deck.js

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

// 🔥 MAPEAMENTO PARA VALORES NUMÉRICOS (TEXAS HOLD'EM)
export const RANK_VALUES = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

// 🔥 MAPEAMENTO PARA NOMES LEGÍVEIS
export const RANK_NAMES = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  J: "Valete",
  Q: "Rainha",
  K: "Rei",
  A: "Ás",
};

export const SUIT_NAMES = {
  "♠": "Espadas",
  "♥": "Copas",
  "♦": "Ouros",
  "♣": "Paus",
};

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        rank,
        suit,
        value: RANK_VALUES[rank],
        displayName: `${RANK_NAMES[rank]} de ${SUIT_NAMES[suit]}`,
      });
    }
  }
  // Embaralhar
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 🔥 FUNÇÃO PARA OBTER NOME LEGÍVEL DA CARTA
export function getCardDisplayName(card) {
  if (!card) return "???";
  return `${RANK_NAMES[card.rank] || card.rank} de ${SUIT_NAMES[card.suit] || card.suit}`;
}

// 🔥 FUNÇÃO PARA OBTER VALOR DA CARTA
export function getCardValue(card) {
  return card?.value || RANK_VALUES[card?.rank] || 0;
}

// 🔥 FUNÇÃO PARA OBTER COR DA CARTA
export function getCardColor(card) {
  if (!card) return "black";
  return card.suit === "♥" || card.suit === "♦" ? "red" : "black";
}

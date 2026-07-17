// lib/findings.js
export const FINDINGS = {
  FIRST_HAND: {
    id: "first_hand",
    name: "🎴 Primeira Mão",
    description: "Jogue sua primeira mão",
    icon: "🎴",
    xp: 10,
    condition: (stats) => (stats?.handsPlayed || 0) >= 1,
  },
  TEN_HANDS: {
    id: "ten_hands",
    name: "🎯 10 Mãos",
    description: "Jogue 10 mãos",
    icon: "🎯",
    xp: 20,
    condition: (stats) => (stats?.handsPlayed || 0) >= 10,
  },
  FIRST_WIN: {
    id: "first_win",
    name: "🏆 Primeira Vitória",
    description: "Ganhe sua primeira mão",
    icon: "🏆",
    xp: 15,
    condition: (stats) => (stats?.handsWon || 0) >= 1,
  },
  FIVE_WINS: {
    id: "five_wins",
    name: "⭐ 5 Vitórias",
    description: "Ganhe 5 mãos",
    icon: "⭐",
    xp: 25,
    condition: (stats) => (stats?.handsWon || 0) >= 5,
  },
  // 🔥 FLUSH REMOVIDO
  // 🔥 SEQUENCIA REMOVIDA
  // 🔥 NOVO: 20 Mãos
  TWENTY_HANDS: {
    id: "twenty_hands_finding",
    name: "🎯 20 Mãos",
    description: "Jogue 20 mãos",
    icon: "🎯",
    xp: 30,
    condition: (stats) => (stats?.handsPlayed || 0) >= 20,
  },
  // 🔥 NOVO: 50 Mãos
  FIFTY_HANDS: {
    id: "fifty_hands_finding",
    name: "🎯 50 Mãos",
    description: "Jogue 50 mãos",
    icon: "🎯",
    xp: 40,
    condition: (stats) => (stats?.handsPlayed || 0) >= 50,
  },
  ALL_IN_WIN: {
    id: "all_in_win_finding",
    name: "⚡ All-in Vitorioso",
    description: "Ganhe com All-in",
    icon: "⚡",
    xp: 40,
    condition: (stats) => (stats?.allInWins || 0) >= 1,
  },
  // 🔥 NOVO: 10 Vitórias
  TEN_WINS: {
    id: "ten_wins",
    name: "🏆 10 Vitórias",
    description: "Ganhe 10 mãos",
    icon: "🏆",
    xp: 35,
    condition: (stats) => (stats?.handsWon || 0) >= 10,
  },
};

export function checkFindings(username, stats) {
  const unlocked = [];

  Object.values(FINDINGS).forEach((finding) => {
    if (finding.condition(stats)) {
      unlocked.push(finding);
    }
  });

  return unlocked;
}

export function getFindingById(id) {
  return Object.values(FINDINGS).find((f) => f.id === id);
}

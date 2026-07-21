// lib/findings.js - VERSÃO PREMIUM
export const FINDINGS = {
  // ========== ACHADOS INICIAIS ==========
  FIRST_HAND: {
    id: "first_hand",
    name: "🎴 Primeira Mão",
    description: "Jogue sua primeira mão",
    icon: "🎴",
    xp: 10,
    condition: (stats) => (stats?.handsPlayed || 0) >= 1,
  },
  FIRST_WIN: {
    id: "first_win_finding",
    name: "🏆 Primeira Vitória",
    description: "Ganhe sua primeira mão",
    icon: "🏆",
    xp: 15,
    condition: (stats) => (stats?.handsWon || 0) >= 1,
  },

  // ========== ACHADOS DE MÃOS ==========
  TEN_HANDS: {
    id: "ten_hands_finding",
    name: "🎯 10 Mãos",
    description: "Jogue 10 mãos",
    icon: "🎯",
    xp: 20,
    condition: (stats) => (stats?.handsPlayed || 0) >= 10,
  },
  TWENTY_HANDS: {
    id: "twenty_hands_finding",
    name: "🎯 20 Mãos",
    description: "Jogue 20 mãos",
    icon: "🎯",
    xp: 30,
    condition: (stats) => (stats?.handsPlayed || 0) >= 20,
  },
  FIFTY_HANDS: {
    id: "fifty_hands_finding",
    name: "🎯 50 Mãos",
    description: "Jogue 50 mãos",
    icon: "🎯",
    xp: 40,
    condition: (stats) => (stats?.handsPlayed || 0) >= 50,
  },
  HUNDRED_HANDS: {
    id: "hundred_hands_finding",
    name: "🎯 100 Mãos",
    description: "Jogue 100 mãos",
    icon: "🎯",
    xp: 50,
    condition: (stats) => (stats?.handsPlayed || 0) >= 100,
  },

  // ========== ACHADOS DE VITÓRIAS ==========
  FIVE_WINS: {
    id: "five_wins_finding",
    name: "⭐ 5 Vitórias",
    description: "Ganhe 5 mãos",
    icon: "⭐",
    xp: 25,
    condition: (stats) => (stats?.handsWon || 0) >= 5,
  },
  TEN_WINS: {
    id: "ten_wins_finding",
    name: "🏆 10 Vitórias",
    description: "Ganhe 10 mãos",
    icon: "🏆",
    xp: 35,
    condition: (stats) => (stats?.handsWon || 0) >= 10,
  },
  TWENTY_WINS: {
    id: "twenty_wins_finding",
    name: "🏆 20 Vitórias",
    description: "Ganhe 20 mãos",
    icon: "🏆",
    xp: 50,
    condition: (stats) => (stats?.handsWon || 0) >= 20,
  },

  // ========== ACHADOS ESPECIAIS ==========
  ALL_IN_WIN: {
    id: "all_in_win_finding",
    name: "⚡ All-in Vitorioso",
    description: "Ganhe com All-in",
    icon: "⚡",
    xp: 40,
    condition: (stats) => (stats?.allInWins || 0) >= 1,
  },
  BIG_WIN_FINDING: {
    id: "big_win_finding",
    name: "💰 Grande Vitória",
    description: "Ganhe mais de 300 fichas em uma mão",
    icon: "💰",
    xp: 35,
    condition: (stats) => (stats?.biggestWin || 0) >= 300,
  },
  MEGA_WIN_FINDING: {
    id: "mega_win_finding",
    name: "💎 Mega Vitória",
    description: "Ganhe mais de 1000 fichas em uma mão",
    icon: "💎",
    xp: 60,
    condition: (stats) => (stats?.biggestWin || 0) >= 1000,
  },
};

export function checkFindings(stats, currentFindings = []) {
  const unlocked = [];

  Object.values(FINDINGS).forEach((finding) => {
    if (
      !currentFindings.some((f) => f.id === finding.id) &&
      finding.condition(stats)
    ) {
      unlocked.push(finding);
    }
  });

  return unlocked;
}

export function getFindingById(id) {
  return Object.values(FINDINGS).find((f) => f.id === id);
}

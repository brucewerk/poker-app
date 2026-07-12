// lib/findings.js
export const FINDINGS = {
  FIRST_GAME: {
    id: "first_game",
    name: "🎯 Primeiro Jogo",
    description: "Jogue sua primeira partida",
    xp: 50,
    icon: "🎯",
    condition: (stats) => stats.handsPlayed >= 1,
  },
  TEN_GAMES: {
    id: "ten_games",
    name: "🎯 10 Jogos",
    description: "Jogue 10 partidas",
    xp: 100,
    icon: "🎯",
    condition: (stats) => stats.handsPlayed >= 10,
  },
  WINNER: {
    id: "winner",
    name: "🏆 Primeira Vitória",
    description: "Ganhe sua primeira mão",
    xp: 75,
    icon: "🏆",
    condition: (stats) => stats.handsWon >= 1,
  },
  STREAK_3: {
    id: "streak_3",
    name: "🔥 Streak de 3",
    description: "Ganhe 3 mãos seguidas",
    xp: 100,
    icon: "🔥",
    condition: (stats) => stats.currentStreak >= 3,
  },
  STREAK_5: {
    id: "streak_5",
    name: "⚡ Streak de 5",
    description: "Ganhe 5 mãos seguidas",
    xp: 200,
    icon: "⚡",
    condition: (stats) => stats.currentStreak >= 5,
  },
  BIG_WIN: {
    id: "big_win",
    name: "💰 Grande Vitória",
    description: "Ganhe mais de 500 fichas",
    xp: 150,
    icon: "💰",
    condition: (stats) => stats.biggestWin >= 500,
  },
  MEGA_WIN: {
    id: "mega_win",
    name: "💎 Mega Vitória",
    description: "Ganhe mais de 1000 fichas",
    xp: 300,
    icon: "💎",
    condition: (stats) => stats.biggestWin >= 1000,
  },
  ALL_IN: {
    id: "all_in",
    name: "⚡ All-in Vitorioso",
    description: "Ganhe uma mão com all-in",
    xp: 120,
    icon: "⚡",
    condition: (stats) => stats.allInWins >= 1,
  },
  ROYAL: {
    id: "royal",
    name: "👑 Royal Flush",
    description: "Faça um Royal Flush",
    xp: 500,
    icon: "👑",
    condition: (stats) => stats.bestHand === "Straight Flush",
  },
  HIGH_ROLLER: {
    id: "high_roller",
    name: "🎩 High Roller",
    description: "Tenha mais de 5000 fichas",
    xp: 200,
    icon: "🎩",
    condition: (stats) => stats.totalChips >= 5000,
  },
  MILLIONAIRE: {
    id: "millionaire",
    name: "💲 Milionário",
    description: "Tenha mais de 10000 fichas",
    xp: 500,
    icon: "💲",
    condition: (stats) => stats.totalChips >= 10000,
  },
  PERFECT_STREAK: {
    id: "perfect_streak",
    name: "🎯 Perfeição!",
    description: "Ganhe 10 mãos consecutivas",
    xp: 500,
    icon: "🎯",
    condition: (stats) => stats.currentStreak >= 10,
  },
};

export function checkFindings(stats, currentFindings = []) {
  const unlocked = [];

  Object.values(FINDINGS).forEach((finding) => {
    if (!currentFindings.includes(finding.id) && finding.condition(stats)) {
      unlocked.push(finding);
    }
  });

  return unlocked;
}

export function getFindingById(id) {
  return Object.values(FINDINGS).find((f) => f.id === id);
}

export function getUnlockedFindings(findingsIds = []) {
  return findingsIds.map((id) => getFindingById(id)).filter(Boolean);
}

export function getTotalFindings() {
  return Object.keys(FINDINGS).length;
}

// lib/achievements.js
export const ACHIEVEMENTS = {
  FIRST_WIN: {
    id: "first_win",
    name: "🏆 Primeira Vitória!",
    description: "Ganhe sua primeira mão",
    icon: "🏆",
    condition: (stats) => (stats?.handsWon || 0) >= 1,
  },
  STREAK_3: {
    id: "streak_3",
    name: "🔥 Três Seguidas!",
    description: "Ganhe 3 mãos consecutivas",
    icon: "🔥",
    condition: (stats) => (stats?.bestStreak || 0) >= 3,
  },
  STREAK_5: {
    id: "streak_5",
    name: "⚡ Cinco Seguidas!",
    description: "Ganhe 5 mãos consecutivas",
    icon: "⚡",
    condition: (stats) => (stats?.bestStreak || 0) >= 5,
  },
  BIG_WIN: {
    id: "big_win",
    name: "💰 Grande Vitória!",
    description: "Ganhe mais de 500 fichas em uma mão",
    icon: "💰",
    condition: (stats) => (stats?.biggestWin || 0) >= 500,
  },
  MEGA_WIN: {
    id: "mega_win",
    name: "💎 Mega Vitória!",
    description: "Ganhe mais de 1000 fichas em uma mão",
    icon: "💎",
    condition: (stats) => (stats?.biggestWin || 0) >= 1000,
  },
  HIGH_ROLLER: {
    id: "high_roller",
    name: "🎩 High Roller",
    description: "Ganhe mais de 5000 fichas no total",
    icon: "🎩",
    condition: (stats) => (stats?.totalChipsWon || 0) >= 5000,
  },
  ALL_IN_WIN: {
    id: "all_in_win",
    name: "⚡ All-in Vitorioso!",
    description: "Ganhe uma mão com all-in",
    icon: "⚡",
    condition: (stats) => (stats?.allInWins || 0) >= 1,
  },
  ALL_IN_MASTER: {
    id: "all_in_master",
    name: "👑 Mestre do All-in",
    description: "Ganhe 5 mãos com all-in",
    icon: "👑",
    condition: (stats) => (stats?.allInWins || 0) >= 5,
  },
  PERFECT_STREAK: {
    id: "perfect_streak",
    name: "🎯 Perfeição!",
    description: "Ganhe 10 mãos consecutivas",
    icon: "🎯",
    condition: (stats) => (stats?.bestStreak || 0) >= 10,
  },
  MILLIONAIRE: {
    id: "millionaire",
    name: "💲 Milionário!",
    description: "Ganhe mais de 10000 fichas no total",
    icon: "💲",
    condition: (stats) => (stats?.totalChipsWon || 0) >= 10000,
  },
  // 🔥 CONQUISTA FLUSH REMOVIDA - SUBSTITUÍDA POR "TWO_PAIRS_WIN"
  TWO_PAIRS_WIN: {
    id: "two_pairs_win",
    name: "🃏 Dois Pares!",
    description: "Ganhe com Dois Pares",
    icon: "🃏",
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return (
        hand === "Dois Pares" ||
        hand === "dois pares" ||
        hand.includes("Dois Pares")
      );
    },
  },
  FULL_HOUSE_WIN: {
    id: "full_house_win",
    name: "🏠 Full House",
    description: "Ganhe com um Full House",
    icon: "🏠",
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return (
        hand === "Full House" ||
        hand === "full house" ||
        hand.includes("Full House")
      );
    },
  },
  // 🔥 CONQUISTA SEQUENCIA REMOVIDA - SUBSTITUÍDA POR "FIFTY_HANDS"
  FIFTY_HANDS: {
    id: "fifty_hands",
    name: "🎯 50 Mãos!",
    description: "Jogue 50 mãos de poker",
    icon: "🎯",
    condition: (stats) => (stats?.handsPlayed || 0) >= 50,
  },
  // 🔥 NOVA CONQUISTA: 100 mãos
  HUNDRED_HANDS: {
    id: "hundred_hands",
    name: "🎯 100 Mãos!",
    description: "Jogue 100 mãos de poker",
    icon: "🎯",
    condition: (stats) => (stats?.handsPlayed || 0) >= 100,
  },
};

export function checkAchievements(stats, currentAchievements = []) {
  const unlocked = [];

  Object.values(ACHIEVEMENTS).forEach((achievement) => {
    if (
      !currentAchievements.includes(achievement.id) &&
      achievement.condition(stats)
    ) {
      unlocked.push(achievement);
    }
  });

  return unlocked;
}

export function getAchievementById(id) {
  return Object.values(ACHIEVEMENTS).find((a) => a.id === id);
}

export function getUnlockedAchievements(achievementIds = []) {
  return achievementIds.map((id) => getAchievementById(id)).filter(Boolean);
}

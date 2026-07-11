// lib/achievements.js
export const ACHIEVEMENTS = {
  FIRST_WIN: {
    id: "first_win",
    name: "🏆 Primeira Vitória!",
    description: "Ganhe sua primeira mão",
    icon: "🏆",
    condition: (stats) => stats.handsWon >= 1,
  },
  STREAK_3: {
    id: "streak_3",
    name: "🔥 Três Seguidas!",
    description: "Ganhe 3 mãos consecutivas",
    icon: "🔥",
    condition: (stats) => stats.currentStreak >= 3,
  },
  STREAK_5: {
    id: "streak_5",
    name: "⚡ Cinco Seguidas!",
    description: "Ganhe 5 mãos consecutivas",
    icon: "⚡",
    condition: (stats) => stats.currentStreak >= 5,
  },
  BIG_WIN: {
    id: "big_win",
    name: "💰 Grande Vitória!",
    description: "Ganhe mais de 500 fichas em uma mão",
    icon: "💰",
    condition: (stats) => stats.biggestWin >= 500,
  },
  MEGA_WIN: {
    id: "mega_win",
    name: "💎 Mega Vitória!",
    description: "Ganhe mais de 1000 fichas em uma mão",
    icon: "💎",
    condition: (stats) => stats.biggestWin >= 1000,
  },
  HIGH_ROLLER: {
    id: "high_roller",
    name: "🎩 High Roller",
    description: "Tenha mais de 5000 fichas",
    icon: "🎩",
    condition: (stats) => stats.totalChips >= 5000,
  },
  ALL_IN_WIN: {
    id: "all_in_win",
    name: "⚡ All-in Vitorioso!",
    description: "Ganhe uma mão com all-in",
    icon: "⚡",
    condition: (stats) => stats.allInWins >= 1,
  },
  ALL_IN_MASTER: {
    id: "all_in_master",
    name: "👑 Mestre do All-in",
    description: "Ganhe 5 mãos com all-in",
    icon: "👑",
    condition: (stats) => stats.allInWins >= 5,
  },
  PERFECT_STREAK: {
    id: "perfect_streak",
    name: "🎯 Perfeição!",
    description: "Ganhe 10 mãos consecutivas",
    icon: "🎯",
    condition: (stats) => stats.currentStreak >= 10,
  },
  MILLIONAIRE: {
    id: "millionaire",
    name: "💲 Milionário!",
    description: "Tenha mais de 10000 fichas",
    icon: "💲",
    condition: (stats) => stats.totalChips >= 10000,
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

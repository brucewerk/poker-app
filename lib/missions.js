// lib/missions.js
export const MISSIONS = {
  PLAY_5_HANDS: {
    id: "play_5_hands",
    name: "🎯 5 Mãos",
    description: "Jogue 5 mãos (CPU ou Multiplayer)",
    icon: "🎯",
    requirement: 5,
    xpReward: 20,
    chipsReward: 50,
    type: "hands_played",
    check: (stats) => stats.handsPlayed || 0,
  },
  PLAY_10_HANDS: {
    id: "play_10_hands",
    name: "🎯 10 Mãos",
    description: "Jogue 10 mãos (CPU ou Multiplayer)",
    icon: "🎯",
    requirement: 10,
    xpReward: 40,
    chipsReward: 100,
    type: "hands_played",
    check: (stats) => stats.handsPlayed || 0,
  },
  WIN_3_HANDS: {
    id: "win_3_hands",
    name: "🏆 3 Vitórias",
    description: "Ganhe 3 mãos",
    icon: "🏆",
    requirement: 3,
    xpReward: 30,
    chipsReward: 75,
    type: "hands_won",
    check: (stats) => stats.handsWon || 0,
  },
  WIN_5_HANDS: {
    id: "win_5_hands",
    name: "🏆 5 Vitórias",
    description: "Ganhe 5 mãos",
    icon: "🏆",
    requirement: 5,
    xpReward: 50,
    chipsReward: 150,
    type: "hands_won",
    check: (stats) => stats.handsWon || 0,
  },
  BIG_WIN: {
    id: "big_win",
    name: "💰 Grande Vitória",
    description: "Ganhe 200+ fichas em uma mão",
    icon: "💰",
    requirement: 200,
    xpReward: 35,
    chipsReward: 100,
    type: "biggest_win",
    check: (stats) => stats.biggestWin || 0,
  },
  MEGA_WIN: {
    id: "mega_win",
    name: "💎 Mega Vitória",
    description: "Ganhe 500+ fichas em uma mão",
    icon: "💎",
    requirement: 500,
    xpReward: 75,
    chipsReward: 200,
    type: "biggest_win",
    check: (stats) => stats.biggestWin || 0,
  },
  STREAK_3: {
    id: "streak_3",
    name: "🔥 Streak de 3",
    description: "Ganhe 3 mãos seguidas",
    icon: "🔥",
    requirement: 3,
    xpReward: 45,
    chipsReward: 120,
    type: "streak",
    check: (stats) => stats.currentStreak || 0,
  },
  STREAK_5: {
    id: "streak_5",
    name: "⚡ Streak de 5",
    description: "Ganhe 5 mãos seguidas",
    icon: "⚡",
    requirement: 5,
    xpReward: 80,
    chipsReward: 250,
    type: "streak",
    check: (stats) => stats.currentStreak || 0,
  },
  ALL_IN_WIN: {
    id: "all_in_win",
    name: "⚡ All-in Vitorioso",
    description: "Ganhe uma mão com all-in",
    icon: "⚡",
    requirement: 1,
    xpReward: 50,
    chipsReward: 150,
    type: "all_in_wins",
    check: (stats) => stats.allInWins || 0,
  },
  HIGH_ROLLER: {
    id: "high_roller",
    name: "🎩 High Roller",
    description: "Tenha 3000+ fichas",
    icon: "🎩",
    requirement: 3000,
    xpReward: 60,
    chipsReward: 0,
    type: "total_chips",
    check: (stats) => stats.totalChips || 0,
  },
};

export function getDailyMissions() {
  // Retorna todas as missões (ou apenas as do dia)
  return Object.values(MISSIONS);
}

export function checkMissionProgress(mission, stats) {
  const current = mission.check(stats);
  const progress = Math.min(current / mission.requirement, 1);
  return {
    completed: current >= mission.requirement,
    progress: progress,
    current: current,
    required: mission.requirement,
  };
}

export function getCompletedMissions(missionIds, stats) {
  const allMissions = getDailyMissions();
  return allMissions.filter((m) => {
    const progress = checkMissionProgress(m, stats);
    return progress.completed && missionIds.includes(m.id);
  });
}

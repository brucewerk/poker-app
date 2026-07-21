// lib/achievements.js - VERSÃO PREMIUM COM MAIS CONQUISTAS
export const ACHIEVEMENTS = {
  // ========== CONQUISTAS INICIAIS ==========
  FIRST_WIN: {
    id: "first_win",
    name: "🏆 Primeira Vitória!",
    description: "Ganhe sua primeira mão",
    icon: "🏆",
    rarity: "comum",
    xpBonus: 25,
    condition: (stats) => (stats?.handsWon || 0) >= 1,
  },
  FIRST_HAND: {
    id: "first_hand_achievement",
    name: "🎴 Primeira Mão!",
    description: "Jogue sua primeira mão de poker",
    icon: "🎴",
    rarity: "comum",
    xpBonus: 15,
    condition: (stats) => (stats?.handsPlayed || 0) >= 1,
  },

  // ========== CONQUISTAS DE STREAK ==========
  STREAK_3: {
    id: "streak_3",
    name: "🔥 Três Seguidas!",
    description: "Ganhe 3 mãos consecutivas",
    icon: "🔥",
    rarity: "incomum",
    xpBonus: 50,
    condition: (stats) => (stats?.bestStreak || 0) >= 3,
  },
  STREAK_5: {
    id: "streak_5",
    name: "⚡ Cinco Seguidas!",
    description: "Ganhe 5 mãos consecutivas",
    icon: "⚡",
    rarity: "raro",
    xpBonus: 100,
    condition: (stats) => (stats?.bestStreak || 0) >= 5,
  },
  STREAK_10: {
    id: "streak_10",
    name: "🎯 Dez Seguidas!",
    description: "Ganhe 10 mãos consecutivas",
    icon: "🎯",
    rarity: "épico",
    xpBonus: 200,
    condition: (stats) => (stats?.bestStreak || 0) >= 10,
  },

  // ========== CONQUISTAS DE VITÓRIA ==========
  BIG_WIN: {
    id: "big_win",
    name: "💰 Grande Vitória!",
    description: "Ganhe mais de 500 fichas em uma mão",
    icon: "💰",
    rarity: "incomum",
    xpBonus: 75,
    condition: (stats) => (stats?.biggestWin || 0) >= 500,
  },
  MEGA_WIN: {
    id: "mega_win",
    name: "💎 Mega Vitória!",
    description: "Ganhe mais de 1000 fichas em uma mão",
    icon: "💎",
    rarity: "raro",
    xpBonus: 150,
    condition: (stats) => (stats?.biggestWin || 0) >= 1000,
  },
  ULTRA_WIN: {
    id: "ultra_win",
    name: "👑 Ultra Vitória!",
    description: "Ganhe mais de 2000 fichas em uma mão",
    icon: "👑",
    rarity: "épico",
    xpBonus: 300,
    condition: (stats) => (stats?.biggestWin || 0) >= 2000,
  },

  // ========== CONQUISTAS DE TOTAL ==========
  HIGH_ROLLER: {
    id: "high_roller",
    name: "🎩 High Roller",
    description: "Ganhe mais de 5000 fichas no total",
    icon: "🎩",
    rarity: "raro",
    xpBonus: 150,
    condition: (stats) => (stats?.totalChipsWon || 0) >= 5000,
  },
  MILLIONAIRE: {
    id: "millionaire",
    name: "💲 Milionário!",
    description: "Ganhe mais de 10000 fichas no total",
    icon: "💲",
    rarity: "épico",
    xpBonus: 300,
    condition: (stats) => (stats?.totalChipsWon || 0) >= 10000,
  },
  POKER_LEGEND: {
    id: "poker_legend",
    name: "🏅 Lenda do Poker!",
    description: "Ganhe mais de 50000 fichas no total",
    icon: "🏅",
    rarity: "lendário",
    xpBonus: 500,
    condition: (stats) => (stats?.totalChipsWon || 0) >= 50000,
  },

  // ========== CONQUISTAS ALL-IN ==========
  ALL_IN_WIN: {
    id: "all_in_win",
    name: "⚡ All-in Vitorioso!",
    description: "Ganhe uma mão com all-in",
    icon: "⚡",
    rarity: "incomum",
    xpBonus: 50,
    condition: (stats) => (stats?.allInWins || 0) >= 1,
  },
  ALL_IN_MASTER: {
    id: "all_in_master",
    name: "👑 Mestre do All-in",
    description: "Ganhe 5 mãos com all-in",
    icon: "👑",
    rarity: "raro",
    xpBonus: 150,
    condition: (stats) => (stats?.allInWins || 0) >= 5,
  },
  ALL_IN_LEGEND: {
    id: "all_in_legend",
    name: "🔥 Lenda do All-in",
    description: "Ganhe 10 mãos com all-in",
    icon: "🔥",
    rarity: "épico",
    xpBonus: 300,
    condition: (stats) => (stats?.allInWins || 0) >= 10,
  },

  // ========== CONQUISTAS DE MÃOS ==========
  TWENTY_HANDS: {
    id: "twenty_hands_achievement",
    name: "🎯 20 Mãos!",
    description: "Jogue 20 mãos de poker",
    icon: "🎯",
    rarity: "comum",
    xpBonus: 30,
    condition: (stats) => (stats?.handsPlayed || 0) >= 20,
  },
  FIFTY_HANDS: {
    id: "fifty_hands_achievement",
    name: "🎯 50 Mãos!",
    description: "Jogue 50 mãos de poker",
    icon: "🎯",
    rarity: "incomum",
    xpBonus: 75,
    condition: (stats) => (stats?.handsPlayed || 0) >= 50,
  },
  HUNDRED_HANDS: {
    id: "hundred_hands",
    name: "🎯 100 Mãos!",
    description: "Jogue 100 mãos de poker",
    icon: "🎯",
    rarity: "raro",
    xpBonus: 150,
    condition: (stats) => (stats?.handsPlayed || 0) >= 100,
  },
  FIVE_HUNDRED_HANDS: {
    id: "five_hundred_hands",
    name: "🎯 500 Mãos!",
    description: "Jogue 500 mãos de poker",
    icon: "🎯",
    rarity: "épico",
    xpBonus: 300,
    condition: (stats) => (stats?.handsPlayed || 0) >= 500,
  },

  // ========== CONQUISTAS DE MÃOS ESPECÍFICAS ==========
  TWO_PAIRS_WIN: {
    id: "two_pairs_win",
    name: "🃏 Dois Pares!",
    description: "Ganhe com Dois Pares",
    icon: "🃏",
    rarity: "comum",
    xpBonus: 25,
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return hand === "Dois Pares" || hand.includes("Dois Pares");
    },
  },
  THREE_KIND_WIN: {
    id: "three_kind_win",
    name: "🎲 Trinca!",
    description: "Ganhe com uma Trinca",
    icon: "🎲",
    rarity: "incomum",
    xpBonus: 50,
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return hand === "Trinca" || hand.includes("Trinca");
    },
  },
  STRAIGHT_WIN: {
    id: "straight_win",
    name: "📈 Sequência!",
    description: "Ganhe com uma Sequência",
    icon: "📈",
    rarity: "incomum",
    xpBonus: 50,
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return hand === "Sequencia" || hand.includes("Sequencia");
    },
  },
  FLUSH_WIN: {
    id: "flush_win",
    name: "🌊 Flush!",
    description: "Ganhe com um Flush",
    icon: "🌊",
    rarity: "raro",
    xpBonus: 75,
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return hand === "Flush" || hand.includes("Flush");
    },
  },
  FULL_HOUSE_WIN: {
    id: "full_house_win",
    name: "🏠 Full House!",
    description: "Ganhe com um Full House",
    icon: "🏠",
    rarity: "raro",
    xpBonus: 100,
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return hand === "Full House" || hand.includes("Full House");
    },
  },
  FOUR_KIND_WIN: {
    id: "four_kind_win",
    name: "💎 Quadra!",
    description: "Ganhe com uma Quadra",
    icon: "💎",
    rarity: "épico",
    xpBonus: 200,
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return hand === "Quadra" || hand.includes("Quadra");
    },
  },
  STRAIGHT_FLUSH_WIN: {
    id: "straight_flush_win",
    name: "🌟 Straight Flush!",
    description: "Ganhe com um Straight Flush",
    icon: "🌟",
    rarity: "lendário",
    xpBonus: 400,
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return hand === "Straight Flush" || hand.includes("Straight Flush");
    },
  },
  ROYAL_FLUSH_WIN: {
    id: "royal_flush_win",
    name: "👑 Royal Flush!",
    description: "Ganhe com um Royal Flush - A MAIOR MÃO DO POKER!",
    icon: "👑",
    rarity: "lendário",
    xpBonus: 1000,
    condition: (stats) => {
      const hand = stats?.bestHand || "";
      return hand === "Royal Flush" || hand.includes("Royal Flush");
    },
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

// 🔥 NOVO: Agrupar conquistas por raridade
export function getAchievementsByRarity() {
  const groups = {
    comum: [],
    incomum: [],
    raro: [],
    épico: [],
    lendário: [],
  };

  Object.values(ACHIEVEMENTS).forEach((ach) => {
    const rarity = ach.rarity || "comum";
    if (groups[rarity]) {
      groups[rarity].push(ach);
    }
  });

  return groups;
}

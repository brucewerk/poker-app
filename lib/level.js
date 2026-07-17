// lib/level.js

// 🔥 CONFIGURAÇÃO DOS NÍVEIS - EXPANDIDA ATÉ NÍVEL 50
const LEVELS = {
  1: { title: "Iniciante", icon: "🎴", xpToNextLevel: 100 },
  2: { title: "Aprendiz", icon: "🃏", xpToNextLevel: 150 },
  3: { title: "Jogador", icon: "♠️", xpToNextLevel: 200 },
  4: { title: "Experiente", icon: "♦️", xpToNextLevel: 250 },
  5: { title: "Avançado", icon: "♣️", xpToNextLevel: 300 },
  6: { title: "Especialista", icon: "♥️", xpToNextLevel: 400 },
  7: { title: "Mestre", icon: "👑", xpToNextLevel: 500 },
  8: { title: "Lenda", icon: "⭐", xpToNextLevel: 600 },
  9: { title: "Mitológico", icon: "🔥", xpToNextLevel: 800 },
  10: { title: "Imortal", icon: "🏆", xpToNextLevel: 1000 },
  11: { title: "Lendário", icon: "🌟", xpToNextLevel: 1200 },
  12: { title: "Épico", icon: "⚡", xpToNextLevel: 1400 },
  13: { title: "Fabuloso", icon: "💎", xpToNextLevel: 1600 },
  14: { title: "Mítico", icon: "🔮", xpToNextLevel: 1800 },
  15: { title: "Divino", icon: "✨", xpToNextLevel: 2000 },
  16: { title: "Cósmico", icon: "🌌", xpToNextLevel: 2500 },
  17: { title: "Infinito", icon: "♾️", xpToNextLevel: 3000 },
  18: { title: "Absoluto", icon: "💫", xpToNextLevel: 3500 },
  19: { title: "Supremo", icon: "👑", xpToNextLevel: 4000 },
  20: { title: "Lenda Viva", icon: "🏅", xpToNextLevel: 5000 },
  21: { title: "Mestre das Cartas", icon: "🃏", xpToNextLevel: 6000 },
  22: { title: "Rei do Poker", icon: "♠️", xpToNextLevel: 7000 },
  23: { title: "Imperador", icon: "👑", xpToNextLevel: 8000 },
  24: { title: "Titã", icon: "⚔️", xpToNextLevel: 9000 },
  25: { title: "Cavaleiro do Poker", icon: "🛡️", xpToNextLevel: 10000 },
  26: { title: "Sábio das Cartas", icon: "📜", xpToNextLevel: 12000 },
  27: { title: "Mago do Poker", icon: "🔮", xpToNextLevel: 14000 },
  28: { title: "Arcanjo", icon: "😇", xpToNextLevel: 16000 },
  29: { title: "Serafim", icon: "🔥", xpToNextLevel: 18000 },
  30: { title: "Querubim", icon: "💫", xpToNextLevel: 20000 },
  31: { title: "Dominador", icon: "⚡", xpToNextLevel: 25000 },
  32: { title: "Senhor do Poker", icon: "👑", xpToNextLevel: 30000 },
  33: { title: "Deus do Poker", icon: "⚡", xpToNextLevel: 35000 },
  34: { title: "Onipotente", icon: "💥", xpToNextLevel: 40000 },
  35: { title: "Onisciente", icon: "🔮", xpToNextLevel: 45000 },
  36: { title: "Onipresente", icon: "🌍", xpToNextLevel: 50000 },
  37: { title: "Eterno", icon: "♾️", xpToNextLevel: 60000 },
  38: { title: "Imortal", icon: "🏆", xpToNextLevel: 70000 },
  39: { title: "Infinito", icon: "∞", xpToNextLevel: 80000 },
  40: { title: "Absoluto", icon: "💫", xpToNextLevel: 90000 },
  41: { title: "Supremo Mestre", icon: "👑", xpToNextLevel: 100000 },
  42: { title: "Lenda Suprema", icon: "🏅", xpToNextLevel: 120000 },
  43: { title: "Mestre Supremo", icon: "🃏", xpToNextLevel: 140000 },
  44: { title: "Rei Supremo", icon: "♠️", xpToNextLevel: 160000 },
  45: { title: "Imperador Supremo", icon: "👑", xpToNextLevel: 180000 },
  46: { title: "Titã Supremo", icon: "⚔️", xpToNextLevel: 200000 },
  47: { title: "Cavaleiro Supremo", icon: "🛡️", xpToNextLevel: 250000 },
  48: { title: "Sábio Supremo", icon: "📜", xpToNextLevel: 300000 },
  49: { title: "Mago Supremo", icon: "🔮", xpToNextLevel: 350000 },
  50: { title: "Lenda Absoluta", icon: "🏆", xpToNextLevel: 500000 },
};

// 🔥 Função para obter informações do nível
export function getLevelInfo(level) {
  return LEVELS[level] || LEVELS[Math.min(level, 50)] || LEVELS[1];
}

// 🔥 Função para obter o título do nível
export function getLevelTitle(level) {
  const info = getLevelInfo(level);
  return info ? info.title : "Iniciante";
}

// 🔥 Função para obter o ícone do nível
export function getLevelIcon(level) {
  const info = getLevelInfo(level);
  return info ? info.icon : "🎴";
}

// 🔥 Função para obter o XP necessário para o próximo nível
export function getXpToNextLevel(level) {
  const info = getLevelInfo(level);
  return info ? info.xpToNextLevel : 100;
}

// 🔥 Função para calcular o nível baseado no XP total
export function calculateLevel(xp) {
  let level = 1;
  let xpNeeded = getXpToNextLevel(level);
  let xpRemaining = xp;

  while (xpRemaining >= xpNeeded && level < 50) {
    xpRemaining -= xpNeeded;
    level++;
    xpNeeded = getXpToNextLevel(level);
  }

  // 🔥 Se o XP for maior que o máximo, cap no nível 50
  if (level > 50) {
    level = 50;
    xpRemaining = getXpToNextLevel(50);
  }

  return {
    level: level,
    xp: Math.min(xpRemaining, getXpToNextLevel(level)),
    xpToNextLevel: getXpToNextLevel(level),
    title: getLevelTitle(level),
    icon: getLevelIcon(level),
  };
}

// 🔥 Função para verificar se o usuário subiu de nível
export function checkLevelUp(currentLevel, xp) {
  const newLevel = calculateLevel(xp);
  if (newLevel.level > currentLevel) {
    return {
      leveledUp: true,
      newLevel: newLevel.level,
      oldLevel: currentLevel,
      title: newLevel.title,
      icon: newLevel.icon,
    };
  }
  return {
    leveledUp: false,
    newLevel: currentLevel,
    oldLevel: currentLevel,
  };
}

// 🔥 Função para obter todos os níveis
export function getAllLevels() {
  return Object.keys(LEVELS).map(Number);
}

// 🔥 Função para obter o XP total necessário para um nível
export function getTotalXpForLevel(level) {
  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    totalXp += getXpToNextLevel(i);
  }
  return totalXp;
}

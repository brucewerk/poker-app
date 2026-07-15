// lib/level.js

// Configuração dos níveis
const LEVELS = {
  1: { title: "Iniciante", icon: "🎴", xpToNextLevel: 100 },
  2: { title: "Aprendiz", icon: "🃏", xpToNextLevel: 200 },
  3: { title: "Jogador", icon: "♠️", xpToNextLevel: 350 },
  4: { title: "Experiente", icon: "♦️", xpToNextLevel: 500 },
  5: { title: "Avançado", icon: "♣️", xpToNextLevel: 700 },
  6: { title: "Especialista", icon: "♥️", xpToNextLevel: 1000 },
  7: { title: "Mestre", icon: "👑", xpToNextLevel: 1500 },
  8: { title: "Lenda", icon: "⭐", xpToNextLevel: 2000 },
  9: { title: "Mitológico", icon: "🔥", xpToNextLevel: 3000 },
  10: { title: "Imortal", icon: "🏆", xpToNextLevel: 5000 },
};

// 🔥 Função para obter informações do nível
export function getLevelInfo(level) {
  return LEVELS[level] || LEVELS[1];
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
  let xpNeeded = 100;
  let xpRemaining = xp;

  while (xpRemaining >= xpNeeded) {
    xpRemaining -= xpNeeded;
    level++;
    xpNeeded = getXpToNextLevel(level);
  }

  return {
    level: level,
    xp: xpRemaining,
    xpToNextLevel: xpNeeded,
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

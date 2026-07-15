// lib/level.js
export function getLevelInfo(level) {
  const levels = {
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

  return levels[level] || levels[1];
}

// lib/level.js
export const LEVEL_TITLES = {
  1: "Iniciante",
  2: "Aprendiz",
  3: "Jogador Casual",
  4: "Jogador Regular",
  5: "Conhecedor",
  6: "Experiente",
  7: "Habilidoso",
  8: "Competente",
  9: "Avançado",
  10: "Mestre",
  15: "Especialista",
  20: "Veterano",
  25: "Lenda",
  30: "Mito",
  40: "Ícone",
  50: "Lenda Viva",
};

export function getLevelTitle(level) {
  const levels = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => a - b);
  let title = "Jogador";
  for (let lvl of levels) {
    if (level >= lvl) {
      title = LEVEL_TITLES[lvl];
    }
  }
  return title;
}

export function getXpToNextLevel(level) {
  // Fórmula: 100 + (level - 1) * 50
  return Math.floor(100 + (level - 1) * 50);
}

export function getLevelIcon(level) {
  if (level >= 50) return "👑";
  if (level >= 30) return "💎";
  if (level >= 20) return "🌟";
  if (level >= 10) return "⭐";
  if (level >= 5) return "🃏";
  return "🎴";
}

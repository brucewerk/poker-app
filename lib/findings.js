// lib/findings.js

// Lista de achados do jogo
export const FINDINGS = {
  first_win: {
    id: "first_win",
    name: "Primeira Vitória",
    description: "Ganhe sua primeira mão",
    icon: "🏆",
    xp: 50,
    condition: (stats) => stats.handsWon >= 1,
  },
  five_wins: {
    id: "five_wins",
    name: "5 Vitórias",
    description: "Ganhe 5 mãos",
    icon: "⭐",
    xp: 100,
    condition: (stats) => stats.handsWon >= 5,
  },
  ten_wins: {
    id: "ten_wins",
    name: "10 Vitórias",
    description: "Ganhe 10 mãos",
    icon: "🌟",
    xp: 200,
    condition: (stats) => stats.handsWon >= 10,
  },
  all_in_win: {
    id: "all_in_win",
    name: "All-in Campeão",
    description: "Ganhe uma mão com All-in",
    icon: "⚡",
    xp: 75,
    condition: (stats) => stats.allInWins >= 1,
  },
  flush_winner: {
    id: "flush_winner",
    name: "Flush Real",
    description: "Ganhe com um Flush",
    icon: "♦️",
    xp: 150,
    condition: (stats) => stats.bestHand === "Flush",
  },
  straight_winner: {
    id: "straight_winner",
    name: "Sequência Perfeita",
    description: "Ganhe com uma Sequência",
    icon: "♣️",
    xp: 150,
    condition: (stats) => stats.bestHand === "Sequencia",
  },
  full_house_winner: {
    id: "full_house_winner",
    name: "Full House Mestre",
    description: "Ganhe com um Full House",
    icon: "🏠",
    xp: 200,
    condition: (stats) => stats.bestHand === "Full House",
  },
};

// 🔥 Função para verificar novos achados
export async function checkFindings(username, stats) {
  const findings = [];
  const user = await User.findOne({ username });
  const unlockedIds = (user?.findings || []).map((f) => f.id);

  for (const [id, finding] of Object.entries(FINDINGS)) {
    if (!unlockedIds.includes(id) && finding.condition(stats)) {
      findings.push({
        id: finding.id,
        name: finding.name,
        description: finding.description,
        icon: finding.icon,
        xp: finding.xp,
      });
    }
  }

  return findings;
}

// 🔥 Função para obter todos os achados
export function getFindings() {
  return Object.values(FINDINGS);
}

// 🔥 Função para obter achado por ID
export function getFindingById(id) {
  return FINDINGS[id] || null;
}

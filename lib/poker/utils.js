// lib/poker/utils.js

/**
 * NOVO: Calcula pot odds
 */
export function calculatePotOdds(toCall, potSize) {
  if (toCall === 0 || potSize === 0) return 0;
  return toCall / (potSize + toCall);
}

/**
 * NOVO: Calcula valor esperado de uma ação
 */
export function calculateExpectedValue(winProbability, pot, callAmount) {
  const evWin = winProbability * (pot + callAmount);
  const evLose = (1 - winProbability) * callAmount;
  return evWin - evLose;
}

/**
 * NOVO: Obtém frases aleatórias para a CPU
 */
export function getRandomCPUMessage(type, amount = 0) {
  const messages = {
    allIn: [
      "ALL-IN! Vamos ver! 💀⚡",
      "Tudo ou nada! 🔥",
      "Vai que cola! 🎯",
      "O destino decide! ⚡",
      "Minha hora chegou! 💪",
    ],
    raise: [
      `Vou aumentar para ${amount}! 📈`,
      "Sua vez, amigo! 💪",
      "Vamos elevar a aposta! 🚀",
      "Não vai ser fácil! 😏",
      "Aposto que você não tem coragem! 😎",
    ],
    call: [
      `Pago ${amount}. 🎴`,
      "Vamos ver o que você tem! 👀",
      "Aceito o desafio! 🤝",
      "Pago para ver! 🃏",
      "Interessante... Vamos ver! 🤔",
    ],
    fold: [
      "Muito caro... Desisto. 😞",
      "Dessa vez não dá. 😐",
      "Melhor não arriscar. 🤔",
      "Fico pra próxima. 😅",
      "Você ganhou essa! 👏",
    ],
    check: [
      "Vou dar CHECK. 🤔",
      "Deixa eu ver a próxima. 🃏",
      "Check por enquanto. 👀",
      "Vamos devagar. 🐢",
      "Esperando a oportunidade. 🎯",
    ],
  };

  const messageList = messages[type] || messages.check;
  return messageList[Math.floor(Math.random() * messageList.length)];
}

/**
 * NOVO: Analisa se a CPU está em situação de desespero (short stack)
 */
export function isShortStack(cpuMoney, bigBlind = 50) {
  return cpuMoney < bigBlind * 10;
}

/**
 * NOVO: Calcula M-Ratio (medida de saúde da stack)
 */
export function calculateMRatio(cpuMoney, bigBlind = 50) {
  return cpuMoney / (bigBlind * 1.5);
}

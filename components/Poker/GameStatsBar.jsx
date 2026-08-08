// components/Poker/GameStatsBar.jsx - BARRA ÚNICA DE STATUS (substitui o cabeçalho antigo)
"use client";

export default function GameStatsBar({
  pot = 0,
  stage = "preflop",
  stageNames = {},
  playerMoney = 0,
  cpuMoney = 0,
  currentBet = 0,
  isTurbo = false,
  isMultiplayerActive = false,
}) {
  const items = [
    { icon: "💰", value: pot, title: "Pote" },
    {
      icon: "🎴",
      value: stageNames[stage] || stage || "preflop",
      title: "Fase",
    },
    { icon: "👤", value: playerMoney, title: "Suas fichas" },
    { icon: "🤖", value: cpuMoney, title: "Fichas da CPU" },
    { icon: "📊", value: currentBet, title: "Aposta atual" },
    {
      icon: isTurbo ? "🚀" : "🐢",
      value: isTurbo ? "Turbo" : "Normal",
      title: "Modo de jogo",
      color: isTurbo ? "#ff9800" : "#4caf50",
    },
    {
      icon: "👥",
      value: isMultiplayerActive ? "2P" : "1P",
      title: "Jogadores",
      color: isMultiplayerActive ? "#4caf50" : undefined,
    },
  ];

  return (
    <div className="game-stats-bar">
      {items.map((item, i) => (
        <div key={`gstat-${i}`} className="game-stats-pill" title={item.title}>
          <span className="game-stats-icon" style={{ color: item.color }}>
            {item.icon}
          </span>
          <span className="game-stats-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

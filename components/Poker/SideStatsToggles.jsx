// components/Poker/SideStatsToggles.jsx - TOGGLES LATERAIS (ESQUERDA) PARA MOBILE EM PÉ
"use client";

export default function SideStatsToggles({
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
      color: isTurbo ? "#ff9800" : undefined,
    },
    {
      icon: "👥",
      value: isMultiplayerActive ? "2P" : "1P",
      title: "Jogadores",
      color: isMultiplayerActive ? "#4caf50" : undefined,
    },
  ];

  return (
    <div className="side-stats-toggles-container">
      {items.map((item, i) => (
        <div
          key={`side-stat-${i}`}
          className="toolbar-btn side-stat-btn"
          title={item.title}
        >
          <span style={{ fontSize: "1rem", color: item.color, lineHeight: 1 }}>
            {item.icon}
          </span>
          <span className="side-stat-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

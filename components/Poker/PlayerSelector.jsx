// components/Poker/PlayerSelector.jsx
"use client";

export default function PlayerSelector({
  players,
  currentPlayer,
  onSelectPlayer,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "15px",
        marginBottom: "15px",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {players.map((player, index) => (
        <button
          key={`player-${index}-${player.name}`} // 🔥 CHAVE ÚNICA
          onClick={() => onSelectPlayer(index)}
          style={{
            padding: "10px 25px",
            borderRadius: 30,
            border:
              currentPlayer === index
                ? "2px solid gold"
                : "2px solid rgba(255,255,255,0.2)",
            background:
              currentPlayer === index
                ? "rgba(255,215,0,0.2)"
                : "rgba(0,0,0,0.4)",
            color: currentPlayer === index ? "gold" : "#aaa",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            backdropFilter: "blur(4px)",
          }}
        >
          {player.name} {currentPlayer === index && "👈"}
        </button>
      ))}
    </div>
  );
}

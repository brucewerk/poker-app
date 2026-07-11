// components/Poker/VictoryModal.jsx
"use client";

export default function VictoryModal({
  winner,
  chipsWon,
  handName,
  isSpecial,
  playerName,
  onClose,
}) {
  const isPlayer = winner === "player";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1001,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "linear-gradient(145deg,#ffd700,#ff8c00)",
          padding: "30px 50px",
          borderRadius: 60,
          textAlign: "center",
          color: "#2e241f",
          boxShadow: "0 0 80px rgba(255,215,0,0.6)",
          border: "3px solid white",
          maxWidth: "90%",
        }}
      >
        <div style={{ fontSize: "2rem" }}>{isPlayer ? "🏆🎉💰" : "🤖💔"}</div>

        <h2
          style={{
            fontSize: "2.5rem",
            margin: "10px 0",
            textShadow: "2px 2px 0 rgba(255,255,255,0.5)",
          }}
        >
          {isPlayer ? "🎉 VITÓRIA ÉPICA! 🎉" : "😔 VITÓRIA DA CPU"}
        </h2>

        <p style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
          O grande vencedor é:
        </p>

        <div
          style={{
            fontSize: "2rem",
            color: "#fff",
            textShadow: "2px 2px 0 #b45f06",
            margin: "15px 0",
          }}
        >
          {isPlayer ? playerName || "JOGADOR" : "CPU"}
        </div>

        <div
          style={{
            fontSize: "1.5rem",
            margin: "10px 0",
            color: isPlayer ? (isSpecial ? "#ff0000" : "#ff6600") : "#ff8888",
            fontWeight: "bold",
          }}
        >
          {isPlayer
            ? isSpecial
              ? "💥 QUEBROU A BANCA! 💥"
              : chipsWon >= 200
                ? "🔥 GRANDE VITÓRIA! 🔥"
                : "⭐ BOA MÃO! ⭐"
            : "🤖 A CPU venceu esta mão!"}
        </div>

        <p
          style={{
            fontSize: "1.3rem",
            fontWeight: "bold",
            color: isPlayer ? "#00ff00" : "#ff8888",
          }}
        >
          {isPlayer
            ? `💰 Você ganhou ${chipsWon} fichas!`
            : `💔 Você perdeu ${chipsWon} fichas...`}
        </p>

        <button
          onClick={onClose}
          style={{
            ...btnStyle(),
            fontSize: "1.1rem",
            padding: "10px 30px",
            marginTop: 15,
            background: "radial-gradient(#fff,#f0f0f0)",
            boxShadow: "0 4px 0 #b45f06",
          }}
        >
          JOGAR NOVAMENTE
        </button>
      </div>
    </div>
  );
}

function btnStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "0.9rem",
    padding: "8px 20px",
    borderRadius: 60,
    cursor: "pointer",
    boxShadow: "0 4px 0 #7a4c1a",
    color: "#2e241f",
    fontFamily: "inherit",
  };
}

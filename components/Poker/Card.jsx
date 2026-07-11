// components/Poker/Card.jsx

export default function Card({ card, faceDown = false }) {
  if (faceDown) {
    return (
      <div
        style={{
          width: 70,
          height: 100,
          borderRadius: 10,
          background:
            "repeating-linear-gradient(45deg,#2b5797,#2b5797 15px,#1d3f6e 15px,#1d3f6e 30px)",
          boxShadow: "-2px 2px 8px rgba(0,0,0,0.5)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 3px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "1.8rem",
            color: "#ffd966",
            fontWeight: "bold",
          }}
        >
          ?
        </span>
      </div>
    );
  }

  let rank = card.rank;
  if (rank === 11) rank = "J";
  if (rank === 12) rank = "Q";
  if (rank === 13) rank = "K";
  if (rank === 14) rank = "A";

  const isRed = card.suit === "♥" || card.suit === "♦";

  return (
    <div
      style={{
        width: 70,
        height: 100,
        background: "linear-gradient(145deg,#fff,#f8f4e8)",
        borderRadius: 10,
        boxShadow: "-2px 2px 8px rgba(0,0,0,0.5)",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 3px",
        flexShrink: 0,
        color: isRed ? "#c33" : "#1f2a2f",
        fontWeight: "bold",
      }}
    >
      <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{rank}</div>
      <div style={{ fontSize: "2rem", lineHeight: 1 }}>{card.suit}</div>
    </div>
  );
}

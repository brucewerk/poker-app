// 🔥 DENTRO DO page.jsx - Substitua o componente ResultModal por este:

function ResultModal({ data, onClose }) {
  if (!data) return null;

  const isWin = data.winner === "player";
  const isTie = data.winner === "tie";
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    onClose();
  };

  // 🔥 RENDERIZAR CARTAS
  const renderCards = (cards, faceDown = false) => {
    if (!cards || cards.length === 0) return null;
    return cards.map((card, index) => (
      <div
        key={index}
        style={{
          display: "inline-block",
          width: 50,
          height: 70,
          margin: "2px",
          borderRadius: 6,
          background: faceDown
            ? "repeating-linear-gradient(45deg,#2b5797,#2b5797 10px,#1d3f6e 10px,#1d3f6e 20px)"
            : "#fff",
          color: card.suit === "♥" || card.suit === "♦" ? "#cc0000" : "#000",
          fontSize: "1.2rem",
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: "70px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          border: "1px solid #ccc",
        }}
      >
        {!faceDown && `${card.rank}${card.suit}`}
      </div>
    ));
  };

  // 🔥 PEGAR AS CARTAS DOS DADOS
  const playerCards = data.playerCards || [];
  const cpuCards = data.cpuCards || [];
  const communityCards = data.communityCards || [];

  return (
    <div style={modalOverlayStyle()}>
      <div style={modalContentStyle(isWin, isTie)}>
        <div style={modalHeaderStyle()}>
          <span style={modalIconStyle(isWin, isTie)}>
            {isWin ? "🏆" : isTie ? "🤝" : "💔"}
          </span>
          <h2 style={modalTitleStyle(isWin, isTie)}>
            {isWin ? "VITÓRIA!" : isTie ? "EMPATE!" : "DERROTA!"}
          </h2>
        </div>

        <div style={modalMessageStyle()}>
          <p style={modalWinnerStyle(isWin, isTie)}>{data.winnerMsg}</p>
        </div>

        {/* 🔥 CARTAS DA MESA */}
        {communityCards && communityCards.length > 0 && (
          <div style={modalCommunityStyle()}>
            <div style={modalCommunityLabelStyle()}>🔥 MESA</div>
            <div style={modalCardsRowStyle()}>
              {communityCards.map((card, i) => (
                <div
                  key={i}
                  style={{
                    display: "inline-block",
                    width: 50,
                    height: 70,
                    margin: "2px",
                    borderRadius: 6,
                    background: "#fff",
                    color:
                      card.suit === "♥" || card.suit === "♦"
                        ? "#cc0000"
                        : "#000",
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    textAlign: "center",
                    lineHeight: "70px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    border: "1px solid #ccc",
                  }}
                >
                  {card.rank}
                  {card.suit}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={modalComparisonStyle()}>
          <div style={modalPlayerStyle(true)}>
            <div style={modalPlayerNameStyle(true)}>
              🃏 {data.playerName || "Você"}
            </div>
            <div style={modalCardsRowStyle()}>
              {playerCards.length > 0 ? (
                playerCards.map((card, i) => (
                  <div
                    key={i}
                    style={{
                      display: "inline-block",
                      width: 50,
                      height: 70,
                      margin: "2px",
                      borderRadius: 6,
                      background: "#fff",
                      color:
                        card.suit === "♥" || card.suit === "♦"
                          ? "#cc0000"
                          : "#000",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      textAlign: "center",
                      lineHeight: "70px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      border: "1px solid #ccc",
                    }}
                  >
                    {card.rank}
                    {card.suit}
                  </div>
                ))
              ) : (
                <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                  Sem cartas
                </span>
              )}
            </div>
            <div style={modalHandStyle(true)}>{data.playerHand}</div>
            {isWin && <div style={modalBadgeStyle("win")}>🏆 VENCEDOR</div>}
          </div>

          <div style={modalVersusStyle()}>
            <span>VS</span>
          </div>

          <div style={modalPlayerStyle(false)}>
            <div style={modalPlayerNameStyle(false)}>🤖 CPU</div>
            <div style={modalCardsRowStyle()}>
              {cpuCards.length > 0 ? (
                cpuCards.map((card, i) => (
                  <div
                    key={i}
                    style={{
                      display: "inline-block",
                      width: 50,
                      height: 70,
                      margin: "2px",
                      borderRadius: 6,
                      background: "#fff",
                      color:
                        card.suit === "♥" || card.suit === "♦"
                          ? "#cc0000"
                          : "#000",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      textAlign: "center",
                      lineHeight: "70px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      border: "1px solid #ccc",
                    }}
                  >
                    {card.rank}
                    {card.suit}
                  </div>
                ))
              ) : (
                <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                  Sem cartas
                </span>
              )}
            </div>
            <div style={modalHandStyle(false)}>{data.cpuHand}</div>
            {!isWin && !isTie && (
              <div style={modalBadgeStyle("loss")}>💔 PERDEU</div>
            )}
            {isTie && <div style={modalBadgeStyle("tie")}>🤝 EMPATOU</div>}
          </div>
        </div>

        <div style={modalPotStyle()}>
          <span>💰 Pote: {data.pot} fichas</span>
          {isWin && <span style={modalWinAmountStyle()}>+{data.chipsWon}</span>}
          {!isWin && !isTie && (
            <span style={modalLoseAmountStyle()}>-{data.chipsLost}</span>
          )}
          {isTie && <span style={modalTieAmountStyle()}>+{data.split}</span>}
        </div>

        <div style={modalCpuThoughtStyle()}>{data.cpuThought}</div>

        <button
          onClick={handleClose}
          style={modalCloseButtonStyle()}
          disabled={isClosing}
        >
          {isClosing ? "⏳" : "CONTINUAR"}
        </button>
      </div>
    </div>
  );
}

// ====================== ESTILOS ADICIONAIS PARA O MODAL ======================

function modalCommunityStyle() {
  return {
    background: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: "10px",
    marginBottom: "15px",
    textAlign: "center",
  };
}

function modalCommunityLabelStyle() {
  return {
    fontSize: "0.7rem",
    color: "#aaa",
    marginBottom: "5px",
    display: "block",
  };
}

function modalCardsRowStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "4px",
    flexWrap: "wrap",
    padding: "5px 0",
    minHeight: "80px",
  };
}

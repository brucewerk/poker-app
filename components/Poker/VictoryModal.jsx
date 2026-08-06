// components/Poker/VictoryModal.jsx - RESPONSIVO
"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function VictoryModal({
  winner,
  chipsWon,
  handName,
  isSpecial,
  playerName,
  onClose,
}) {
  const isPlayer = winner === "player";
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 768);
      setIsLandscape(width > height && width < 900);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <motion.div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1001,
        padding: isMobile ? "clamp(12px, 3vw, 20px)" : "clamp(20px, 4vw, 40px)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{
          background: isPlayer
            ? "linear-gradient(145deg, #ffd700, #ff8c00)"
            : "linear-gradient(145deg, #4a4a4a, #2a2a2a)",
          padding: isMobile
            ? "clamp(20px, 4vw, 30px)"
            : "clamp(30px, 5vw, 50px)",
          borderRadius: isMobile
            ? "clamp(30px, 6vw, 40px)"
            : "clamp(40px, 5vw, 60px)",
          textAlign: "center",
          color: isPlayer ? "#2e241f" : "#ffffff",
          boxShadow: isPlayer
            ? "0 0 80px rgba(255,215,0,0.6)"
            : "0 0 60px rgba(255,0,0,0.3)",
          border: isPlayer
            ? "3px solid white"
            : "3px solid rgba(255,255,255,0.2)",
          maxWidth: isMobile ? "95vw" : "clamp(400px, 60vw, 600px)",
          width: "100%",
        }}
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: isMobile
              ? "clamp(2.5rem, 8vw, 4rem)"
              : "clamp(3rem, 5vw, 5rem)",
            marginBottom: isMobile ? "4px" : "8px",
          }}
        >
          {isPlayer ? "🏆🎉💰" : "🤖💔"}
        </div>

        <h2
          style={{
            fontSize: isMobile
              ? "clamp(1.4rem, 5vw, 2.2rem)"
              : "clamp(2rem, 3vw, 2.8rem)",
            margin: isMobile ? "4px 0 8px" : "8px 0 12px",
            textShadow: isPlayer
              ? "2px 2px 0 rgba(255,255,255,0.3)"
              : "2px 2px 0 rgba(0,0,0,0.3)",
            fontWeight: 900,
            lineHeight: 1.2,
          }}
        >
          {isPlayer ? "🎉 VITÓRIA ÉPICA! 🎉" : "😔 VITÓRIA DA CPU"}
        </h2>

        <p
          style={{
            fontSize: isMobile
              ? "clamp(0.9rem, 2.5vw, 1.1rem)"
              : "clamp(1.1rem, 1.5vw, 1.3rem)",
            fontWeight: 600,
            opacity: 0.9,
            margin: isMobile ? "4px 0" : "8px 0",
          }}
        >
          O grande vencedor é:
        </p>

        <div
          style={{
            fontSize: isMobile
              ? "clamp(1.4rem, 5vw, 2rem)"
              : "clamp(1.8rem, 3vw, 2.5rem)",
            color: isPlayer ? "#fff" : "#ff6b6b",
            textShadow: isPlayer
              ? "2px 2px 0 #b45f06"
              : "2px 2px 0 rgba(0,0,0,0.5)",
            margin: isMobile ? "6px 0" : "12px 0",
            fontWeight: 800,
          }}
        >
          {isPlayer ? playerName || "JOGADOR" : "CPU"}
        </div>

        <div
          style={{
            fontSize: isMobile
              ? "clamp(1rem, 3vw, 1.3rem)"
              : "clamp(1.2rem, 2vw, 1.5rem)",
            margin: isMobile ? "6px 0" : "10px 0",
            color: isPlayer ? (isSpecial ? "#ff0000" : "#ff6600") : "#ff8888",
            fontWeight: 700,
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
            fontSize: isMobile
              ? "clamp(1rem, 2.8vw, 1.2rem)"
              : "clamp(1.2rem, 1.8vw, 1.4rem)",
            fontWeight: 700,
            color: isPlayer ? "#00ff00" : "#ff8888",
            margin: isMobile ? "6px 0 12px" : "10px 0 16px",
          }}
        >
          {isPlayer
            ? `💰 Você ganhou ${chipsWon} fichas!`
            : `💔 Você perdeu ${chipsWon} fichas...`}
        </p>

        {handName && isPlayer && (
          <div
            style={{
              fontSize: isMobile
                ? "clamp(0.8rem, 2vw, 1rem)"
                : "clamp(1rem, 1.2vw, 1.2rem)",
              background: "rgba(255,255,255,0.2)",
              padding: isMobile ? "4px 12px" : "6px 20px",
              borderRadius: 20,
              display: "inline-block",
              marginBottom: isMobile ? "12px" : "16px",
              fontWeight: 600,
            }}
          >
            🃏 {handName}
          </div>
        )}

        <motion.button
          onClick={onClose}
          style={{
            width: "100%",
            padding: isMobile
              ? "clamp(10px, 2.5vw, 14px)"
              : "clamp(12px, 2vw, 16px)",
            fontSize: isMobile
              ? "clamp(0.8rem, 2vw, 1rem)"
              : "clamp(1rem, 1.3vw, 1.1rem)",
            background: isPlayer
              ? "radial-gradient(#fff, #f0f0f0)"
              : "radial-gradient(#f7d97c, #d6a12e)",
            border: "none",
            borderRadius: isMobile
              ? "clamp(30px, 5vw, 40px)"
              : "clamp(40px, 4vw, 60px)",
            fontWeight: 700,
            color: isPlayer ? "#2e241f" : "#2e241f",
            cursor: "pointer",
            boxShadow: isPlayer ? "0 4px 0 #b45f06" : "0 4px 0 #7a4c1a",
            transition: "all 0.2s ease",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginTop: isMobile ? "4px" : "8px",
          }}
          whileHover={{
            scale: 1.02,
            y: -2,
            boxShadow: isPlayer ? "0 6px 0 #b45f06" : "0 6px 0 #7a4c1a",
          }}
          whileTap={{ scale: 0.98, y: 0 }}
        >
          ▶ JOGAR NOVAMENTE
        </motion.button>

        {isMobile && (
          <div
            style={{
              textAlign: "center",
              marginTop: isMobile ? "6px" : "10px",
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.5rem",
            }}
          >
            Clique fora para fechar
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

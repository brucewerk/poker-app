// components/Poker/FullscreenButton.jsx
"use client";

import { useState, useEffect } from "react";

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Erro ao entrar em tela cheia:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn("Erro ao sair da tela cheia:", err);
        });
      }
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      style={buttonStyle()}
      title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
    >
      ⛶
    </button>
  );
}

// ====================== ESTILOS ======================
function buttonStyle() {
  return {
    width: 44,
    height: 44,
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "50%",
    color: "white",
    fontSize: "1.2rem",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.3s ease",
    position: "relative",
  };
}

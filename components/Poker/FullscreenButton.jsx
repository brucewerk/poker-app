// components/Poker/FullscreenButton.jsx - CORRIGIDO
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
      className="toolbar-btn"
      title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
    >
      ⛶
    </button>
  );
}

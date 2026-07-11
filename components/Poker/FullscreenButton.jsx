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
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      style={{
        position: "fixed",
        bottom: 80,
        left: 20,
        zIndex: 100,
        background: "rgba(0,0,0,0.6)",
        color: "white",
        border: "2px solid rgba(255,215,0,0.3)",
        borderRadius: "50%",
        width: 50,
        height: 50,
        fontSize: "1.5rem",
        cursor: "pointer",
        backdropFilter: "blur(4px)",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = "scale(1.1)";
        e.target.style.background = "rgba(255,215,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = "scale(1)";
        e.target.style.background = "rgba(0,0,0,0.6)";
      }}
      title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
    >
      {isFullscreen ? "⛶" : "⛶"}
    </button>
  );
}

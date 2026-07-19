// components/Poker/SoundToggle.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { soundManager } from "@/lib/sound";

export default function SoundToggle() {
  const [isMuted, setIsMuted] = useState(false);
  const isInitialized = useRef(false);
  const testAttempted = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const saved = localStorage.getItem("sound-muted");
    const muted = saved === "true";
    setIsMuted(muted);
    soundManager.setMuted(muted);

    const initSound = () => {
      console.log("🔊 Inicializando áudio por interação do usuário");
      soundManager.initAudioContext();
      soundManager.loadSounds();

      setTimeout(() => {
        if (!soundManager.getMuted()) {
          soundManager.testSound();
        }
      }, 200);

      document.removeEventListener("click", initSound);
      document.removeEventListener("keydown", initSound);
      document.removeEventListener("touchstart", initSound);
    };

    document.addEventListener("click", initSound, { once: true });
    document.addEventListener("keydown", initSound, { once: true });
    document.addEventListener("touchstart", initSound, { once: true });

    const tryAutoInit = () => {
      if (!soundManager.isInitialized && document.hasFocus()) {
        console.log("🔊 Tentando iniciar áudio automaticamente");
        soundManager.initAudioContext();
        soundManager.loadSounds();

        if (!soundManager.getMuted()) {
          setTimeout(() => {
            soundManager.testSound();
          }, 300);
        }
      }
    };

    setTimeout(tryAutoInit, 1000);
    setTimeout(tryAutoInit, 3000);

    return () => {
      document.removeEventListener("click", initSound);
      document.removeEventListener("keydown", initSound);
      document.removeEventListener("touchstart", initSound);
    };
  }, []);

  const toggleSound = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.setMuted(newMuted);

    if (!newMuted) {
      console.log("🔊 Ativando som...");
      soundManager.initAudioContext();
      soundManager.loadSounds();
      setTimeout(() => {
        soundManager.testSound();
      }, 150);
    } else {
      console.log("🔇 Som desativado");
    }
  };

  return (
    <button
      onClick={toggleSound}
      style={buttonStyle()}
      title={isMuted ? "Ativar som" : "Desativar som"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}

// ====================== ESTILO (SEM POSITION: FIXED) ======================
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
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    fontFamily: "inherit",
    outline: "none",
    position: "relative",
  };
}

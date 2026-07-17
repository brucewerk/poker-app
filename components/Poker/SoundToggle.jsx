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

    // 🔥 CARREGAR ESTADO SALVO
    const saved = localStorage.getItem("sound-muted");
    const muted = saved === "true";
    setIsMuted(muted);
    soundManager.setMuted(muted);

    // 🔥 FUNÇÃO PARA INICIALIZAR ÁUDIO
    const initSound = () => {
      console.log("🔊 Inicializando áudio por interação do usuário");
      soundManager.initAudioContext();
      soundManager.loadSounds();

      // 🔥 TOCAR SOM DE TESTE APÓS INICIALIZAR
      setTimeout(() => {
        if (!soundManager.getMuted()) {
          soundManager.testSound();
        }
      }, 200);

      document.removeEventListener("click", initSound);
      document.removeEventListener("keydown", initSound);
      document.removeEventListener("touchstart", initSound);
    };

    // 🔥 AGUARDAR INTERAÇÃO DO USUÁRIO
    document.addEventListener("click", initSound, { once: true });
    document.addEventListener("keydown", initSound, { once: true });
    document.addEventListener("touchstart", initSound, { once: true });

    // 🔥 TENTAR INICIAR AUTOMATICAMENTE
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

    // 🔥 TENTAR NOVAMENTE APÓS 3 SEGUNDOS
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
      // 🔥 INICIALIZAR E TESTAR SOM
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
      style={{
        position: "fixed",
        top: 70,
        right: 10,
        zIndex: 100,
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "50%",
        width: 40,
        height: 40,
        color: "white",
        fontSize: "1.2rem",
        cursor: "pointer",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "all 0.3s ease",
      }}
      title={isMuted ? "Ativar som" : "Desativar som"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}

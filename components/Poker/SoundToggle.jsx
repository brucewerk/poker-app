// components/Poker/SoundToggle.jsx - CONTROLE DE SOM PREMIUM CORRIGIDO
"use client";

import { useState, useEffect, useRef } from "react";
import { soundManager } from "@/lib/sound";

export default function SoundToggle() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const isInitialized = useRef(false);
  const volumeTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const savedMuted = localStorage.getItem("sound-muted");
    const muted = savedMuted === "true";
    setIsMuted(muted);
    soundManager.setMuted(muted);

    const savedVolume = soundManager.getVolume();
    setVolume(savedVolume);
    soundManager.setVolume(savedVolume);

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
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, []);

  const toggleSound = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.setMuted(newMuted);
    localStorage.setItem("sound-muted", String(newMuted));

    if (!newMuted) {
      console.log("🔊 Ativando som...");
      soundManager.initAudioContext();
      soundManager.loadSounds();
      soundManager.setVolume(volume);
      setTimeout(() => {
        soundManager.testSound();
      }, 150);
    } else {
      console.log("🔇 Som desativado");
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
  };

  // 🔥 Tocar som ao SOLTAR o slider (onMouseUp)
  const handleVolumeMouseUp = () => {
    if (!isMuted) {
      soundManager.playSound("deal", { volume: Math.max(0.05, volume * 0.3) });
    }
  };

  // 🔥 Mostrar controle de volume (mouse enter NO BOTÃO)
  const handleButtonMouseEnter = () => {
    setIsHovering(true);
    setShowVolumeControl(true);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  // 🔥 Esconder controle após 2 segundos sem foco
  const handleButtonMouseLeave = () => {
    setIsHovering(false);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setShowVolumeControl(false);
      hideTimeoutRef.current = null;
    }, 2000);
  };

  // 🔥 Manter aberto se o mouse estiver no popup
  const handlePopupMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handlePopupMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowVolumeControl(false);
      hideTimeoutRef.current = null;
    }, 2000);
  };

  return (
    <div style={containerStyle()}>
      <button
        onClick={toggleSound}
        className={`toolbar-btn ${isMuted ? "toolbar-btn-muted" : ""}`}
        title={isMuted ? "Ativar som" : "Desativar som"}
        style={buttonStyle(isMuted, isHovering)}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
      >
        {isMuted ? "🔇" : "🔊"}
        {!isMuted && (
          <span className="toolbar-btn-volume-indicator">
            {Math.round(volume * 100)}%
          </span>
        )}
      </button>

      {showVolumeControl && !isMuted && (
        <div
          className="toolbar-volume-popup"
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <span className="toolbar-volume-popup-icon">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            onMouseUp={handleVolumeMouseUp}
            onTouchEnd={handleVolumeMouseUp}
            className="toolbar-volume-slider"
          />
          <span className="toolbar-volume-value">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

// ====================== ESTILOS ======================

function containerStyle() {
  return {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  };
}

function buttonStyle(isMuted, isHovering) {
  return {
    background: isMuted
      ? "rgba(60,60,60,0.6)"
      : isHovering
        ? "rgba(255,215,0,0.15)"
        : undefined,
    border: isMuted
      ? "1px solid rgba(255,255,255,0.05)"
      : isHovering
        ? "1px solid rgba(255,215,0,0.3)"
        : undefined,
    boxShadow:
      isHovering && !isMuted ? "0 4px 20px rgba(255,215,0,0.15)" : undefined,
  };
}

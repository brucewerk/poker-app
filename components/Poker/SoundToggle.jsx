// components/Poker/SoundToggle.jsx - CONTROLE DE SOM PREMIUM
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

    // Feedback sonoro ao ajustar volume
    if (!isMuted && volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    volumeTimeoutRef.current = setTimeout(() => {
      if (!isMuted) {
        soundManager.playSound("deal", { volume: 0.05 });
      }
    }, 200);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    setShowVolumeControl(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTimeout(() => {
      if (!isHovering) {
        setShowVolumeControl(false);
      }
    }, 1000);
  };

  return (
    <div
      style={containerStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={toggleSound}
        style={buttonStyle(isMuted, isHovering)}
        title={isMuted ? "Ativar som" : "Desativar som"}
      >
        {isMuted ? "🔇" : "🔊"}
        <span style={volumeIndicatorStyle(isMuted, volume)}>
          {!isMuted && Math.round(volume * 100) + "%"}
        </span>
      </button>

      {showVolumeControl && !isMuted && (
        <div style={volumeControlStyle()}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            style={volumeSliderStyle()}
          />
          <span style={volumeValueStyle()}>{Math.round(volume * 100)}%</span>
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
    width: 44,
    height: 44,
    background: isMuted
      ? "rgba(60,60,60,0.8)"
      : isHovering
        ? "rgba(255,215,0,0.2)"
        : "rgba(0,0,0,0.6)",
    border: isMuted
      ? "1px solid rgba(255,255,255,0.1)"
      : isHovering
        ? "1px solid rgba(255,215,0,0.4)"
        : "1px solid rgba(255,255,255,0.2)",
    borderRadius: "50%",
    color: isMuted ? "#666" : "white",
    fontSize: "1.2rem",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.3s ease",
    boxShadow:
      isHovering && !isMuted
        ? "0 4px 20px rgba(255,215,0,0.2)"
        : "0 4px 15px rgba(0,0,0,0.3)",
    fontFamily: "inherit",
    outline: "none",
    position: "relative",
    transform: isHovering ? "scale(1.05)" : "scale(1)",
  };
}

function volumeIndicatorStyle(isMuted, volume) {
  return {
    fontSize: "0.45rem",
    color: isMuted ? "#666" : "rgba(255,215,0,0.7)",
    marginTop: "-2px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
  };
}

function volumeControlStyle() {
  return {
    position: "absolute",
    bottom: -50,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.9)",
    padding: "8px 12px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid rgba(255,215,0,0.2)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    zIndex: 10,
    minWidth: "120px",
    animation: "slideUp 0.2s ease-out",
  };
}

function volumeSliderStyle() {
  return {
    width: "80px",
    height: "4px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    appearance: "none",
    outline: "none",
    cursor: "pointer",
    WebkitAppearance: "none",
    accentColor: "#ffd700",
  };
}

function volumeValueStyle() {
  return {
    color: "#ffd700",
    fontSize: "0.7rem",
    fontWeight: "bold",
    minWidth: "30px",
    textAlign: "center",
  };
}

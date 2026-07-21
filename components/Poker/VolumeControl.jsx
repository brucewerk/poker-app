// components/Poker/VolumeControl.jsx
"use client";

import { useState, useEffect } from "react";
import { soundManager } from "@/lib/sound";

export default function VolumeControl() {
  const [volume, setVolume] = useState(0.8);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = soundManager.getVolume();
    setVolume(saved);
  }, []);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
  };

  return (
    <div style={containerStyle()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={toggleButtonStyle()}
        title="Controle de volume"
      >
        🔊
      </button>

      {isOpen && (
        <div style={popupStyle()}>
          <div style={volumeControlStyle()}>
            <span style={iconStyle()}>🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              style={sliderStyle()}
            />
            <span style={volumeValueStyle()}>{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function containerStyle() {
  return {
    position: "relative",
    display: "inline-block",
  };
}

function toggleButtonStyle() {
  return {
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "50%",
    color: "white",
    fontSize: "1.2rem",
    cursor: "pointer",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    backdropFilter: "blur(4px)",
  };
}

function popupStyle() {
  return {
    position: "absolute",
    bottom: "calc(100% + 10px)",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.95)",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,215,0,0.2)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    minWidth: "160px",
    zIndex: 100,
  };
}

function volumeControlStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };
}

function iconStyle() {
  return {
    color: "#888",
    fontSize: "0.9rem",
  };
}

function sliderStyle() {
  return {
    flex: 1,
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
    minWidth: "36px",
    textAlign: "center",
  };
}

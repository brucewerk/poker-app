// components/Poker/ToolbarButtons.jsx - COM TEMA E TORNEIOS
"use client";

import SoundToggle from "./SoundToggle.jsx";
import TurboButton from "./TurboButton.jsx";
import FullscreenButton from "./FullscreenButton.jsx";
import MultiplayerButton from "./MultiplayerButton.jsx";
import OnlineButton from "./OnlineButton.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function ToolbarButtons({
  isTurbo,
  onTurboToggle,
  onMultiplayerClick,
  isMultiplayerActive,
  onOnlineClick,
  isOnlineActive,
  onTournamentClick,
}) {
  return (
    <div style={toolbarContainerStyle()}>
      {/* 🔥 SOUND TOGGLE */}
      <SoundToggle />

      {/* 🔥 TEMA TOGGLE */}
      <ThemeToggle />

      {/* 🔥 TURBO TOGGLE */}
      <TurboButton onToggle={onTurboToggle} isTurbo={isTurbo} />

      {/* 🔥 FULLSCREEN */}
      <FullscreenButton />

      {/* 🔥 MULTIPLAYER */}
      <MultiplayerButton
        onClick={onMultiplayerClick}
        isActive={isMultiplayerActive}
      />

      {/* 🔥 ONLINE */}
      <OnlineButton onClick={onOnlineClick} isActive={isOnlineActive} />

      {/* 🔥 TORNEIOS */}
      <button
        onClick={onTournamentClick}
        style={tournamentButtonStyle()}
        title="Torneios"
      >
        🏅
      </button>
    </div>
  );
}

// ====================== ESTILOS ======================
function toolbarContainerStyle() {
  return {
    position: "fixed",
    top: 70,
    right: 10,
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  };
}

function tournamentButtonStyle() {
  return {
    width: 44,
    height: 44,
    background: "rgba(255,215,0,0.15)",
    border: "1px solid rgba(255,215,0,0.3)",
    borderRadius: "50%",
    color: "gold",
    fontSize: "1.2rem",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.3s ease",
    position: "relative",
    fontFamily: "inherit",
  };
}

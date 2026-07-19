// components/Poker/ToolbarButtons.jsx
"use client";

import SoundToggle from "./SoundToggle.jsx";
import TurboButton from "./TurboButton.jsx";
import FullscreenButton from "./FullscreenButton.jsx";
import MultiplayerButton from "./MultiplayerButton.jsx";
import OnlineButton from "./OnlineButton.jsx";

export default function ToolbarButtons({
  isTurbo,
  onTurboToggle,
  onMultiplayerClick,
  isMultiplayerActive,
  onOnlineClick,
  isOnlineActive,
}) {
  return (
    <div style={toolbarContainerStyle()}>
      {/* 🔥 SOUND TOGGLE (MANTIDO EXATAMENTE COMO ESTÁ) */}
      <SoundToggle />
      
      {/* 🔥 DEMAIS BOTÕES ABAIXO */}
      <div style={buttonsGroupStyle()}>
        <TurboButton onToggle={onTurboToggle} isTurbo={isTurbo} />
        <FullscreenButton />
        <MultiplayerButton onClick={onMultiplayerClick} isActive={isMultiplayerActive} />
        <OnlineButton onClick={onOnlineClick} isActive={isOnlineActive} />
      </div>
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

function buttonsGroupStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "center",
  };
}
// components/Poker/ToolbarButtons.jsx - COMPLETO E CORRIGIDO
"use client";

import SoundToggle from "./SoundToggle.jsx";
import TurboButton from "./TurboButton.jsx";
import FullscreenButton from "./FullscreenButton.jsx";
import MultiplayerButton from "./MultiplayerButton.jsx";
import OnlineButton from "./OnlineButton.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import TournamentButton from "./TournamentButton.jsx";

export default function ToolbarButtons({
  isTurbo,
  onTurboToggle,
  onMultiplayerClick,
  isMultiplayerActive,
  onOnlineClick,
  isOnlineActive,
  onTournamentClick,
  isTournamentActive = false,
}) {
  return (
    <div className="toolbar-buttons-container">
      <ThemeToggle />
      <SoundToggle />
      <TurboButton onToggle={onTurboToggle} isTurbo={isTurbo} />
      <FullscreenButton />
      <MultiplayerButton
        onClick={onMultiplayerClick}
        isActive={isMultiplayerActive}
      />
      <OnlineButton onClick={onOnlineClick} isActive={isOnlineActive} />
      <TournamentButton
        onClick={onTournamentClick}
        isActive={isTournamentActive}
      />
    </div>
  );
}

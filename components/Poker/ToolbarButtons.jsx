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
      <ThemeToggle className="toolbar-theme" />
      <SoundToggle className="toolbar-sound" />
      <TurboButton onToggle={onTurboToggle} isTurbo={isTurbo} className="toolbar-turbo" />
      <FullscreenButton className="toolbar-fullscreen" />
      <MultiplayerButton
        onClick={onMultiplayerClick}
        isActive={isMultiplayerActive}
        className="toolbar-multiplayer"
      />
      <OnlineButton onClick={onOnlineClick} isActive={isOnlineActive} className="toolbar-online" />
      <TournamentButton
        onClick={onTournamentClick}
        isActive={isTournamentActive}
        className="toolbar-tournament"
      />
    </div>
  );
}

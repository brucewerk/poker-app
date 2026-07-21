// app/page.jsx - COMPLETO COM TEMA ESCURO/CLARO
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createDeck } from "@/lib/poker/deck.js";
import {
  getHandRank,
  getHandName,
  compareHands,
} from "@/lib/poker/evaluation.js";
import { calculateHandStrength } from "@/lib/poker/strength.js";
import { getCpuDecision } from "@/lib/poker/cpu.js";
import Card from "@/components/Poker/Card.jsx";
import ActionButtons from "@/components/Poker/ActionButtons.jsx";
import StatusPanel from "@/components/Poker/StatusPanel.jsx";
import StatsPanel from "@/components/Poker/StatsPanel.jsx";
import AchievementsModal from "@/components/Poker/AchievementsModal.jsx";
import HandHistory from "@/components/Poker/HandHistory.jsx";
import LevelDisplay from "@/components/Poker/LevelDisplay.jsx";
import FindingsModal from "@/components/Poker/FindingsModal.jsx";
import FriendsList from "@/components/Poker/FriendsList.jsx";
import MissionsPanel from "@/components/Poker/MissionsPanel.jsx";
import OnlineButton from "@/components/Poker/OnlineButton.jsx";
import OnlineLobby from "@/components/Poker/OnlineLobby.jsx";
import OnlineGame from "@/components/Poker/OnlineGame.jsx";
import { soundManager } from "@/lib/sound.js";
import SoundToggle from "@/components/Poker/SoundToggle.jsx";
import FullscreenButton from "@/components/Poker/FullscreenButton.jsx";
import TurboButton from "@/components/Poker/TurboButton.jsx";
import MultiplayerButton from "@/components/Poker/MultiplayerButton.jsx";
import MultiplayerModal from "@/components/Poker/MultiplayerModal.jsx";
import PlayerSelector from "@/components/Poker/PlayerSelector.jsx";
import ToolbarButtons from "@/components/Poker/ToolbarButtons.jsx";
import GameTable from "@/components/Poker/GameTable.jsx";
import TournamentLobby from "@/components/Poker/TournamentLobby.jsx";
import ThemeToggle from "@/components/Poker/ThemeToggle.jsx";

// ====================== ESTADO INICIAL ======================
const INITIAL_GAME = {
  deck: [],
  community: [],
  playerCards: [],
  cpuCards: [],
  pot: 0,
  playerMoney: 0,
  cpuMoney: 1000,
  currentBet: 0,
  playerBet: 0,
  cpuBet: 0,
  stage: "preflop",
  handActive: false,
  waitingPlayer: true,
  gameOver: false,
  playerAllin: false,
  cpuAllin: false,
  raiseCounter: 0,
  showdownStarted: false,
  playerHandName: "",
  cpuHandName: "🔒 ???",
  winnerMsg: "",
  cpuThought: "",
  playerSuggestion: "",
  gameStatus: "Pré-flop",
};

// ====================== COMPONENTE PRINCIPAL ======================
export default function PokerGame() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [game, setGame] = useState(INITIAL_GAME);
  const [notification, setNotification] = useState({
    msg: "",
    isError: false,
    visible: false,
  });
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showFindingsModal, setShowFindingsModal] = useState(false);
  const [showTournamentLobby, setShowTournamentLobby] = useState(false);
  const [newFindings, setNewFindings] = useState([]);
  const [newAchievements, setNewAchievements] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTurbo, setIsTurbo] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerPlayers, setMultiplayerPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [multiplayerModeActive, setMultiplayerModeActive] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const [onlineGame, setOnlineGame] = useState(null);
  const [currentChips, setCurrentChips] = useState(0);
  const [isRefreshingChips, setIsRefreshingChips] = useState(false);
  const [isCpuGamePaused, setIsCpuGamePaused] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [resultModalLock, setResultModalLock] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const cpuTimerRef = useRef(null);
  const pendingSaveRef = useRef(false);
  const gameInitialized = useRef(false);
  const chipsSyncedRef = useRef(false);
  const hasLeftOnlineRef = useRef(false);
  const updateLockRef = useRef(false);
  const pendingChipsUpdateRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const startNewHandTimeoutRef = useRef(null);
  const saveStateTimeoutRef = useRef(null);
  const modalOpenTimeoutRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const isAllInRef = useRef(false);
  const hasLostAllRef = useRef(false);
  const chipsToSaveRef = useRef(null);
  const saveHandHistoryRef = useRef(false);
  const isProcessingAction = useRef(false);

  const currentUser = session?.user?.username || null;
  const userChips = session?.user?.chips || 0;

  // ====================== BUSCAR FICHAS DIRETAMENTE DO BANCO ======================
  const fetchChipsFromDB = useCallback(async () => {
    if (!currentUser) return null;
    try {
      const res = await fetch("/api/public/get-chips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser }),
      });
      const data = await res.json();
      if (data.success) {
        return data.chips;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar fichas:", error);
      return null;
    }
  }, [currentUser]);

  // ====================== ATUALIZAR FICHAS DO USUÁRIO ======================
  const refreshUserChips = useCallback(async () => {
    if (updateLockRef.current || isRefreshingChips || isUpdatingRef.current) {
      return;
    }

    isUpdatingRef.current = true;
    updateLockRef.current = true;
    setIsRefreshingChips(true);

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    try {
      const chips = await fetchChipsFromDB();
      if (chips !== null && chips !== currentChips) {
        setCurrentChips(chips);
        if (!isCpuGamePaused) {
          setGame((prev) => {
            if (!prev.handActive || prev.playerMoney !== chips) {
              return { ...prev, playerMoney: chips };
            }
            return prev;
          });
        }
        if (Math.abs(chips - (session?.user?.chips || 0)) > 50) {
          await update();
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar fichas:", error);
    } finally {
      setIsRefreshingChips(false);
      updateLockRef.current = false;
      isUpdatingRef.current = false;
      if (pendingChipsUpdateRef.current) {
        const pending = pendingChipsUpdateRef.current;
        pendingChipsUpdateRef.current = null;
        refreshTimeoutRef.current = setTimeout(() => refreshUserChips(), 200);
      }
    }
  }, [
    fetchChipsFromDB,
    currentUser,
    update,
    isCpuGamePaused,
    currentChips,
    session,
  ]);

  // ====================== SALVAR FICHAS - CORRIGIDO ======================
  const saveChips = useCallback(
    async (user, chips, force = false) => {
      if (!user) return;
      if (isSaving && !force) {
        pendingSaveRef.current = true;
        return;
      }

      if (chips === 0 && !force) {
        return;
      }

      setIsSaving(true);
      pendingSaveRef.current = false;

      try {
        const res = await fetch("/api/save-chips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user, chips }),
        });
        const data = await res.json();

        if (data.success) {
          setCurrentChips(chips);
          if (!isCpuGamePaused) {
            setGame((prev) => ({ ...prev, playerMoney: chips }));
          }

          if (Math.abs(chips - (session?.user?.chips || 0)) > 10) {
            await update();
          }

          setTimeout(() => refreshUserChips(), 100);
        } else {
          setTimeout(() => saveChips(user, chips, true), 2000);
        }
      } catch {
        setTimeout(() => saveChips(user, chips, true), 3000);
      } finally {
        setIsSaving(false);
        if (pendingSaveRef.current && user) {
          saveChips(user, chips, true);
        }
      }
    },
    [
      isSaving,
      update,
      isCpuGamePaused,
      currentChips,
      session,
      refreshUserChips,
    ],
  );

  // ====================== SALVAR ESTADO DO JOGO ======================
  const saveGameState = useCallback(
    async (state) => {
      if (!currentUser || !state.handActive || state.gameOver) return;

      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
      }

      saveStateTimeoutRef.current = setTimeout(async () => {
        try {
          const gameStateToSave = {
            deck: state.deck.slice(0, 20),
            community: state.community,
            playerCards: state.playerCards,
            cpuCards: state.cpuCards,
            pot: state.pot,
            playerMoney: state.playerMoney,
            cpuMoney: state.cpuMoney,
            currentBet: state.currentBet,
            playerBet: state.playerBet,
            cpuBet: state.cpuBet,
            stage: state.stage,
            handActive: state.handActive,
            waitingPlayer: state.waitingPlayer,
            gameOver: state.gameOver,
            playerAllin: state.playerAllin,
            cpuAllin: state.cpuAllin,
            raiseCounter: state.raiseCounter,
            showdownStarted: state.showdownStarted,
            playerHandName: state.playerHandName,
            cpuHandName: state.cpuHandName,
            winnerMsg: state.winnerMsg,
            cpuThought: state.cpuThought,
            playerSuggestion: state.playerSuggestion,
            gameStatus: state.gameStatus,
            timestamp: Date.now(),
          };

          const baseUrl = window.location.origin;
          await fetch(`${baseUrl}/api/save-game-state`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: currentUser,
              gameState: gameStateToSave,
            }),
          });
        } catch (error) {}
      }, 2000);
    },
    [currentUser],
  );

  // ====================== PAUSAR JOGO CPU ======================
  const pauseCpuGame = useCallback(() => {
    if (!isCpuGamePaused) {
      setIsCpuGamePaused(true);
      saveGameState(game);
    }
  }, [isCpuGamePaused, game, saveGameState]);

  // ====================== FORÇAR RESTAURAÇÃO DO JOGO CPU ======================
  const restoreCpuGame = useCallback(async () => {
    const chips = await fetchChipsFromDB();
    const finalChips = chips || currentChips || session?.user?.chips || 1000;

    setCurrentChips(finalChips);
    setIsCpuGamePaused(false);

    setGame((prev) => ({
      ...prev,
      ...INITIAL_GAME,
      playerMoney: finalChips,
      cpuMoney: 1000,
      handActive: false,
      gameOver: false,
    }));

    setTimeout(() => {
      startNewHand(currentUser, finalChips);
    }, 300);

    await update();
  }, [fetchChipsFromDB, currentChips, session, currentUser, update]);

  // ====================== ATUALIZAR AO INICIAR ======================
  useEffect(() => {
    if (status === "authenticated" && currentUser && !chipsSyncedRef.current) {
      chipsSyncedRef.current = true;
      setTimeout(() => refreshUserChips(), 100);
    }
  }, [status, currentUser, refreshUserChips]);

  // ====================== FORÇAR ATUALIZAÇÃO AO VOLTAR DO MULTIPLAYER ======================
  useEffect(() => {
    if (!onlineGame && !showOnline && currentUser && hasLeftOnlineRef.current) {
      hasLeftOnlineRef.current = false;
      restoreCpuGame();
    }
  }, [onlineGame, showOnline, currentUser, restoreCpuGame]);

  // ====================== FORÇAR SINCRONIZAÇÃO DE FICHAS ======================
  useEffect(() => {
    if (status === "authenticated" && currentUser) {
      const syncChips = async () => {
        const chips = await fetchChipsFromDB();
        if (chips !== null && chips !== currentChips) {
          setCurrentChips(chips);
          setGame((prev) => ({ ...prev, playerMoney: chips }));
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          syncChips();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      syncChips();

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    }
  }, [status, currentUser, fetchChipsFromDB, currentChips]);

  // ====================== CONFIGURAÇÕES DE DELAY ======================
  const getDelays = useCallback(() => {
    if (isTurbo) {
      return {
        revealDelay: 300,
        compareDelay: 400,
        resultDelay: 400,
        showdownStartDelay: 300,
        victoryDelay: 150,
        nextHandDelay: 1500,
        cpuActionDelay: 300,
        modalDelay: 100,
      };
    }
    return {
      revealDelay: 600,
      compareDelay: 800,
      resultDelay: 800,
      showdownStartDelay: 600,
      victoryDelay: 300,
      nextHandDelay: 2000,
      cpuActionDelay: 600,
      modalDelay: 150,
    };
  }, [isTurbo]);

  // ====================== REDIRECIONAR SE NÃO AUTENTICADO ======================
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ====================== CARREGAR SONS ======================
  useEffect(() => {
    if (status === "authenticated") {
      soundManager.loadSounds();
    }
  }, [status]);

  // ====================== CARREGAR MODO TURBO ======================
  useEffect(() => {
    const saved = localStorage.getItem("turbo-mode");
    if (saved !== null) {
      setIsTurbo(saved === "true");
    }
  }, []);

  // ====================== NOTIFICAÇÃO - COM SONS PREMIUM ======================
  const showNotification = useCallback((msg, isError = false) => {
    setNotification({ msg, isError, visible: true });

    try {
      // Sons premium baseados no tipo de notificação
      if (!isError && msg.includes("VENCEU")) {
        // Som de vitória com sequência
        if (msg.includes("ALL-IN") || msg.includes("ALL-IN")) {
          soundManager.playWinSequence();
        } else {
          soundManager.playSound("win");
        }
      } else if (isError && msg.includes("perdeu")) {
        soundManager.playLoseSequence();
      } else if (msg.includes("ALL-IN")) {
        soundManager.playSound("allin");
      } else if (msg.includes("aumentou")) {
        soundManager.playSound("raise");
      } else if (msg.includes("desistiu")) {
        soundManager.playSound("fold");
      } else if (msg.includes("CHECK")) {
        soundManager.playSound("check");
      } else if (msg.includes("🏅 Achado")) {
        soundManager.playSound("levelUp");
      } else if (msg.includes("🎊 Subiu para Nível")) {
        soundManager.playLevelUpSequence();
      } else if (msg.includes("🎉 Conquista")) {
        soundManager.playSound("celebration");
      }
    } catch (e) {
      // Silencioso em caso de erro
    }

    setTimeout(() => setNotification((n) => ({ ...n, visible: false })), 2000);
  }, []);

  // ====================== SALVAR ESTADO AUTOMATICAMENTE ======================
  useEffect(() => {
    if (
      game.handActive &&
      !game.gameOver &&
      currentUser &&
      gameInitialized.current &&
      !isCpuGamePaused
    ) {
      const saveInterval = setInterval(() => {
        saveGameState(game);
      }, 15000);

      return () => clearInterval(saveInterval);
    }
  }, [game, currentUser, saveGameState, isCpuGamePaused]);

  // ====================== RECUPERAR ESTADO SALVO ======================
  useEffect(() => {
    if (status === "authenticated" && currentUser && !gameInitialized.current) {
      const loadGameState = async () => {
        setIsLoading(true);
        try {
          const res = await fetch("/api/get-game-state");
          const data = await res.json();

          if (data.success && data.gameState && data.gameState.handActive) {
            const savedState = data.gameState;
            const fullDeck = createDeck();
            const remainingDeck = fullDeck.slice(0, savedState.deck.length);

            setGame({
              ...savedState,
              deck: remainingDeck,
              handActive: true,
              waitingPlayer: true,
            });

            gameInitialized.current = true;
            showNotification("🔄 Jogo restaurado!", false);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Erro ao recuperar estado:", error);
        }

        const chips = currentChips || userChips || 1000;
        startNewHand(currentUser, chips);
        gameInitialized.current = true;
        setIsLoading(false);
      };

      loadGameState();
    }
  }, [status, currentUser, userChips, currentChips]);

  // ====================== ATUALIZAR ESTATÍSTICAS ======================
  const updateStats = useCallback(
    async (result, chips, handName, wasAllIn = false) => {
      if (!currentUser) return;

      try {
        const res = await fetch("/api/update-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentUser,
            result,
            chips,
            handName,
            wasAllIn,
          }),
        });

        const data = await res.json();

        if (data.success) {
          if (data.newAchievements?.length > 0) {
            const achievementNames = data.newAchievements
              .map((a) => a.name)
              .join(", ");
            showNotification(
              `🎉 Conquista desbloqueada: ${achievementNames}!`,
              false,
            );
            setNewAchievements(data.newAchievements);
            setTimeout(() => setShowAchievementsModal(true), 1500);
          }

          if (data.newFindings?.length > 0) {
            const findingNames = data.newFindings.map((f) => f.name).join(", ");
            showNotification(
              `🏅 Achado descoberto: ${findingNames}! (+XP)`,
              false,
            );
            setNewFindings(data.newFindings);
            setTimeout(() => setShowFindingsModal(true), 2500);
          }

          if (data.leveledUp) {
            showNotification(
              `🎊 Subiu para Nível ${data.newLevel}! ${data.levelTitle}`,
              false,
            );
          }
        }

        return data;
      } catch (error) {
        console.error("Erro ao atualizar estatísticas:", error);
      }
    },
    [currentUser, showNotification],
  );

  // ====================== SALVAR HISTÓRICO ======================
  const saveHandHistory = useCallback(
    async (handData) => {
      if (!currentUser) {
        return;
      }

      if (saveHandHistoryRef.current) {
        return;
      }

      saveHandHistoryRef.current = true;

      try {
        const res = await fetch("/api/save-hand-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentUser,
            handData,
          }),
        });

        const data = await res.json();
        if (data.success) {
          console.log("✅ [HISTORY] Salvo com sucesso! Total:", data.total);
        }
      } catch (error) {
        console.error("❌ [HISTORY] Erro:", error);
      } finally {
        setTimeout(() => {
          saveHandHistoryRef.current = false;
        }, 500);
      }
    },
    [currentUser],
  );

  // ====================== FAST FORWARD ======================
  function fastForwardToShowdown(g, user) {
    let state = { ...g };

    if (state.stage === "showdown" || state.showdownStarted) {
      return doShowdown(state, user);
    }

    while (state.stage !== "river") {
      if (state.stage === "preflop") {
        state.stage = "flop";
        if (state.deck.length < 3) {
          state.deck = createDeck();
        }
        state.community = [
          ...state.community,
          state.deck.pop(),
          state.deck.pop(),
          state.deck.pop(),
        ];
      } else if (state.stage === "flop") {
        state.stage = "turn";
        if (state.deck.length < 1) {
          state.deck = createDeck();
        }
        state.community = [...state.community, state.deck.pop()];
      } else if (state.stage === "turn") {
        state.stage = "river";
        if (state.deck.length < 1) {
          state.deck = createDeck();
        }
        state.community = [...state.community, state.deck.pop()];
      } else break;
    }

    return doShowdown(state, user);
  }

  // ====================== DO SHOWDOWN - CORRIGIDO ======================
  async function doShowdown(g, user) {
    if (!g.handActive || g.showdownStarted || isProcessingAction.current) {
      return g;
    }

    isProcessingAction.current = true;

    console.log("🔍 [SHOWDOWN] Iniciando showdown...");

    const delays = getDelays();

    let state = {
      ...g,
      showdownStarted: true,
      handActive: false,
      stage: "showdown",
    };

    const pScore = getHandRank(state.playerCards, state.community);
    const cScore = getHandRank(state.cpuCards, state.community);
    const pName = getHandName(pScore);
    const cName = getHandName(cScore);

    state.playerHandName = `🏆 ${pName}`;
    state.cpuHandName = `🤖 ${cName}`;
    state.gameStatus = "Showdown - Revelando...";
    state.cpuThought = "🤖 CPU: 'Vamos ver...'";

    const u = user || currentUser;

    const playerName =
      isMultiplayer && multiplayerModeActive
        ? multiplayerPlayers[currentPlayerIndex]?.name || "Jogador"
        : currentUser || "Jogador";

    setGame((prev) => ({
      ...prev,
      ...state,
      showdownStarted: true,
      handActive: false,
      stage: "showdown",
      cpuHandName: `🤖 ${cName}`,
      cpuThought: `🤖 CPU: '${cName}!'`,
      gameStatus: `CPU tem ${cName}!`,
      cpuCards: state.cpuCards,
    }));

    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          let finalState = { ...state };
          finalState.cpuHandName = `🤖 ${cName}`;

          let result = null;
          let modalData = null;

          const pScoreNum = pScore?.raw || pScore?.score || 0;
          const cScoreNum = cScore?.raw || cScore?.score || 0;

          const comparison = compareHands(pScore, cScore);

          if (comparison === 0) {
            // EMPATE
            const split = Math.floor(finalState.pot / 2);
            const remainder = finalState.pot - split * 2;

            finalState.playerMoney += split + remainder;
            finalState.cpuMoney += split;

            finalState.winnerMsg = `🤝 Empate! ${pName} — Pote dividido.`;
            finalState.cpuThought = "🤖 CPU: 'Empate justo.'";
            finalState.gameStatus = "🤝 EMPATE!";
            result = "tie";

            saveHandHistory({
              result: "tie",
              playerHand: pName,
              cpuHand: cName,
              pot: finalState.pot,
              split: split,
              playerCards: state.playerCards,
              cpuCards: state.cpuCards,
              communityCards: state.community,
              wasAllIn: state.playerAllin || state.cpuAllin,
              timestamp: new Date().toISOString(),
            });

            await saveChips(u, finalState.playerMoney, false);

            modalData = {
              winner: "tie",
              playerName: playerName,
              playerHand: pName,
              cpuHand: cName,
              pot: finalState.pot,
              split: split,
              isSpecial: false,
              winnerMsg: finalState.winnerMsg,
              cpuThought: finalState.cpuThought,
              playerCards: state.playerCards || [],
              cpuCards: state.cpuCards || [],
              communityCards: state.community || [],
            };
          } else if (comparison > 0) {
            // JOGADOR VENCE
            const won = finalState.pot;
            finalState.playerMoney += won;
            finalState.winnerMsg = `🏆 ${playerName} venceu com ${pName}!`;
            finalState.cpuThought = `🤖 CPU: '${cName}... Você foi melhor!'`;
            finalState.gameStatus = "🏆 VITÓRIA! 🎉";
            result = "win";

            await updateStats("win", won, pName, state.playerAllin);

            saveHandHistory({
              result: "win",
              playerHand: pName,
              cpuHand: cName,
              pot: finalState.pot,
              chipsWon: won,
              playerCards: state.playerCards,
              cpuCards: state.cpuCards,
              communityCards: state.community,
              wasAllIn: state.playerAllin || state.cpuAllin,
              timestamp: new Date().toISOString(),
            });

            await saveChips(u, finalState.playerMoney, false);

            modalData = {
              winner: "player",
              playerName: playerName,
              playerHand: pName,
              cpuHand: cName,
              pot: finalState.pot,
              chipsWon: won,
              isSpecial: won >= 500 || pScoreNum >= 7,
              winnerMsg: finalState.winnerMsg,
              cpuThought: finalState.cpuThought,
              playerCards: state.playerCards || [],
              cpuCards: state.cpuCards || [],
              communityCards: state.community || [],
            };
          } else {
            // CPU VENCE
            const lost = finalState.pot;
            finalState.cpuMoney += lost;
            finalState.winnerMsg = `🤖 CPU venceu com ${cName}!`;
            finalState.cpuThought = `🤖 CPU: '${cName}! Ganhei!'`;
            finalState.gameStatus = "😞 CPU VENCEU!";
            result = "loss";

            await updateStats("loss", lost, cName);

            saveHandHistory({
              result: "loss",
              playerHand: pName,
              cpuHand: cName,
              pot: finalState.pot,
              chipsLost: lost,
              playerCards: state.playerCards,
              cpuCards: state.cpuCards,
              communityCards: state.community,
              wasAllIn: state.playerAllin || state.cpuAllin,
              timestamp: new Date().toISOString(),
            });

            const shouldResetChips =
              state.playerAllin || finalState.playerMoney === 0;
            if (shouldResetChips) {
              isAllInRef.current = true;
              hasLostAllRef.current = true;
              await saveChips(u, 0, true);
            } else {
              await saveChips(u, finalState.playerMoney, false);
            }

            modalData = {
              winner: "cpu",
              playerName: playerName,
              playerHand: pName,
              cpuHand: cName,
              pot: finalState.pot,
              chipsLost: lost,
              isSpecial: false,
              winnerMsg: finalState.winnerMsg,
              cpuThought: finalState.cpuThought,
              playerCards: state.playerCards || [],
              cpuCards: state.cpuCards || [],
              communityCards: state.community || [],
            };
          }

          setGame((prev) => ({
            ...prev,
            ...finalState,
            playerHandName: `🏆 ${pName}`,
            cpuHandName: `🤖 ${cName}`,
            cpuCards: state.cpuCards,
            winnerMsg: finalState.winnerMsg,
            cpuThought: finalState.cpuThought,
            gameStatus: finalState.gameStatus,
          }));

          isProcessingAction.current = false;

          if (modalData) {
            setTimeout(() => {
              setResultData(modalData);
              setResultModalOpen(true);
              setIsResultModalOpen(true);
            }, 50);
          }

          resolve(finalState);
        } catch (error) {
          console.error("❌ Erro no showdown:", error);
          isProcessingAction.current = false;
          resolve(state);
        }
      }, delays.showdownStartDelay);
    });
  }

  // ====================== FECHAR MODAL - CORRIGIDO ======================
  const closeResultModal = useCallback(() => {
    if (!resultModalOpen) return;

    isProcessingAction.current = false;

    if (startNewHandTimeoutRef.current) {
      clearTimeout(startNewHandTimeoutRef.current);
      startNewHandTimeoutRef.current = null;
    }
    if (modalOpenTimeoutRef.current) {
      clearTimeout(modalOpenTimeoutRef.current);
      modalOpenTimeoutRef.current = null;
    }

    setResultModalOpen(false);
    setResultModalLock(false);
    setIsResultModalOpen(false);

    const data = resultData;
    setResultData(null);

    requestAnimationFrame(() => {
      const refreshChipsAfterModal = async () => {
        await refreshUserChips();
        const chips = currentChips || 1000;

        if (data && data.winner !== "tie") {
          const u = currentUser;
          startNewHandTimeoutRef.current = setTimeout(() => {
            if (isMultiplayer && multiplayerModeActive) {
              switchToNextPlayer();
            }
            startNewHand(u, chips);
            startNewHandTimeoutRef.current = null;
          }, getDelays().nextHandDelay);
        } else {
          const u = currentUser;
          startNewHandTimeoutRef.current = setTimeout(() => {
            if (isMultiplayer && multiplayerModeActive) {
              switchToNextPlayer();
            }
            startNewHand(u, chips);
            startNewHandTimeoutRef.current = null;
          }, 300);
        }
      };

      refreshChipsAfterModal();
    });
  }, [
    resultModalOpen,
    resultData,
    currentUser,
    currentChips,
    isMultiplayer,
    multiplayerModeActive,
    refreshUserChips,
    getDelays,
  ]);

  // ====================== ALTERNAR JOGADOR ======================
  const switchToNextPlayer = useCallback(() => {
    if (
      isMultiplayer &&
      multiplayerModeActive &&
      multiplayerPlayers.length > 1
    ) {
      const nextIndex = (currentPlayerIndex + 1) % multiplayerPlayers.length;
      setCurrentPlayerIndex(nextIndex);
      const playerName = multiplayerPlayers[nextIndex]?.name || "Jogador";
      showNotification(`🎯 Vez de ${playerName}!`, false);
      return true;
    }
    return false;
  }, [
    isMultiplayer,
    multiplayerModeActive,
    multiplayerPlayers,
    currentPlayerIndex,
    showNotification,
  ]);

  // ====================== AVANÇAR FASE ======================
  function advanceStage(g, user) {
    if (isProcessingAction.current) return g;

    let state = { ...g };
    if (!state.playerAllin && !state.cpuAllin) {
      state.playerBet = 0;
      state.cpuBet = 0;
      state.currentBet = 0;
    }
    state.raiseCounter = 0;

    if (state.stage === "preflop") {
      state.stage = "flop";
      const flopCards = [];
      for (let i = 0; i < 3 && state.deck.length > 0; i++) {
        flopCards.push(state.deck.pop());
      }
      state.community = [...state.community, ...flopCards];
      state.gameStatus = "Flop - Sua vez";
      state.waitingPlayer = true;
      return state;
    } else if (state.stage === "flop") {
      state.stage = "turn";
      const turnCard = state.deck.pop();
      state.community = [...state.community, turnCard];
      state.gameStatus = "Turn - Sua vez";
      state.waitingPlayer = true;
      return state;
    } else if (state.stage === "turn") {
      state.stage = "river";
      const riverCard = state.deck.pop();
      state.community = [...state.community, riverCard];
      state.gameStatus = "River - Sua vez";
      state.waitingPlayer = true;
      return state;
    } else if (state.stage === "river") {
      return doShowdown(state, user);
    }

    if (state.playerAllin || state.cpuAllin) {
      return fastForwardToShowdown(state, user);
    }
    return state;
  }

  // ====================== INICIAR MÃO - CORRIGIDO ======================
  function startNewHand(user, initialMoney) {
    if (isProcessingAction.current) return;

    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    if (startNewHandTimeoutRef.current) {
      clearTimeout(startNewHandTimeoutRef.current);
      startNewHandTimeoutRef.current = null;
    }

    setGame((prev) => {
      let playerMoney =
        initialMoney !== undefined
          ? initialMoney
          : currentChips || session?.user?.chips || prev.playerMoney || 1000;

      let cpuMoney = prev.cpuMoney <= 0 ? 1000 : prev.cpuMoney;

      if (playerMoney <= 0 && !isAllInRef.current) {
        if (hasLostAllRef.current || playerMoney === 0) {
          showNotification(
            `💔 Você está sem fichas! Clique em RENOVAR FICHAS para recarregar.`,
            true,
          );
          return { ...prev, handActive: false };
        }
      }

      if (playerMoney <= 0) {
        showNotification(
          `❌ Você não tem fichas para jogar! Clique em RENOVAR FICHAS.`,
          true,
        );
        return { ...prev, handActive: false };
      }

      const deck = createDeck();

      try {
        soundManager.playSound("shuffle");
        setTimeout(() => {
          try {
            soundManager.playSound("deal");
          } catch (e) {}
        }, 200);
      } catch (e) {}

      const playerCards = [deck.pop(), deck.pop()];
      const cpuCards = [deck.pop(), deck.pop()];

      let pot = 0,
        playerBet = 0,
        cpuBet = 0,
        currentBet = 0;
      let playerAllin = false,
        cpuAllin = false;

      const sb = 25,
        bb = 50;

      if (playerMoney >= sb) {
        playerMoney -= sb;
        playerBet = sb;
        pot += sb;
      } else {
        playerBet = playerMoney;
        pot += playerMoney;
        playerMoney = 0;
        playerAllin = true;
      }

      if (cpuMoney >= bb) {
        cpuMoney -= bb;
        cpuBet = bb;
        pot += bb;
      } else {
        cpuBet = cpuMoney;
        pot += cpuMoney;
        cpuMoney = 0;
        cpuAllin = true;
      }
      currentBet = Math.max(playerBet, cpuBet);

      const newG = {
        deck,
        community: [],
        playerCards,
        cpuCards,
        pot,
        playerMoney,
        cpuMoney,
        currentBet,
        playerBet,
        cpuBet,
        stage: "preflop",
        handActive: true,
        waitingPlayer: true,
        gameOver: false,
        playerAllin,
        cpuAllin,
        raiseCounter: 0,
        showdownStarted: false,
        playerHandName: "",
        cpuHandName: "🔒 ???",
        winnerMsg: "",
        cpuThought: "",
        playerSuggestion: "",
        gameStatus: "Pré-flop - Sua vez",
      };

      const u = user || currentUser;
      setTimeout(() => saveChips(u, newG.playerMoney), 100);

      if (
        (playerAllin || cpuAllin) &&
        playerBet === currentBet &&
        cpuBet === currentBet
      ) {
        return fastForwardToShowdown(newG, u);
      }
      return newG;
    });
  }

  // ====================== TRIGGER CPU ACTION ======================
  function triggerCpuAction(g, user) {
    if (isProcessingAction.current) return;

    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    const delays = getDelays();

    cpuTimerRef.current = setTimeout(() => {
      setGame((prev) => {
        if (
          !prev.handActive ||
          prev.waitingPlayer ||
          isProcessingAction.current
        )
          return prev;

        if (prev.playerAllin) {
          const toCall = prev.currentBet - prev.cpuBet;

          if (toCall >= prev.cpuMoney) {
            const cpuAllInAmount = prev.cpuMoney;
            let state = { ...prev };
            state.cpuMoney = 0;
            state.cpuBet += cpuAllInAmount;
            state.pot += cpuAllInAmount;
            state.cpuAllin = true;

            if (state.cpuBet > state.currentBet) {
              state.currentBet = state.cpuBet;
            }

            showNotification(
              `🤖 CPU paga ${cpuAllInAmount} e está ALL-IN!`,
              true,
            );
            return fastForwardToShowdown(state, user);
          }

          const strength = calculateHandStrength(prev.cpuCards, prev.community);
          const potOdds = toCall / (prev.pot + toCall);
          const adjustedStrength = strength * 0.7 + (1 - potOdds) * 0.3;
          const willCall =
            adjustedStrength > 0.35 ||
            toCall <= 75 ||
            (strength > 0.4 && toCall <= 150) ||
            strength > 0.65;

          if (willCall && prev.cpuMoney > 0) {
            const callAmount = Math.min(toCall, prev.cpuMoney);
            let state = { ...prev };
            state.cpuMoney -= callAmount;
            state.cpuBet += callAmount;
            state.pot += callAmount;

            if (state.cpuMoney === 0) {
              state.cpuAllin = true;
              showNotification(
                `🤖 CPU paga ${callAmount} e está ALL-IN!`,
                true,
              );
            } else {
              showNotification(`🤖 CPU paga ${callAmount} fichas`, false);
            }

            if (state.playerAllin) {
              return fastForwardToShowdown(state, user);
            }
            return { ...state, waitingPlayer: true };
          } else {
            let state = { ...prev };
            state.handActive = false;
            state.playerMoney += state.pot;
            state.winnerMsg = "🤖 CPU DESISTIU! Você vence!";
            state.gameStatus = "CPU Fold";
            state.cpuThought = "🤖 CPU: 'Muito caro... Desisto.' 😞";
            showNotification(
              `🤖 CPU desistiu! Você ganhou ${state.pot} fichas!`,
              false,
            );
            saveChips(user || currentUser, state.playerMoney);
            setTimeout(
              () => startNewHand(user || currentUser, undefined),
              1500,
            );
            return state;
          }
        }

        const result = getCpuDecision(
          prev,
          advanceStage,
          showNotification,
          user,
        );

        if (!result.handActive && result.winnerMsg) {
          const u = user || currentUser;
          saveChips(u, result.playerMoney);
          setTimeout(() => startNewHand(u, undefined), 1500);
        }

        return result;
      });
    }, delays.cpuActionDelay);
  }

  // ====================== AÇÕES DO JOGADOR ======================
  function afterPlayerMove(state, user) {
    if (isProcessingAction.current) return state;

    if (
      state.playerBet === state.currentBet &&
      state.cpuBet === state.currentBet
    ) {
      return advanceStage(state, user);
    } else if (state.playerAllin && state.cpuBet === state.currentBet) {
      return fastForwardToShowdown(state, user);
    } else {
      setTimeout(() => triggerCpuAction(null, user), 0);
      return { ...state, waitingPlayer: false };
    }
  }

  function playerFold() {
    if (isProcessingAction.current) return;

    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    setGame((prev) => {
      if (!prev.handActive || !prev.waitingPlayer || prev.gameOver) return prev;
      const state = {
        ...prev,
        handActive: false,
        cpuMoney: prev.cpuMoney + prev.pot,
        winnerMsg: `❌ ${isMultiplayer && multiplayerModeActive ? multiplayerPlayers[currentPlayerIndex]?.name || "Jogador" : "Jogador"} desistiu! CPU vence.`,
        gameStatus: "Você desistiu",
        cpuThought: "🤖 CPU: 'Boa, ele desistiu!'",
      };

      const playerName =
        isMultiplayer && multiplayerModeActive
          ? multiplayerPlayers[currentPlayerIndex]?.name || "Jogador"
          : "Jogador";
      showNotification(
        `❌ ${playerName} desistiu! Perdeu ${prev.pot} fichas.`,
        true,
      );
      saveChips(currentUser, state.playerMoney);

      try {
        const baseUrl = window.location.origin;
        fetch(`${baseUrl}/api/save-game-state`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentUser,
            gameState: null,
          }),
        }).catch(() => {});
      } catch (e) {}

      setTimeout(() => {
        if (isMultiplayer && multiplayerModeActive) {
          switchToNextPlayer();
        }
        startNewHand(currentUser, undefined);
      }, 1500);
      return state;
    });
  }

  function playerCall() {
    if (isProcessingAction.current) return;

    setGame((prev) => {
      if (!prev.handActive || !prev.waitingPlayer || prev.gameOver) return prev;
      let state = { ...prev };
      let toCall = state.currentBet - state.playerBet;

      if (toCall <= 0) {
        showNotification("✅ Você deu CHECK", false);
        return afterPlayerMove(state, currentUser);
      }

      if (toCall >= state.playerMoney) {
        toCall = state.playerMoney;
        state.playerAllin = true;
      }

      state.playerMoney -= toCall;
      state.playerBet += toCall;
      state.pot += toCall;
      if (state.playerMoney === 0) state.playerAllin = true;

      showNotification(
        state.playerAllin
          ? `⚡ ALL-IN! Você pagou ${toCall} fichas!`
          : `💰 Você pagou ${toCall} fichas`,
        state.playerAllin,
      );
      state.gameStatus = state.playerAllin
        ? "Você pagou ALL-IN!"
        : `Você pagou ${toCall}`;
      saveChips(currentUser, state.playerMoney);
      return afterPlayerMove(state, currentUser);
    });
  }

  function playerRaise() {
    if (isProcessingAction.current) return;

    setGame((prev) => {
      if (
        !prev.handActive ||
        !prev.waitingPlayer ||
        prev.gameOver ||
        prev.playerAllin
      )
        return prev;
      const raiseAmount = 50 + prev.raiseCounter * 50;
      const needed = prev.currentBet - prev.playerBet + raiseAmount;

      if (needed > prev.playerMoney) {
        showNotification("❌ Fichas insuficientes!", true);
        return prev;
      }

      let state = { ...prev };
      state.playerMoney -= needed;
      state.playerBet += needed;
      state.pot += needed;
      state.currentBet = state.playerBet;
      state.raiseCounter++;
      if (state.playerMoney === 0) state.playerAllin = true;

      showNotification(
        `📈 Você aumentou para ${state.currentBet}! (+${raiseAmount})`,
        false,
      );
      state.gameStatus = `Você aumentou para ${state.currentBet}`;
      saveChips(currentUser, state.playerMoney);
      return afterPlayerMove(state, currentUser);
    });
  }

  function playerAllIn() {
    if (isProcessingAction.current) return;

    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    setGame((prev) => {
      if (
        !prev.handActive ||
        !prev.waitingPlayer ||
        prev.gameOver ||
        prev.playerAllin
      )
        return prev;

      let state = { ...prev };
      const amount = state.playerMoney;

      if (amount <= 0) {
        showNotification("❌ Você não tem fichas para all-in!", true);
        return prev;
      }

      let cpuCallAmount = state.currentBet - state.cpuBet;

      if (cpuCallAmount > state.cpuMoney) {
        const cpuAllInAmount = state.cpuMoney;
        state.cpuMoney = 0;
        state.cpuBet += cpuAllInAmount;
        state.pot += cpuAllInAmount;
        state.cpuAllin = true;

        if (state.cpuBet > state.currentBet) {
          state.currentBet = state.cpuBet;
        }

        showNotification(
          `⚡ CPU foi ALL-IN com ${cpuAllInAmount} fichas!`,
          true,
        );
      }

      state.playerMoney = 0;
      state.playerBet += amount;
      state.pot += amount;
      if (state.playerBet > state.currentBet) {
        state.currentBet = state.playerBet;
      }
      state.playerAllin = true;

      showNotification(`⚡⚡⚡ ALL-IN! ${amount} fichas! ⚡⚡⚡`, true);
      state.gameStatus = "⚡ VOCÊ FOI ALL-IN! ⚡";

      saveChips(currentUser, 0, true);
      isAllInRef.current = true;

      if (state.cpuAllin || state.cpuBet === state.currentBet) {
        return fastForwardToShowdown(state, currentUser);
      }

      return afterPlayerMove(state, currentUser);
    });
  }

  // ====================== NOVA MÃO ======================
  function resetSession() {
    if (isProcessingAction.current) return;

    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);

    const currentMoney = game.playerMoney || 0;

    if (currentMoney >= 1000) {
      if (
        !window.confirm(
          `⚠️ Você tem ${currentMoney} fichas. Deseja realmente recarregar para 1000 fichas?`,
        )
      ) {
        return;
      }
    } else if (currentMoney > 0 && currentMoney < 1000) {
      if (
        !window.confirm(
          `ℹ️ Você tem ${currentMoney} fichas. Ao recarregar, receberá 1000 fichas grátis. Continuar?`,
        )
      ) {
        return;
      }
    }

    isAllInRef.current = false;
    hasLostAllRef.current = false;

    try {
      const baseUrl = window.location.origin;
      fetch(`${baseUrl}/api/save-game-state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser,
          gameState: null,
        }),
      }).catch(() => {});
    } catch (e) {}

    setGame((prev) => {
      const money = 1000;
      const playerName =
        isMultiplayer && multiplayerModeActive
          ? multiplayerPlayers[currentPlayerIndex]?.name || "Jogador"
          : currentUser || "Jogador";

      const message =
        currentMoney > 0 && currentMoney < 1000
          ? `🔄 ${playerName} foi recarregado com 1000 fichas! (${currentMoney} → 1000)`
          : `🔄 ${playerName} foi recarregado com 1000 fichas!`;

      showNotification(message, false);
      setTimeout(() => saveChips(currentUser, 1000), 100);

      return {
        ...prev,
        playerMoney: money,
        cpuMoney: 1000,
        gameOver: false,
        handActive: false,
        showdownStarted: false,
        winnerMsg: "",
        cpuThought: "",
        playerHandName: "",
        cpuHandName: "🔒 ???",
      };
    });

    setTimeout(() => startNewHand(currentUser, 1000), 100);
  }

  // ====================== TOGGLE TURBO ======================
  const handleTurboToggle = useCallback((turboState) => {
    setIsTurbo(turboState);
  }, []);

  // ====================== MULTIPLAYER ======================
  const handleMultiplayerStart = useCallback(
    (config) => {
      setMultiplayerPlayers(config.players);
      setIsMultiplayer(true);
      setMultiplayerModeActive(true);
      setCurrentPlayerIndex(0);
      setShowMultiplayerModal(false);
      showNotification(`👥 Modo 2 Jogadores ativado!`, false);
      setTimeout(() => {
        startNewHand(currentUser, config.players[0].chips);
      }, 100);
    },
    [currentUser],
  );

  const handleSwitchPlayer = useCallback(
    (index) => {
      if (index !== currentPlayerIndex) {
        setCurrentPlayerIndex(index);
        const playerName = multiplayerPlayers[index]?.name || "Jogador";
        showNotification(`🎯 Vez de ${playerName}!`, false);
      }
    },
    [currentPlayerIndex, multiplayerPlayers],
  );

  // ====================== ONLINE ======================
  const handleJoinOnlineGame = useCallback(
    (data) => {
      setOnlineGame(data);
      setShowOnline(false);
      pauseCpuGame();
      hasLeftOnlineRef.current = false;
      showNotification(`🌐 Entrou na sala ${data.roomId}!`, false);
    },
    [showNotification, pauseCpuGame],
  );

  const handleLeaveOnlineGame = useCallback(
    async (shouldReset = false) => {
      setOnlineGame(null);
      showNotification("👋 Saiu do jogo online", false);

      hasLeftOnlineRef.current = true;

      await refreshUserChips();
    },
    [showNotification, refreshUserChips],
  );

  // ====================== SUGESTÃO DO JOGADOR ======================
  function getPlayerSuggestion(g) {
    if (!g || !g.playerCards || !g.playerCards.length) return "";

    if (g.stage === "preflop") {
      const isPair = g.playerCards[0].rank === g.playerCards[1].rank;
      const high = Math.max(g.playerCards[0].rank, g.playerCards[1].rank);
      if (isPair) return "🎯 Par - Considere aumentar";
      if (high >= 12) return "📈 Cartas altas - CALL seguro";
      return "⚠️ Mão fraca - Cuidado";
    }
    if (g.community && g.community.length >= 3) {
      const score = getHandRank(g.playerCards, g.community);
      return `📊 ${getHandName(score)}`;
    }
    return "";
  }

  // ====================== FUNÇÃO PARA CALCULAR CARTAS VAZIAS ======================
  const getEmptyCardCount = useCallback(() => {
    const communityCount = game.community?.length || 0;
    const maxCards = 5;
    return Math.max(0, maxCards - communityCount);
  }, [game.community]);

  // ====================== EVENTO DE ATUALIZAÇÃO DE FICHAS ======================
  useEffect(() => {
    const handleChipsUpdate = (event) => {
      if (event.detail?.chips !== undefined) {
        setCurrentChips(event.detail.chips);
        setGame((prev) => ({ ...prev, playerMoney: event.detail.chips }));
      }
    };
    window.addEventListener("chips-updated", handleChipsUpdate);

    return () => {
      window.removeEventListener("chips-updated", handleChipsUpdate);
    };
  }, []);

  // ====================== ESCUTAR NOVAS CONQUISTAS ======================
  useEffect(() => {
    const handleNewAchievements = (event) => {
      const newAchs = event.detail?.achievements || [];
      if (newAchs.length > 0) {
        console.log("🏅 Novas conquistas detectadas:", newAchs);
        setNewAchievements(newAchs);
        setTimeout(() => setShowAchievementsModal(true), 1500);
      }
    };

    window.addEventListener("new-achievements", handleNewAchievements);

    return () => {
      window.removeEventListener("new-achievements", handleNewAchievements);
    };
  }, []);

  // ====================== MODAL DE RESULTADO - VERSÃO PREMIUM ======================
  function ResultModal({ data, onClose }) {
    if (!data) return null;

    const isWin = data.winner === "player";
    const isTie = data.winner === "tie";
    const [isClosing, setIsClosing] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
      document.body.style.overflow = "hidden";
      setIsResultModalOpen(true);

      const timer = setTimeout(() => setShowContent(true), 50);

      return () => {
        document.body.style.overflow = "";
        setIsResultModalOpen(false);
        clearTimeout(timer);
      };
    }, []);

    const handleClose = () => {
      if (isClosing) return;
      setIsClosing(true);
      setShowContent(false);
      setTimeout(() => onClose(), 300);
    };

    const renderCard = useCallback((card, index, isFlipped = false) => {
      if (!card) return null;
      const isRed = card.suit === "♥" || card.suit === "♦";
      return (
        <div
          key={`modal-card-${index}-${card.rank}${card.suit}`}
          style={{
            ...cardBaseStyle(isFlipped),
            ...(isFlipped ? cardBackStyle() : cardFrontStyle(isRed)),
          }}
        >
          {!isFlipped && (
            <>
              <span style={cardRankStyle(isRed)}>
                {card.rank === 14
                  ? "A"
                  : card.rank === 13
                    ? "K"
                    : card.rank === 12
                      ? "Q"
                      : card.rank === 11
                        ? "J"
                        : card.rank === 10
                          ? "10"
                          : card.rank}
              </span>
              <span style={cardSuitStyle(isRed)}>{card.suit}</span>
            </>
          )}
        </div>
      );
    }, []);

    const communityCards = useMemo(
      () => data.communityCards || [],
      [data.communityCards],
    );
    const playerCards = useMemo(
      () => data.playerCards || [],
      [data.playerCards],
    );
    const cpuCards = useMemo(() => data.cpuCards || [], [data.cpuCards]);

    const resultConfig = {
      win: {
        bg: "linear-gradient(145deg, #0d3b1e, #1a6a3a)",
        border: "2px solid #4caf50",
        glow: "0 0 60px rgba(76, 175, 80, 0.3)",
        accent: "#4caf50",
        icon: "🏆",
        title: "VITÓRIA!",
        titleColor: "#4caf50",
      },
      loss: {
        bg: "linear-gradient(145deg, #3b0d0d, #6a1a1a)",
        border: "2px solid #f44336",
        glow: "0 0 60px rgba(244, 67, 54, 0.3)",
        accent: "#f44336",
        icon: "💔",
        title: "DERROTA!",
        titleColor: "#f44336",
      },
      tie: {
        bg: "linear-gradient(145deg, #3b3a0d, #6a6a1a)",
        border: "2px solid #ffc107",
        glow: "0 0 60px rgba(255, 193, 7, 0.3)",
        accent: "#ffc107",
        icon: "🤝",
        title: "EMPATE!",
        titleColor: "#ffc107",
      },
    };

    const config = isWin
      ? resultConfig.win
      : isTie
        ? resultConfig.tie
        : resultConfig.loss;

    const AnimatedSection = ({ children, delay = 0, className = "" }) => (
      <div
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(20px)",
          transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
          willChange: "transform, opacity",
        }}
      >
        {children}
      </div>
    );

    return (
      <div
        style={{
          ...modalOverlayStyle(),
          opacity: isClosing ? 0 : 1,
          transition: "opacity 0.3s ease-out",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          style={{
            ...modalContentStyle(config),
            transform: isClosing
              ? "scale(0.95) rotate(-2deg)"
              : "scale(1) rotate(0deg)",
            transition:
              "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out",
            willChange: "transform, opacity",
          }}
        >
          <button
            onClick={handleClose}
            style={closeButtonStyle()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              e.currentTarget.style.transform = "rotate(90deg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.transform = "rotate(0deg)";
            }}
          >
            ✕
          </button>

          <AnimatedSection delay={0}>
            <div style={modalHeaderStyle()}>
              <div
                style={{
                  ...iconContainerStyle(),
                  border: `2px solid ${config.accent}`,
                  boxShadow: `0 0 40px ${config.accent}33`,
                }}
              >
                <span style={modalIconStyle()}>{config.icon}</span>
              </div>
              <h2 style={modalTitleStyle(config)}>{config.title}</h2>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div style={modalMessageStyle()}>
              <p style={modalWinnerStyle(config)}>{data.winnerMsg}</p>
            </div>
          </AnimatedSection>

          {communityCards.length > 0 ||
            playerCards.length > 0 ||
            (cpuCards.length > 0 && (
              <AnimatedSection delay={150}>
                <div style={modalCardsContainerStyle(config)}>
                  {communityCards.length > 0 && (
                    <div style={modalCommunityStyle()}>
                      <div style={modalCommunityLabelStyle()}>🔥 MESA</div>
                      <div style={modalCardsRowStyle()}>
                        {communityCards.map((card, i) => (
                          <div
                            key={`community-${i}`}
                            style={{
                              opacity: showContent ? 1 : 0,
                              transform: showContent
                                ? "translateY(0)"
                                : "translateY(30px)",
                              transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${200 + i * 80}ms`,
                              willChange: "transform, opacity",
                            }}
                          >
                            {renderCard(card, i, false)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={modalComparisonStyle()}>
                    <div style={modalPlayerStyle(true)}>
                      <div style={modalPlayerNameStyle(true)}>
                        <span
                          style={{ fontSize: "1.2rem", marginRight: "4px" }}
                        >
                          🃏
                        </span>
                        {data.playerName || "Você"}
                        {isWin && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "0.6rem",
                              background: "#4caf50",
                              color: "white",
                              padding: "1px 8px",
                              borderRadius: 10,
                            }}
                          >
                            VENCEDOR
                          </span>
                        )}
                      </div>
                      <div style={modalCardsRowStyle()}>
                        {playerCards.length > 0 ? (
                          playerCards.map((card, i) => (
                            <div
                              key={`player-${i}`}
                              style={{
                                opacity: showContent ? 1 : 0,
                                transform: showContent
                                  ? "translateY(0)"
                                  : "translateY(30px)",
                                transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${300 + i * 100}ms`,
                                willChange: "transform, opacity",
                              }}
                            >
                              {renderCard(card, i, false)}
                            </div>
                          ))
                        ) : (
                          <span style={{ color: "#aaa", fontSize: "0.65rem" }}>
                            Sem cartas
                          </span>
                        )}
                      </div>
                      <div style={modalHandStyle(true, config)}>
                        {data.playerHand}
                      </div>
                      {isWin && (
                        <div style={winnerBadgeStyle()}>
                          <span>🏆</span>
                        </div>
                      )}
                    </div>

                    <div style={modalVersusStyle()}>
                      <span>⚡</span>
                    </div>

                    <div style={modalPlayerStyle(false)}>
                      <div style={modalPlayerNameStyle(false)}>
                        <span
                          style={{ fontSize: "1.2rem", marginRight: "4px" }}
                        >
                          🤖
                        </span>
                        CPU
                        {!isWin && !isTie && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "0.6rem",
                              background: "#f44336",
                              color: "white",
                              padding: "1px 8px",
                              borderRadius: 10,
                            }}
                          >
                            VENCEDOR
                          </span>
                        )}
                      </div>
                      <div style={modalCardsRowStyle()}>
                        {cpuCards.length > 0 ? (
                          cpuCards.map((card, i) => (
                            <div
                              key={`cpu-${i}`}
                              style={{
                                opacity: showContent ? 1 : 0,
                                transform: showContent
                                  ? "translateY(0)"
                                  : "translateY(30px)",
                                transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${350 + i * 100}ms`,
                                willChange: "transform, opacity",
                              }}
                            >
                              {renderCard(card, i, false)}
                            </div>
                          ))
                        ) : (
                          <span style={{ color: "#aaa", fontSize: "0.65rem" }}>
                            Sem cartas
                          </span>
                        )}
                      </div>
                      <div style={modalHandStyle(false, config)}>
                        {data.cpuHand}
                      </div>
                      {!isWin && !isTie && (
                        <div style={loserBadgeStyle()}>
                          <span>💔</span>
                        </div>
                      )}
                      {isTie && (
                        <div style={tieBadgeStyle()}>
                          <span>🤝</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}

          <AnimatedSection delay={200}>
            <div style={modalPotStyle(config)}>
              <span style={{ fontSize: "1rem", fontWeight: "bold" }}>
                💰 Pote: <span style={{ color: "#ffd700" }}>{data.pot}</span>{" "}
                fichas
              </span>
              <div style={modalResultAmountStyle(isWin, isTie, data)}>
                {isWin && (
                  <span style={winAmountStyle()}>
                    <span style={{ fontSize: "0.8rem" }}>+</span>
                    {data.chipsWon}
                  </span>
                )}
                {!isWin && !isTie && (
                  <span style={loseAmountStyle()}>
                    <span style={{ fontSize: "0.8rem" }}>-</span>
                    {data.chipsLost}
                  </span>
                )}
                {isTie && (
                  <span style={tieAmountStyle()}>
                    <span style={{ fontSize: "0.8rem" }}>+</span>
                    {data.split}
                  </span>
                )}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={250}>
            <div style={modalCpuThoughtStyle(config)}>
              <span style={{ opacity: 0.5 }}>💭</span> {data.cpuThought}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <button
              onClick={handleClose}
              style={{
                ...modalCloseButtonStyle(config),
                opacity: isClosing ? 0.5 : 1,
                cursor: isClosing ? "not-allowed" : "pointer",
              }}
              disabled={isClosing}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = `0 6px 20px ${config.accent}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = `0 4px 0 #7a4c1a`;
              }}
            >
              {isClosing ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ animation: "spin 0.8s linear infinite" }}>
                    ⏳
                  </span>
                  FECHANDO...
                </span>
              ) : (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span>▶</span>
                  CONTINUAR
                </span>
              )}
            </button>
          </AnimatedSection>
        </div>
      </div>
    );
  }

  // ====================== RENDER ======================
  const g = game;
  const suggestion = getPlayerSuggestion(g);
  const showCpuCards = !g.handActive || g.stage === "showdown";
  const disable =
    !g.handActive ||
    !g.waitingPlayer ||
    g.gameOver ||
    g.stage === "showdown" ||
    g.playerMoney <= 0 ||
    g.playerAllin ||
    isProcessingAction.current;
  const toCall = g.currentBet - g.playerBet;
  const nextRaise = 50 + g.raiseCounter * 50;
  const canRaise =
    !disable &&
    !g.playerAllin &&
    g.currentBet - g.playerBet + nextRaise <= g.playerMoney;
  const stageNames = {
    preflop: "Pré-flop",
    flop: "Flop",
    turn: "Turn",
    river: "River",
    showdown: "Showdown",
  };

  // 🔥 ESTILO DO BOTÃO DE TORNEIOS
  const tournamentButtonStyle = {
    background: "rgba(255,215,0,0.15)",
    border: "1px solid rgba(255,215,0,0.3)",
    borderRadius: 20,
    padding: "8px 16px",
    color: "gold",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
    transition: "all 0.3s ease",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  if (isLoading && status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "var(--text-primary)",
          fontSize: "1.5rem",
          transition: "var(--transition-theme)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <motion.div
            style={{ fontSize: "3rem", marginBottom: "20px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            🎴
          </motion.div>
          <p>Carregando seu jogo...</p>
        </div>
      </div>
    );
  }

  if (!gameInitialized.current && status === "authenticated") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "var(--text-primary)",
          fontSize: "1.5rem",
          transition: "var(--transition-theme)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <motion.div
            style={{ fontSize: "3rem", marginBottom: "20px" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            🎴
          </motion.div>
          <p>Preparando o jogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: 0,
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Segoe UI','Poppins',system-ui,sans-serif",
        padding: 15,
        userSelect: "none",
        position: "relative",
        transition: "var(--transition-theme)",
      }}
    >
      {currentUser && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ThemeToggle />
          <motion.button
            onClick={() => signOut()}
            style={{
              background: "rgba(200,50,50,0.8)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 20,
              cursor: "pointer",
              fontWeight: "bold",
              backdropFilter: "blur(4px)",
              fontSize: "0.9rem",
            }}
            whileHover={{ scale: 1.05, background: "rgba(200,50,50,0.95)" }}
            whileTap={{ scale: 0.95 }}
          >
            🚪 Sair
          </motion.button>
        </div>
      )}

      {/* 🔥 BOTÃO TORNEIOS */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 100,
        }}
      >
        <motion.button
          onClick={() => setShowTournamentLobby(true)}
          style={tournamentButtonStyle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🏅 Torneios
        </motion.button>
      </div>

      <ToolbarButtons
        isTurbo={isTurbo}
        onTurboToggle={handleTurboToggle}
        onMultiplayerClick={() => setShowMultiplayerModal(true)}
        isMultiplayerActive={multiplayerModeActive}
        onOnlineClick={() => setShowOnline(true)}
        isOnlineActive={!!onlineGame}
      />

      {showMultiplayerModal && (
        <MultiplayerModal
          onStart={handleMultiplayerStart}
          onClose={() => setShowMultiplayerModal(false)}
        />
      )}

      {showOnline && !onlineGame && (
        <OnlineLobby
          onJoinGame={handleJoinOnlineGame}
          onCancel={() => setShowOnline(false)}
          currentUser={currentUser}
        />
      )}

      {onlineGame && (
        <OnlineGame
          roomId={onlineGame.roomId}
          playerName={onlineGame.playerName}
          socket={onlineGame.socket}
          onLeave={handleLeaveOnlineGame}
        />
      )}

      {resultModalOpen && resultData && (
        <ResultModal data={resultData} onClose={closeResultModal} />
      )}

      {showAchievementsModal && (
        <AchievementsModal
          onClose={() => {
            setShowAchievementsModal(false);
            setNewAchievements([]);
          }}
          newAchievements={newAchievements}
          username={currentUser}
        />
      )}

      {showFindingsModal && (
        <FindingsModal
          onClose={() => {
            setShowFindingsModal(false);
            setNewFindings([]);
          }}
          newFindings={newFindings}
        />
      )}

      {showTournamentLobby && (
        <TournamentLobby
          onClose={() => setShowTournamentLobby(false)}
          username={currentUser}
        />
      )}

      <motion.div
        style={{
          background:
            "radial-gradient(circle at 30% 20%, var(--bg-felt), var(--bg-primary))",
          borderRadius: 50,
          boxShadow:
            "var(--table-shadow), inset 0 2px 5px rgba(255,255,255,0.2)",
          padding: 20,
          maxWidth: 1600,
          width: "100%",
          transition: "var(--transition-theme)",
        }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div
          style={{
            background: "rgba(0,20,0,0.3)",
            borderRadius: 40,
            padding: 15,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-header)",
              backdropFilter: "blur(8px)",
              borderRadius: 50,
              padding: "8px 20px",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 10,
              transition: "var(--transition-theme)",
            }}
          >
            {[
              ["💰", g.pot],
              ["🎴", stageNames[g.stage] || g.stage],
              ["👤", g.playerMoney],
              ["🤖", g.cpuMoney],
              ["📊", `Aposta: ${g.currentBet}`],
              ["🚀", isTurbo ? "Turbo" : "Normal"],
              ["👥", isMultiplayer && multiplayerModeActive ? "2P" : "1P"],
            ].map(([icon, val], i) => (
              <motion.div
                key={`header-${i}-${icon}`}
                style={{
                  background: "var(--bg-button)",
                  padding: "5px 15px",
                  borderRadius: 40,
                  color: "var(--text-primary)",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap",
                  transition: "var(--transition-theme)",
                }}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span
                  style={{
                    color:
                      icon === "🚀"
                        ? isTurbo
                          ? "#ff9800"
                          : "#888"
                        : icon === "👥"
                          ? isMultiplayer && multiplayerModeActive
                            ? "#4caf50"
                            : "#888"
                          : "gold",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    marginRight: 5,
                  }}
                >
                  {icon}
                </span>
                {val}
              </motion.div>
            ))}
          </div>

          {isMultiplayer &&
            multiplayerModeActive &&
            multiplayerPlayers.length > 0 && (
              <PlayerSelector
                players={multiplayerPlayers}
                currentPlayer={currentPlayerIndex}
                onSelectPlayer={handleSwitchPlayer}
              />
            )}

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 3, minWidth: 280 }}>
              <GameTable
                communityCards={g.community || []}
                playerCards={g.playerCards || []}
                cpuCards={g.cpuCards || []}
                playerHandName={g.playerHandName}
                cpuHandName={g.cpuHandName}
                cpuThought={g.cpuThought}
                stage={g.stage}
                pot={g.pot}
                currentBet={g.currentBet}
                playerBet={g.playerBet}
                cpuBet={g.cpuBet}
                isTurbo={isTurbo}
                showCpuCards={showCpuCards}
                isMultiplayer={isMultiplayer && multiplayerModeActive}
                multiplayerPlayers={multiplayerPlayers}
                currentPlayerIndex={currentPlayerIndex}
                onSwitchPlayer={handleSwitchPlayer}
                currentUser={currentUser}
              />

              <ActionButtons
                disabled={disable}
                canRaise={canRaise}
                toCall={toCall}
                nextRaise={nextRaise}
                onFold={playerFold}
                onCall={playerCall}
                onRaise={playerRaise}
                onAllIn={playerAllIn}
                onReset={resetSession}
              />

              {g.winnerMsg && (
                <motion.div
                  style={{
                    background: "#000000bb",
                    backdropFilter: "blur(12px)",
                    borderRadius: 40,
                    padding: "6px 15px",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    color: "#ffd966",
                    marginTop: 12,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {g.winnerMsg}
                </motion.div>
              )}
              <div
                style={{
                  textAlign: "center",
                  marginTop: 12,
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  textShadow: "1px 1px 0 #2a1f0e",
                  transition: "var(--transition-theme)",
                }}
              >
                Desenvolvido por BruCe - 2026
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 220,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <StatusPanel
                stage={g.stage}
                pot={g.pot}
                currentBet={g.currentBet}
                playerBet={g.playerBet}
                cpuBet={g.cpuBet}
                nextRaise={nextRaise}
                notification={notification}
                stageNames={stageNames}
                gameStatus={g.gameStatus}
                winnerMsg={g.winnerMsg}
                isTurbo={isTurbo}
              />

              <StatsPanel
                username={currentUser}
                onShowAchievements={() => setShowAchievementsModal(true)}
                isResultModalOpen={isResultModalOpen}
              />

              <LevelDisplay
                username={currentUser}
                isResultModalOpen={isResultModalOpen}
                onShowAchievements={() => setShowAchievementsModal(true)}
                onShowFindings={() => setShowFindingsModal(true)}
              />

              <FriendsList username={currentUser} />
              <MissionsPanel
                username={currentUser}
                onChipsUpdated={(newChips) => {
                  setCurrentChips(newChips);
                  setGame((prev) => ({ ...prev, playerMoney: newChips }));
                }}
                isResultModalOpen={isResultModalOpen}
              />
              <HandHistory
                username={currentUser}
                isResultModalOpen={isResultModalOpen}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ====================== ESTILOS PREMIUM DO MODAL ======================

function modalOverlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.88)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: 20,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };
}

function modalContentStyle(config) {
  return {
    background: config.bg,
    padding: "24px 28px",
    borderRadius: 24,
    maxWidth: 520,
    width: "100%",
    color: "white",
    border: config.border,
    boxShadow: `0 20px 60px rgba(0,0,0,0.6), ${config.glow}`,
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255,255,255,0.1) transparent",
  };
}

function closeButtonStyle() {
  return {
    position: "absolute",
    top: 12,
    right: 16,
    background: "rgba(255,255,255,0.05)",
    border: "none",
    color: "#fff",
    fontSize: "1.1rem",
    cursor: "pointer",
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    opacity: 0.6,
  };
}

function iconContainerStyle() {
  return {
    width: 60,
    height: 60,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.2)",
    backdropFilter: "blur(4px)",
  };
}

function modalIconStyle() {
  return {
    fontSize: "2.8rem",
    lineHeight: 1,
  };
}

function modalTitleStyle(config) {
  return {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: "800",
    color: config.titleColor,
    textShadow: `0 0 30px ${config.accent}44`,
    letterSpacing: "1px",
  };
}

function modalHeaderStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    marginBottom: "8px",
  };
}

function modalMessageStyle() {
  return {
    textAlign: "center",
    marginBottom: "12px",
  };
}

function modalWinnerStyle(config) {
  return {
    fontSize: "1.05rem",
    fontWeight: "600",
    color: config.accent,
    margin: 0,
    padding: "6px 16px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 20,
    display: "inline-block",
  };
}

function modalCardsContainerStyle(config) {
  return {
    background: "rgba(0,0,0,0.2)",
    borderRadius: 16,
    padding: "10px",
    marginBottom: "10px",
    border: `1px solid ${config.accent}22`,
  };
}

function modalCommunityStyle() {
  return {
    textAlign: "center",
    marginBottom: "8px",
    padding: "4px",
    background: "rgba(0,0,0,0.15)",
    borderRadius: 10,
  };
}

function modalCommunityLabelStyle() {
  return {
    fontSize: "0.55rem",
    color: "#aaa",
    marginBottom: "4px",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "2px",
    fontWeight: "600",
  };
}

function modalCardsRowStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "4px",
    flexWrap: "wrap",
    padding: "4px 0",
    minHeight: "65px",
  };
}

function cardBaseStyle(isFlipped) {
  return {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 64,
    margin: "1px",
    borderRadius: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    flexShrink: 0,
    position: "relative",
    transition: "transform 0.2s ease",
    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
  };
}

function cardFrontStyle(isRed) {
  return {
    background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
    border: "1px solid #ddd",
    color: isRed ? "#cc0000" : "#000",
  };
}

function cardBackStyle() {
  return {
    background:
      "repeating-linear-gradient(45deg, #2b5797, #2b5797 8px, #1d3f6e 8px, #1d3f6e 16px)",
    border: "2px solid #1a3a6e",
  };
}

function cardRankStyle(isRed) {
  return {
    fontSize: "0.9rem",
    fontWeight: "800",
    color: isRed ? "#cc0000" : "#000",
    lineHeight: 1,
    marginBottom: "-2px",
  };
}

function cardSuitStyle(isRed) {
  return {
    fontSize: "1rem",
    color: isRed ? "#cc0000" : "#000",
    lineHeight: 1,
  };
}

function modalComparisonStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    padding: "6px 0",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "4px",
    gap: "6px",
  };
}

function modalPlayerStyle(isPlayer) {
  return {
    flex: 1,
    textAlign: isPlayer ? "left" : "right",
    minWidth: "90px",
    padding: "4px 6px",
    borderRadius: 10,
    background: isPlayer ? "rgba(76,175,80,0.05)" : "rgba(255,152,0,0.05)",
  };
}

function modalPlayerNameStyle(isPlayer) {
  return {
    fontSize: "0.7rem",
    fontWeight: "700",
    color: isPlayer ? "#4caf50" : "#ff9800",
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: isPlayer ? "flex-start" : "flex-end",
    gap: "4px",
    flexWrap: "wrap",
  };
}

function modalHandStyle(isPlayer, config) {
  return {
    fontSize: "0.78rem",
    fontWeight: "700",
    color: isPlayer ? "#4caf50" : "#ff9800",
    background: "rgba(0,0,0,0.25)",
    padding: "2px 10px",
    borderRadius: 12,
    display: "inline-block",
    marginTop: "4px",
    border: `1px solid ${config.accent}22`,
  };
}

function modalVersusStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    fontWeight: "800",
    color: "#888",
    padding: "0 8px",
    minWidth: "30px",
  };
}

function modalPotStyle(config) {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    fontSize: "0.9rem",
    background: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    marginBottom: "6px",
    border: `1px solid ${config.accent}11`,
  };
}

function modalResultAmountStyle(isWin, isTie, data) {
  return {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };
}

function winAmountStyle() {
  return {
    color: "#4caf50",
    fontWeight: "800",
    fontSize: "1.1rem",
    textShadow: "0 0 20px rgba(76,175,80,0.3)",
  };
}

function loseAmountStyle() {
  return {
    color: "#f44336",
    fontWeight: "800",
    fontSize: "1.1rem",
    textShadow: "0 0 20px rgba(244,67,54,0.3)",
  };
}

function tieAmountStyle() {
  return {
    color: "#ffc107",
    fontWeight: "800",
    fontSize: "1.1rem",
    textShadow: "0 0 20px rgba(255,193,7,0.3)",
  };
}

function modalCpuThoughtStyle(config) {
  return {
    textAlign: "center",
    fontSize: "0.7rem",
    color: "#bbb",
    fontStyle: "italic",
    padding: "6px 12px",
    marginBottom: "8px",
    background: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    minHeight: "22px",
    border: `1px solid ${config.accent}11`,
  };
}

function modalCloseButtonStyle(config) {
  return {
    background: "linear-gradient(145deg, #f7d97c, #d6a12e)",
    border: "none",
    fontWeight: "700",
    fontSize: "0.9rem",
    padding: "10px 24px",
    borderRadius: 50,
    boxShadow: "0 4px 0 #7a4c1a, 0 0 30px rgba(255,215,0,0.1)",
    color: "#2e241f",
    width: "100%",
    transition: "all 0.2s ease",
    marginTop: "4px",
    letterSpacing: "0.5px",
    position: "relative",
    overflow: "hidden",
  };
}

function winnerBadgeStyle() {
  return {
    marginTop: "4px",
    fontSize: "1.2rem",
    animation: "bounce 1s ease-in-out infinite",
  };
}

function loserBadgeStyle() {
  return {
    marginTop: "4px",
    fontSize: "1.2rem",
    opacity: 0.6,
  };
}

function tieBadgeStyle() {
  return {
    marginTop: "4px",
    fontSize: "1.2rem",
    animation: "pulse 1.5s ease-in-out infinite",
  };
}

// app/page.jsx - COMPLETO OTIMIZADO COM FLUXO MULTIPLAYER CORRIGIDO
"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  memo,
} from "react";
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
import { soundManager } from "@/lib/sound.js";
import { useGame, useGameActions } from "@/lib/context/GameContext";

// ====================== IMPORTS DE COMPONENTES ======================
import Card from "@/components/Poker/Card.jsx";
import ActionButtons from "@/components/Poker/ActionButtons.jsx";
import StatusPanel from "@/components/Poker/StatusPanel.jsx";
import StatsPanel from "@/components/Poker/StatsPanel.jsx";
import HandHistory from "@/components/Poker/HandHistory.jsx";
import LevelDisplay from "@/components/Poker/LevelDisplay.jsx";
import FriendsList from "@/components/Poker/FriendsList.jsx";
import MissionsPanel from "@/components/Poker/MissionsPanel.jsx";
import GameTable from "@/components/Poker/GameTable.jsx";
import PlayerSelector from "@/components/Poker/PlayerSelector.jsx";
import ToolbarButtons from "@/components/Poker/ToolbarButtons.jsx";
import MultiplayerModal from "@/components/Poker/MultiplayerModal.jsx";

// 🔥 LAZY LOADING PARA COMPONENTES PESADOS
const AchievementsModal = lazy(
  () => import("@/components/Poker/AchievementsModal.jsx"),
);
const FindingsModal = lazy(
  () => import("@/components/Poker/FindingsModal.jsx"),
);
const TournamentLobby = lazy(
  () => import("@/components/Poker/TournamentLobby.jsx"),
);
const OnlineLobby = lazy(() => import("@/components/Poker/OnlineLobby.jsx"));
const OnlineGame = lazy(() => import("@/components/Poker/OnlineGame.jsx"));

// 🔥 MEMOIZAR COMPONENTES
const MemoizedGameTable = memo(GameTable);
const MemoizedActionButtons = memo(ActionButtons);
const MemoizedStatusPanel = memo(StatusPanel);
const MemoizedStatsPanel = memo(StatsPanel);
const MemoizedLevelDisplay = memo(LevelDisplay);
const MemoizedFriendsList = memo(FriendsList);
const MemoizedMissionsPanel = memo(MissionsPanel);
const MemoizedHandHistory = memo(HandHistory);
const MemoizedToolbarButtons = memo(ToolbarButtons);
const MemoizedPlayerSelector = memo(PlayerSelector);
const MemoizedMultiplayerModal = memo(MultiplayerModal);

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

  // 🔥 USAR O CONTEXT
  const { state, setGame, setLoading, updateChips } = useGame();
  const game = state.game || INITIAL_GAME;

  // ====================== ESTADOS LOCAIS ======================
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
  const [pendingInviteJoin, setPendingInviteJoin] = useState(null);
  const [showOnlineLobby, setShowOnlineLobby] = useState(false);

  // 🔥 TOAST
  const [toastMessage, setToastMessage] = useState(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastType, setToastType] = useState("info");
  const toastTimerRef = useRef(null);
  const toastClosingRef = useRef(false);

  // ====================== REFS ======================
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
  const onlineGameRef = useRef(null);

  const currentUser = session?.user?.username || null;
  const userChips = session?.user?.chips || 0;

  // ============================================================
  // 🔥 TOAST PADRONIZADO
  // ============================================================

  const showToastMessage = useCallback(
    (message, type = "info", duration = 6000) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }

      if (toastMessage && toastMessage === message) {
        toastTimerRef.current = setTimeout(() => {
          setIsToastVisible(false);
          toastTimerRef.current = null;
          setTimeout(() => setToastMessage(null), 400);
        }, duration);
        return;
      }

      setToastMessage(message);
      setToastType(type);
      setIsToastVisible(true);

      toastTimerRef.current = setTimeout(() => {
        setIsToastVisible(false);
        toastTimerRef.current = null;
        setTimeout(() => setToastMessage(null), 400);
      }, duration);
    },
    [toastMessage],
  );

  const closeToast = useCallback(() => {
    if (toastClosingRef.current) return;
    toastClosingRef.current = true;

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setIsToastVisible(false);

    setTimeout(() => {
      setToastMessage(null);
      toastClosingRef.current = false;
    }, 400);
  }, []);

  // ============================================================
  // 🔥 TOAST COMPONENTE
  // ============================================================
  const ToastNotification = useCallback(() => {
    if (!isToastVisible || !toastMessage) return null;

    const isError = toastType === "error" || toastMessage.includes("❌");
    const isLevelUp =
      toastMessage.includes("🎊") || toastMessage.includes("Subiu para Nível");
    const isAchievement =
      toastMessage.includes("🎉") || toastMessage.includes("Conquista");

    let icon = "ℹ️";
    if (isError) icon = "❌";
    else if (isLevelUp) icon = "🎊";
    else if (isAchievement) icon = "🎉";
    else if (toastMessage.includes("✅")) icon = "✅";

    return (
      <motion.div
        style={toastStyle(isError, isLevelUp || isAchievement)}
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
          duration: 0.25,
        }}
        key="toast-main"
      >
        <span style={toastIconStyle()}>{icon}</span>
        <span style={toastTextStyle()}>{toastMessage}</span>
        <button onClick={closeToast} style={toastCloseStyle()}>
          ✕
        </button>
      </motion.div>
    );
  }, [isToastVisible, toastMessage, toastType, closeToast]);

  // ============================================================
  // 🔥 ESTILOS DO TOAST
  // ============================================================
  function toastStyle(isError, isSpecial) {
    let bgColor, textColor, borderColor;

    if (isError) {
      bgColor = "rgba(220, 50, 50, 0.95)";
      textColor = "#ffffff";
      borderColor = "rgba(244, 67, 54, 0.3)";
    } else if (isSpecial) {
      bgColor = "rgba(255, 215, 0, 0.95)";
      textColor = "#1a1a1a";
      borderColor = "rgba(255, 215, 0, 0.5)";
    } else {
      bgColor = "rgba(30, 30, 40, 0.92)";
      textColor = "#ffffff";
      borderColor = "rgba(255, 255, 255, 0.1)";
    }

    return {
      position: "fixed",
      top: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      background: bgColor,
      color: textColor,
      padding: "14px 24px",
      borderRadius: "16px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      maxWidth: "min(90vw, 500px)",
      width: "auto",
      minWidth: "min(280px, 90vw)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${borderColor}`,
      flexWrap: "nowrap",
      overflow: "hidden",
      boxSizing: "border-box",
    };
  }

  function toastIconStyle() {
    return {
      fontSize: "1.4rem",
      flexShrink: 0,
      width: "28px",
      textAlign: "center",
    };
  }

  function toastTextStyle() {
    return {
      flex: "1 1 auto",
      fontSize: "0.9rem",
      fontWeight: "500",
      lineHeight: "1.4",
      minWidth: "0",
      wordBreak: "break-word",
      overflowWrap: "break-word",
      maxWidth: "100%",
    };
  }

  function toastCloseStyle() {
    return {
      background: "none",
      border: "none",
      color: "inherit",
      cursor: "pointer",
      fontSize: "1.1rem",
      opacity: 0.5,
      padding: "4px 6px",
      transition: "all 0.3s ease",
      flexShrink: 0,
      borderRadius: "50%",
      lineHeight: 1,
      marginLeft: "2px",
    };
  }

  // ====================== BUSCAR FICHAS ======================
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

  // ====================== ATUALIZAR FICHAS ======================
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
        updateChips(chips);
        if (!isCpuGamePaused) {
          setGame((prev) => {
            const currentGame = prev || INITIAL_GAME;
            if (!currentGame.handActive || currentGame.playerMoney !== chips) {
              return { ...currentGame, playerMoney: chips };
            }
            return currentGame;
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
    updateChips,
    setGame,
  ]);

  // ====================== SALVAR FICHAS ======================
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
          updateChips(chips);
          if (!isCpuGamePaused) {
            setGame((prev) => {
              const currentGame = prev || INITIAL_GAME;
              return { ...currentGame, playerMoney: chips };
            });
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
      updateChips,
      setGame,
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

  // ====================== FORÇAR RESTAURAÇÃO ======================
  const restoreCpuGame = useCallback(async () => {
    const chips = await fetchChipsFromDB();
    const finalChips = chips || currentChips || session?.user?.chips || 1000;

    setCurrentChips(finalChips);
    updateChips(finalChips);
    setIsCpuGamePaused(false);

    setGame({
      ...INITIAL_GAME,
      playerMoney: finalChips,
      cpuMoney: 1000,
    });

    setTimeout(() => {
      startNewHand(currentUser, finalChips);
    }, 300);

    await update();
  }, [
    fetchChipsFromDB,
    currentChips,
    session,
    currentUser,
    update,
    updateChips,
    setGame,
  ]);

  // ====================== useEffectS ======================
  useEffect(() => {
    if (status === "authenticated" && currentUser && !chipsSyncedRef.current) {
      chipsSyncedRef.current = true;
      setTimeout(() => refreshUserChips(), 100);
    }
  }, [status, currentUser, refreshUserChips]);

  useEffect(() => {
    if (!onlineGame && !showOnline && currentUser && hasLeftOnlineRef.current) {
      hasLeftOnlineRef.current = false;
      restoreCpuGame();
    }
  }, [onlineGame, showOnline, currentUser, restoreCpuGame]);

  useEffect(() => {
    if (status === "authenticated" && currentUser) {
      const syncChips = async () => {
        const chips = await fetchChipsFromDB();
        if (chips !== null && chips !== currentChips) {
          setCurrentChips(chips);
          updateChips(chips);
          setGame((prev) => {
            const currentGame = prev || INITIAL_GAME;
            return { ...currentGame, playerMoney: chips };
          });
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
  }, [
    status,
    currentUser,
    fetchChipsFromDB,
    currentChips,
    updateChips,
    setGame,
  ]);

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

  // ====================== REDIRECIONAR ======================
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

  // ============================================================
  // 🔥 NOTIFICAÇÃO
  // ============================================================
  const showNotification = useCallback(
    (msg, isError = false) => {
      setNotification({ msg, isError, visible: true });

      const isImportant =
        msg.includes("🎊 Subiu para Nível") ||
        msg.includes("🎉 Conquista") ||
        msg.includes("🏅 Achado");

      if (isImportant) {
        const type = isError ? "error" : "info";
        const duration = msg.includes("🎊 Subiu para Nível") ? 7000 : 5000;
        showToastMessage(msg, type, duration);
      }

      try {
        if (!isError && msg.includes("VENCEU")) {
          if (msg.includes("ALL-IN")) {
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
      } catch (e) {}

      setTimeout(
        () => setNotification((n) => ({ ...n, visible: false })),
        2000,
      );
    },
    [showToastMessage],
  );

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
        setLoading(true);
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
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Erro ao recuperar estado:", error);
        }

        const chips = currentChips || userChips || 1000;
        startNewHand(currentUser, chips);
        gameInitialized.current = true;
        setIsLoading(false);
        setLoading(false);
      };

      loadGameState();
    }
  }, [
    status,
    currentUser,
    userChips,
    currentChips,
    setGame,
    setLoading,
    showNotification,
  ]);

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
      if (!currentUser) return;

      if (saveHandHistoryRef.current) return;

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

  // ====================== DO SHOWDOWN ======================
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

  // ====================== FECHAR MODAL ======================
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

  // ====================== INICIAR MÃO ======================
  function startNewHand(user, initialMoney) {
    if (isProcessingAction.current) return;

    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    if (startNewHandTimeoutRef.current) {
      clearTimeout(startNewHandTimeoutRef.current);
      startNewHandTimeoutRef.current = null;
    }

    setGame((prev) => {
      const currentGame = prev || INITIAL_GAME;
      let playerMoney =
        initialMoney !== undefined
          ? initialMoney
          : currentChips ||
            session?.user?.chips ||
            currentGame.playerMoney ||
            1000;

      let cpuMoney = currentGame.cpuMoney <= 0 ? 1000 : currentGame.cpuMoney;

      if (playerMoney <= 0 && !isAllInRef.current) {
        if (hasLostAllRef.current || playerMoney === 0) {
          showNotification(
            `💔 Você está sem fichas! Clique em RENOVAR FICHAS para recarregar.`,
            true,
          );
          return { ...currentGame, handActive: false };
        }
      }

      if (playerMoney <= 0) {
        showNotification(
          `❌ Você não tem fichas para jogar! Clique em RENOVAR FICHAS.`,
          true,
        );
        return { ...currentGame, handActive: false };
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
        const currentGame = prev || INITIAL_GAME;
        if (
          !currentGame.handActive ||
          currentGame.waitingPlayer ||
          isProcessingAction.current
        )
          return currentGame;

        if (currentGame.playerAllin) {
          const toCall = currentGame.currentBet - currentGame.cpuBet;

          if (toCall >= currentGame.cpuMoney) {
            const cpuAllInAmount = currentGame.cpuMoney;
            let state = { ...currentGame };
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

          const strength = calculateHandStrength(
            currentGame.cpuCards,
            currentGame.community,
          );
          const potOdds = toCall / (currentGame.pot + toCall);
          const adjustedStrength = strength * 0.7 + (1 - potOdds) * 0.3;
          const willCall =
            adjustedStrength > 0.35 ||
            toCall <= 75 ||
            (strength > 0.4 && toCall <= 150) ||
            strength > 0.65;

          if (willCall && currentGame.cpuMoney > 0) {
            const callAmount = Math.min(toCall, currentGame.cpuMoney);
            let state = { ...currentGame };
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
            let state = { ...currentGame };
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
          currentGame,
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
      const currentGame = prev || INITIAL_GAME;
      if (
        !currentGame.handActive ||
        !currentGame.waitingPlayer ||
        currentGame.gameOver
      )
        return currentGame;
      const state = {
        ...currentGame,
        handActive: false,
        cpuMoney: currentGame.cpuMoney + currentGame.pot,
        winnerMsg: `❌ ${isMultiplayer && multiplayerModeActive ? multiplayerPlayers[currentPlayerIndex]?.name || "Jogador" : "Jogador"} desistiu! CPU vence.`,
        gameStatus: "Você desistiu",
        cpuThought: "🤖 CPU: 'Boa, ele desistiu!'",
      };

      const playerName =
        isMultiplayer && multiplayerModeActive
          ? multiplayerPlayers[currentPlayerIndex]?.name || "Jogador"
          : "Jogador";
      showNotification(
        `❌ ${playerName} desistiu! Perdeu ${currentGame.pot} fichas.`,
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
      const currentGame = prev || INITIAL_GAME;
      if (
        !currentGame.handActive ||
        !currentGame.waitingPlayer ||
        currentGame.gameOver
      )
        return currentGame;
      let state = { ...currentGame };
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
      const currentGame = prev || INITIAL_GAME;
      if (
        !currentGame.handActive ||
        !currentGame.waitingPlayer ||
        currentGame.gameOver ||
        currentGame.playerAllin
      )
        return currentGame;
      const raiseAmount = 50 + currentGame.raiseCounter * 50;
      const needed =
        currentGame.currentBet - currentGame.playerBet + raiseAmount;

      if (needed > currentGame.playerMoney) {
        showNotification("❌ Fichas insuficientes!", true);
        return currentGame;
      }

      let state = { ...currentGame };
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
      const currentGame = prev || INITIAL_GAME;
      if (
        !currentGame.handActive ||
        !currentGame.waitingPlayer ||
        currentGame.gameOver ||
        currentGame.playerAllin
      )
        return currentGame;

      let state = { ...currentGame };
      const amount = state.playerMoney;

      if (amount <= 0) {
        showNotification("❌ Você não tem fichas para all-in!", true);
        return currentGame;
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
      const currentGame = prev || INITIAL_GAME;
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
        ...currentGame,
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
      console.log("🎮 [ONLINE] Entrando no jogo online:", data);

      if (data && data.roomId) {
        if (data.isInviteAccepted) {
          setPendingInviteJoin(null);
        }

        // 🔥 RESETAR O JOGO CPU ANTES DE ENTRAR NO MULTIPLAYER
        if (!isCpuGamePaused) {
          pauseCpuGame();
        }

        setOnlineGame(data);
        setShowOnline(false);
        setShowOnlineLobby(false);
        hasLeftOnlineRef.current = false;
        onlineGameRef.current = data;
        showNotification(`🌐 Entrou na sala ${data.roomId}!`, false);
      } else if (data === null) {
        console.log("👋 Saindo do multiplayer, resetando estado...");
        handleLeaveOnlineGame(true);
      }
    },
    [showNotification, pauseCpuGame, isCpuGamePaused],
  );

  const handleLeaveOnlineGame = useCallback(
    async (shouldReset = false) => {
      console.log("👋 handleLeaveOnlineGame chamado:", { shouldReset });

      setOnlineGame(null);
      onlineGameRef.current = null;
      setShowOnlineLobby(false);

      if (shouldReset) {
        showNotification("👋 Saiu do jogo online", false);
      }

      hasLeftOnlineRef.current = true;

      // 🔥 NOTIFICAR FRIENDSLIST
      if (handleJoinOnlineGame) {
        handleJoinOnlineGame(null);
      }

      // 🔥 RESTAURAR O JOGO CPU
      await restoreCpuGame();

      // 🔥 FORÇAR ATUALIZAÇÃO DE FICHAS
      await refreshUserChips();
    },
    [showNotification, refreshUserChips, handleJoinOnlineGame, restoreCpuGame],
  );

  // ====================== SUGESTÃO DO JOGADOR ======================
  const getPlayerSuggestion = useCallback((g) => {
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
  }, []);

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
        updateChips(event.detail.chips);
        setGame((prev) => {
          const currentGame = prev || INITIAL_GAME;
          return { ...currentGame, playerMoney: event.detail.chips };
        });
      }
    };
    window.addEventListener("chips-updated", handleChipsUpdate);

    return () => {
      window.removeEventListener("chips-updated", handleChipsUpdate);
    };
  }, [updateChips, setGame]);

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

  // ============================================================
  // 🔥 MODAL DE RESULTADO (MANTIDO IGUAL - MUITO GRANDE PARA REPETIR)
  // ============================================================
  // [O ResultModal permanece o mesmo do seu arquivo original]
  // ... (mantenha o ResultModal exatamente como estava)

  // ============================================================
  // 🔥 ESTILOS DO MODAL (MANTIDOS IGUAIS)
  // ============================================================
  // [Os estilos permanecem os mesmos do seu arquivo original]

  // ====================== RENDER PRINCIPAL ======================
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
    <>
      {/* 🔥 TOAST */}
      <AnimatePresence mode="wait">
        <ToastNotification />
      </AnimatePresence>

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
        {/* 🔥 BOTÃO DE SAIR */}
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

        {/* 🔥 TOOLBAR */}
        <MemoizedToolbarButtons
          isTurbo={isTurbo}
          onTurboToggle={handleTurboToggle}
          onMultiplayerClick={() => setShowMultiplayerModal(true)}
          isMultiplayerActive={multiplayerModeActive}
          onOnlineClick={() => {
            if (onlineGame) {
              // Se já estiver em um jogo, volta ao lobby
              handleLeaveOnlineGame(true);
            } else {
              setShowOnline(true);
              setShowOnlineLobby(true);
            }
          }}
          isOnlineActive={!!onlineGame}
          onTournamentClick={() => setShowTournamentLobby(true)}
        />

        {/* 🔥 MODAIS COM LAZY LOADING */}
        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "20px" }}>
              Carregando...
            </div>
          }
        >
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
        </Suspense>

        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "20px" }}>
              Carregando...
            </div>
          }
        >
          {showFindingsModal && (
            <FindingsModal
              onClose={() => {
                setShowFindingsModal(false);
                setNewFindings([]);
              }}
              newFindings={newFindings}
            />
          )}
        </Suspense>

        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "20px" }}>
              Carregando...
            </div>
          }
        >
          {showTournamentLobby && (
            <TournamentLobby
              onClose={() => setShowTournamentLobby(false)}
              username={currentUser}
            />
          )}
        </Suspense>

        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "20px" }}>
              Carregando...
            </div>
          }
        >
          {showOnline && !onlineGame && (
            <OnlineLobby
              onJoinGame={handleJoinOnlineGame}
              onCancel={() => {
                setShowOnline(false);
                setShowOnlineLobby(false);
              }}
              currentUser={currentUser}
            />
          )}
        </Suspense>

        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "20px" }}>
              Carregando...
            </div>
          }
        >
          {onlineGame && (
            <OnlineGame
              roomId={onlineGame.roomId}
              playerName={onlineGame.playerName}
              socket={onlineGame.socket}
              onLeave={(shouldReset) => {
                console.log("📤 OnlineGame onLeave chamado:", { shouldReset });
                handleLeaveOnlineGame(shouldReset !== false);
              }}
            />
          )}
        </Suspense>

        {showMultiplayerModal && (
          <MemoizedMultiplayerModal
            onStart={handleMultiplayerStart}
            onClose={() => setShowMultiplayerModal(false)}
          />
        )}

        {resultModalOpen && resultData && (
          <ResultModal data={resultData} onClose={closeResultModal} />
        )}

        {/* 🔥 JOGO PRINCIPAL */}
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
            {/* 🔥 HEADER */}
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

            {/* 🔥 PLAYER SELECTOR */}
            {isMultiplayer &&
              multiplayerModeActive &&
              multiplayerPlayers.length > 0 && (
                <MemoizedPlayerSelector
                  players={multiplayerPlayers}
                  currentPlayer={currentPlayerIndex}
                  onSelectPlayer={handleSwitchPlayer}
                />
              )}

            {/* 🔥 CONTEÚDO PRINCIPAL */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 3, minWidth: 280 }}>
                {/* 🔥 GAME TABLE */}
                <MemoizedGameTable
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

                {/* 🔥 ACTION BUTTONS */}
                <MemoizedActionButtons
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

                {/* 🔥 WINNER MESSAGE */}
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

              {/* 🔥 PAINEL LATERAL */}
              <div
                style={{
                  flex: 1,
                  minWidth: 220,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <MemoizedStatusPanel
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

                <MemoizedStatsPanel
                  username={currentUser}
                  onShowAchievements={() => setShowAchievementsModal(true)}
                  isResultModalOpen={isResultModalOpen}
                />

                <MemoizedLevelDisplay
                  username={currentUser}
                  isResultModalOpen={isResultModalOpen}
                  onShowAchievements={() => setShowAchievementsModal(true)}
                  onShowFindings={() => setShowFindingsModal(true)}
                />

                <MemoizedFriendsList
                  username={currentUser}
                  onJoinGame={handleJoinOnlineGame}
                />

                <MemoizedMissionsPanel
                  username={currentUser}
                  onChipsUpdated={(newChips) => {
                    setCurrentChips(newChips);
                    updateChips(newChips);
                    setGame((prev) => {
                      const currentGame = prev || INITIAL_GAME;
                      return { ...currentGame, playerMoney: newChips };
                    });
                  }}
                  isResultModalOpen={isResultModalOpen}
                />

                <MemoizedHandHistory
                  username={currentUser}
                  isResultModalOpen={isResultModalOpen}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

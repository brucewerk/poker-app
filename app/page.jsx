// app/page.jsx - VERSÃO COMPLETA COM CORREÇÕES
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
import ResultModal from "@/components/Poker/ResultModal.jsx";
import MobileMenu from "@/components/Poker/MobileMenu.jsx";
import { useToast } from "@/components/Toast/ToastManager";

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
  const { toast } = useToast();

  const [game, setGame] = useState(INITIAL_GAME);
  const [notification, setNotification] = useState({
    msg: "",
    isError: false,
    visible: false,
  });
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showFindingsModal, setShowFindingsModal] = useState(false);
  const [showTournamentLobby, setShowTournamentLobby] = useState(false);
  const [isTournamentActive, setIsTournamentActive] = useState(false);
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

  // 🔥 ESTADO PARA NOTIFICAÇÕES DE CHAT GLOBAIS
  const [globalChatNotifications, setGlobalChatNotifications] = useState([]);
  const [globalChatUnread, setGlobalChatUnread] = useState(0);

  // 🔥 ESTADO PARA CONTROLAR SE O JOGO ESTÁ ESPERANDO "NOVA MÃO"
  const [waitingForNewHand, setWaitingForNewHand] = useState(true);

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
  const isSavingHistoryRef = useRef(false);
  const savedHandIdsRef = useRef(new Set());
  const isProcessingAction = useRef(false);

  const currentUser = session?.user?.username || null;
  const userChips = session?.user?.chips || 0;

  // ============================================================
  // 🔥 FUNÇÃO PARA RECEBER NOVAS MENSAGENS DE CHAT GLOBAIS
  // ============================================================
  const handleGlobalChatMessage = useCallback((data) => {
    const { from, message } = data;
    
    toast.chat(`💬 ${from}: ${message.length > 30 ? message.substring(0, 30) + "..." : message}`);
    
    try {
      soundManager.playSound("deal", { volume: 0.1 });
    } catch (e) {}
    
    setGlobalChatUnread((prev) => prev + 1);
    
    setGlobalChatNotifications((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        from,
        message: message.length > 50 ? message.substring(0, 50) + "..." : message,
        timestamp: Date.now(),
      }
    ]);

    const newCount = globalChatUnread + 1;
    if (newCount > 0) {
      document.title = `💬 (${newCount}) Poker by BruCe`;
    }
  }, [toast, globalChatUnread]);

  const clearGlobalChatNotifications = useCallback(() => {
    setGlobalChatNotifications([]);
    setGlobalChatUnread(0);
    document.title = "Poker by BruCe";
  }, []);

  // ============================================================
  // 🔥 FUNÇÃO PARA ABRIR/FECHAR TORNEIOS
  // ============================================================
  const handleTournamentClick = useCallback(() => {
    setIsTournamentActive(true);
    setShowTournamentLobby(true);
  }, []);

  const handleTournamentClose = useCallback(() => {
    setIsTournamentActive(false);
    setShowTournamentLobby(false);
  }, []);

  // ============================================================
  // 🔥 FUNÇÃO PARA ATUALIZAR FICHAS NO MULTIPLAYER
  // ============================================================
  const updateMultiplayerChips = useCallback((playerIndex, newChips) => {
    setMultiplayerPlayers((prev) => {
      const updated = [...prev];
      if (updated[playerIndex]) {
        updated[playerIndex] = {
          ...updated[playerIndex],
          chips: Math.max(0, newChips),
        };
      }
      return updated;
    });
  }, []);

  // ====================== BUSCAR FICHAS DIRETAMENTE DO BANCO ======================
  const fetchChipsFromDB = useCallback(async () => {
    if (!currentUser) return null;
    try {
      // 🔥 MELHORIA: Reduzir timeout para 3 segundos e melhorar error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch("/api/public/get-chips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.log("⚠️ API get-chips retornou status não-ok");
        return null;
      }

      const data = await res.json();
      if (data.success) {
        return data.chips;
      }
      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("⚠️ Timeout ao buscar fichas (3s)");
      } else {
        console.log("⚠️ Erro ao buscar fichas:", error.message);
      }
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
        console.log(`💰 Fichas atualizadas: ${chips}`);
        setCurrentChips(chips);
        
        setGame((prev) => {
          if (!prev.handActive || prev.playerMoney !== chips) {
            return { ...prev, playerMoney: chips };
          }
          return prev;
        });
        
        if (Math.abs(chips - (session?.user?.chips || 0)) > 10) {
          await update();
        }

        window.dispatchEvent(
          new CustomEvent("chips-updated", {
            detail: { chips: chips },
          })
        );
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

  // ====================== SALVAR FICHAS ======================
  const saveChips = useCallback(
    async (user, chips, force = false) => {
      if (!user) return;

      // 🔥 FICHAS GLOBAIS: no modo 2 Jogadores (local, mesmo dispositivo),
      // só o assento do dono da conta (índice 0) pode gravar no saldo
      // global — caso contrário, o saldo do convidado (Jogador 2)
      // sobrescreveria a conta real do usuário logado.
      const isHotseatGuestTurn =
        isMultiplayer && multiplayerModeActive && currentPlayerIndex !== 0;
      if (isHotseatGuestTurn) {
        return;
      }

      if (isSaving && !force) {
        pendingSaveRef.current = true;
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
      isMultiplayer,
      multiplayerModeActive,
      currentPlayerIndex,
      currentUser,
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
    console.log("🔄 Restaurando jogo CPU...");
    
    const chips = await fetchChipsFromDB();
    const finalChips = chips !== null ? chips : currentChips || session?.user?.chips || 0;

    console.log(`💰 Fichas restauradas: ${finalChips}`);

    setCurrentChips(finalChips);
    setIsCpuGamePaused(false);

    setGame({
      ...INITIAL_GAME,
      playerMoney: finalChips,
      cpuMoney: 1000,
      handActive: false,
      gameOver: false,
    });

    setWaitingForNewHand(true);

    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }
    if (startNewHandTimeoutRef.current) {
      clearTimeout(startNewHandTimeoutRef.current);
      startNewHandTimeoutRef.current = null;
    }

    await update();
    
    console.log("✅ Jogo CPU restaurado com sucesso!");
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
      console.log("🔄 Detectada saída do multiplayer, restaurando jogo CPU...");
      hasLeftOnlineRef.current = false;
      
      const timer = setTimeout(() => {
        restoreCpuGame();
      }, 300);
      
      return () => clearTimeout(timer);
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
        if (msg.includes("🎊 Subiu para Nível")) {
          toast.levelUp(msg);
        } else if (msg.includes("🎉 Conquista")) {
          toast.achievement(msg);
        } else if (msg.includes("🏅 Achado")) {
          toast.finding(msg);
        }
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
    [toast],
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

        const chips = currentChips || userChips || 0;
        setWaitingForNewHand(true);
        setGame((prev) => ({
          ...prev,
          playerMoney: chips,
          cpuMoney: 1000,
          handActive: false,
          gameOver: false,
        }));
        gameInitialized.current = true;
        setIsLoading(false);
      };

      loadGameState();
    }
  }, [status, currentUser, userChips, currentChips]);

  // ====================== ATUALIZAR ESTATÍSTICAS ======================
  const updateStats = useCallback(
    async (result, chips, handName, wasAllIn = false) => {
      // 🔥 No multiplayer, só atualiza estatísticas globais para o dono da conta (índice 0)
      if (isMultiplayer && multiplayerModeActive && currentPlayerIndex !== 0) {
        console.log("🔍 [updateStats] Pulando atualização de estatísticas - não é dono da conta no multiplayer");
        return;
      }

      if (!currentUser) return;

      try {
        // 🔥 CORREÇÃO: Adicionar timeout e melhorar error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

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
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          console.error("❌ Erro na resposta da API update-stats:", res.status, res.statusText);
          return null;
        }

        const data = await res.json();

        if (data.success) {
          if (data.newAchievements?.length > 0) {
            const achievementNames = data.newAchievements
              .map((a) => a.name)
              .join(", ");
            toast.achievement(
              `🎉 Conquista desbloqueada: ${achievementNames}!`,
            );
            setNewAchievements(data.newAchievements);
            setTimeout(() => setShowAchievementsModal(true), 1500);
          }

          if (data.newFindings?.length > 0) {
            const findingNames = data.newFindings.map((f) => f.name).join(", ");
            toast.finding(`🏅 Achado descoberto: ${findingNames}! (+XP)`);
            setNewFindings(data.newFindings);
            setTimeout(() => setShowFindingsModal(true), 2500);
          }

          if (data.leveledUp) {
            toast.levelUp(
              `🎊 Subiu para Nível ${data.newLevel}! ${data.levelTitle}`,
            );
          }
        }

        return data;
      } catch (error) {
        console.error("Erro ao atualizar estatísticas:", error);
      }
    },
    [currentUser, toast],
  );

  // ====================== SALVAR HISTÓRICO ======================
  const saveHandHistory = useCallback(
    async (handData) => {
      if (!currentUser) return;
      if (!handData || typeof handData !== "object") return;

      const validResults = ["win", "loss", "tie"];
      if (!handData.result || !validResults.includes(handData.result)) return;

      // 🔥 No multiplayer, só o dono da conta (índice 0) salva histórico globalmente
      if (isMultiplayer && multiplayerModeActive && currentPlayerIndex !== 0) {
        console.log("🔍 [saveHandHistory] Pulando histórico - não é dono da conta no multiplayer");
        return;
      }

      const handId =
        handData.id ||
        `${currentUser}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      if (savedHandIdsRef.current.has(handId)) return;

      const duplicateKey = `${handData.timestamp}_${handData.result}_${handData.pot}`;
      if (window._lastHandKey === duplicateKey) return;
      window._lastHandKey = duplicateKey;

      if (isSavingHistoryRef.current || saveHandHistoryRef.current) return;

      savedHandIdsRef.current.add(handId);
      saveHandHistoryRef.current = true;
      isSavingHistoryRef.current = true;

      const handDataWithId = {
        id: handId,
        ...handData,
      };

      try {
        const res = await fetch("/api/save-hand-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentUser,
            handData: handDataWithId,
          }),
        });

        await res.json();
      } catch (error) {
        console.error("❌ [HISTORY] Erro ao salvar:", error);
      } finally {
        setTimeout(() => {
          saveHandHistoryRef.current = false;
          isSavingHistoryRef.current = false;
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
    if (!g?.handActive || g?.showdownStarted || isProcessingAction.current) {
      return g;
    }

    isProcessingAction.current = true;

    const delays = getDelays();

    let state = {
      ...g,
      showdownStarted: true,
      handActive: false,
      stage: "showdown",
    };

    const pScore = getHandRank(state?.playerCards, state?.community);
    const cScore = getHandRank(state?.cpuCards, state?.community);
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

          const handId = `${currentUser || "player"}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

          if (comparison === 0) {
            // 🔥 EMPATE: Cada jogador recebe de volta suas apostas + metade do pote total
            const playerBet = state.playerBet || 0;
            const cpuBet = state.cpuBet || 0;
            const totalPot = finalState.pot;
            
            // 🔥 Cada jogador recebe de volta suas apostas
            finalState.playerMoney += playerBet;
            finalState.cpuMoney += cpuBet;
            
            // 🔥 Dividir o pote restante igualmente
            const split = Math.floor(totalPot / 2);
            const remainder = totalPot - split * 2;
            
            finalState.playerMoney += split + remainder;
            finalState.cpuMoney += split;

            finalState.winnerMsg = `🤝 Empate! ${pName} — Pote dividido.`;
            finalState.cpuThought = "🤖 CPU: 'Empate justo.'";
            finalState.gameStatus = "🤝 EMPATE!";
            result = "tie";

            saveHandHistory({
              id: handId,
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

            if (isMultiplayer && multiplayerModeActive) {
              updateMultiplayerChips(currentPlayerIndex, finalState.playerMoney);
              // 🔥 Salvar fichas globalmente também no multiplayer
              if (currentPlayerIndex === 0) {
                await saveChips(u, finalState.playerMoney, false);
                // 🔥 Atualizar estatísticas globalmente no multiplayer (empate)
                await updateStats("tie", split, pName, state.playerAllin);
              }
            }

            if (!isMultiplayer || !multiplayerModeActive) {
              await saveChips(u, finalState.playerMoney, false);
              await updateStats("tie", split, pName, state.playerAllin);
            }

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

            if (isMultiplayer && multiplayerModeActive) {
              updateMultiplayerChips(currentPlayerIndex, finalState.playerMoney);
              // 🔥 Salvar fichas globalmente também no multiplayer
              if (currentPlayerIndex === 0) {
                await saveChips(u, finalState.playerMoney, false);
              }
            }

            await updateStats("win", won, pName, state.playerAllin);

            saveHandHistory({
              id: handId,
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

            if (!isMultiplayer || !multiplayerModeActive) {
              await saveChips(u, finalState.playerMoney, false);
            }

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
              id: handId,
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

            if (isMultiplayer && multiplayerModeActive) {
              updateMultiplayerChips(currentPlayerIndex, finalState.playerMoney);
              // 🔥 Salvar fichas globalmente também no multiplayer
              if (currentPlayerIndex === 0) {
                await saveChips(u, finalState.playerMoney, false);
                // 🔥 Atualizar estatísticas globalmente no multiplayer (derrota)
                await updateStats("loss", lost, cName);
              }
            }

            if (!isMultiplayer || !multiplayerModeActive) {
              await saveChips(u, finalState.playerMoney, false);
            }

            if (finalState.playerMoney <= 0) {
              showNotification(
                "💔 Você ficou sem fichas! Clique em RENOVAR FICHAS para recarregar.",
                true,
              );
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

          setWaitingForNewHand(true);

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
      const playerChips = multiplayerPlayers[nextIndex]?.chips || 0;
      showNotification(`🎯 Vez de ${playerName} (💰 ${playerChips} fichas)!`, false);
      // 🔥 Retorna o índice diretamente: setCurrentPlayerIndex é assíncrono,
      // então quem chama isso e em seguida usa `currentPlayerIndex` no mesmo
      // tick ainda veria o valor antigo — usar o retorno evita essa corrida.
      return nextIndex;
    }
    return false;
  }, [
    isMultiplayer,
    multiplayerModeActive,
    multiplayerPlayers,
    currentPlayerIndex,
    showNotification,
  ]);

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

    setTimeout(() => {
      savedHandIdsRef.current.clear();
      window._lastHandKey = null;
    }, 500);

    requestAnimationFrame(() => {
      const refreshChipsAfterModal = async () => {
        const scheduleNextHand = (delay) => {
          startNewHandTimeoutRef.current = setTimeout(async () => {
            // 🔥 Troca de jogador PRIMEIRO — usamos o índice retornado
            // diretamente (não o state, que ainda não teria re-renderizado
            // neste mesmo tick) para decidir de onde vêm as fichas da
            // próxima mão.
            let nextIndex = currentPlayerIndex;
            if (isMultiplayer && multiplayerModeActive) {
              const switched = switchToNextPlayer();
              if (typeof switched === "number") nextIndex = switched;
            }

            const nextIsHotseatGuest =
              isMultiplayer && multiplayerModeActive && nextIndex !== 0;

            let chips;
            if (nextIsHotseatGuest) {
              chips = multiplayerPlayers[nextIndex]?.chips ?? 0;
            } else {
              await refreshUserChips();
              const freshChips = await fetchChipsFromDB();
              chips = freshChips !== null ? freshChips : currentChips || 0;
            }

            if (chips <= 0) {
              setWaitingForNewHand(true);
              showNotification(
                "💔 Você está sem fichas! Clique em RENOVAR FICHAS para recarregar.",
                true,
              );
              startNewHandTimeoutRef.current = null;
              return;
            }

            const u = currentUser;
            startNewHand(u, chips, nextIndex);
            startNewHandTimeoutRef.current = null;
          }, delay);
        };

        if (data && data.winner !== "tie") {
          scheduleNextHand(getDelays().nextHandDelay);
        } else {
          scheduleNextHand(300);
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
    currentPlayerIndex,
    multiplayerPlayers,
    switchToNextPlayer,
    refreshUserChips,
    fetchChipsFromDB,
    getDelays,
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
  const startNewHand = useCallback(async (user, initialMoney, playerIndexOverride) => {
    if (isProcessingAction.current) return;

    console.log("🔍 [startNewHand] Iniciando nova mão!", { user, initialMoney });

    // 🔥 ESCONDER BOTÃO NOVA MÃO
    setWaitingForNewHand(false);

    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    if (startNewHandTimeoutRef.current) {
      clearTimeout(startNewHandTimeoutRef.current);
      startNewHandTimeoutRef.current = null;
    }

    // 🔥 BUSCAR FICHAS ATUALIZADAS DO BANCO ANTES DE INICIAR
    const checkAndStart = async () => {
      // 🔥 FICHAS GLOBAIS: só buscamos o saldo persistido (DB) quando é a vez
      // do dono da conta. No modo 2 Jogadores, o convidado (assento != 0) usa
      // sua própria pilha local (multiplayerPlayers) — do contrário ele
      // herdaria (e sobrescreveria) o saldo global do dono da conta.
      // Usamos `playerIndexOverride` quando disponível (ex.: logo após trocar
      // de jogador) pois `currentPlayerIndex` do state ainda não teria sido
      // atualizado nesse mesmo tick.
      const effectiveIndex =
        typeof playerIndexOverride === "number"
          ? playerIndexOverride
          : currentPlayerIndex;
      const isHotseatGuestTurn =
        isMultiplayer && multiplayerModeActive && effectiveIndex !== 0;

      let playerMoney;
      if (isHotseatGuestTurn) {
        playerMoney =
          typeof initialMoney === "number"
            ? initialMoney
            : (multiplayerPlayers[effectiveIndex]?.chips ?? 0);
      } else {
        const freshChips = await fetchChipsFromDB();
        playerMoney = freshChips !== null ? freshChips : currentChips || session?.user?.chips || 0;
      }

      console.log(`🔍 [startNewHand] Fichas verificadas: ${playerMoney}`);

      if (playerMoney <= 0) {
        // 🔥 SEM FICHAS - MOSTRAR MENSAGEM E MANTER ESPERA
        showNotification(
          "❌ Você não tem fichas! Clique em RENOVAR FICHAS para recarregar.",
          true,
        );
        setWaitingForNewHand(true);
        setGame((prev) => ({ ...prev, handActive: false }));
        return;
      }

      // 🔥 TEM FICHAS - INICIAR JOGO
      setGame((prev) => {
        let playerMoneyLocal = playerMoney;
        // 🔥 CPU não recebe fichas automaticamente - precisa de reset manual
        let cpuMoney = prev.cpuMoney;

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

        if (playerMoneyLocal >= sb) {
          playerMoneyLocal -= sb;
          playerBet = sb;
          pot += sb;
        } else {
          playerBet = playerMoneyLocal;
          pot += playerMoneyLocal;
          playerMoneyLocal = 0;
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
          playerMoney: playerMoneyLocal,
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

        console.log("🔍 [startNewHand] Nova mão criada:", newG);

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
    };

    checkAndStart();
  }, [currentUser, fetchChipsFromDB, currentChips, session, showNotification, currentPlayerIndex, isMultiplayer, multiplayerModeActive, multiplayerPlayers, saveChips]);

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
            setWaitingForNewHand(true);
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
          setWaitingForNewHand(true);
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
    console.log("🔍 [playerFold] Chamado!");

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
      
      if (isMultiplayer && multiplayerModeActive) {
        updateMultiplayerChips(currentPlayerIndex, state.playerMoney);
      }

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
        setWaitingForNewHand(true);
      }, 1500);
      return state;
    });
  }

  function playerCall() {
    if (isProcessingAction.current) return;
    console.log("🔍 [playerCall] Chamado!");

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

      if (isMultiplayer && multiplayerModeActive) {
        updateMultiplayerChips(currentPlayerIndex, state.playerMoney);
      }

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
    console.log("🔍 [playerRaise] Chamado!");

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

      if (isMultiplayer && multiplayerModeActive) {
        updateMultiplayerChips(currentPlayerIndex, state.playerMoney);
      }

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
    console.log("🔍 [playerAllIn] Chamado!");

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

      if (isMultiplayer && multiplayerModeActive) {
        updateMultiplayerChips(currentPlayerIndex, 0);
      }

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

  // ====================== RENOVAR FICHAS ======================
  function resetSession() {
    if (isProcessingAction.current) return;
    console.log("🔍 [resetSession] Chamado!");

    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);

    const currentMoney = game.playerMoney || currentChips || 0;

    // 🔥 NO MODO MULTIPLAYER, NÃO PERGUNTAR - SÓ DAS 1000 FICHAS DE CORTESIA
    if (isMultiplayer && multiplayerModeActive) {
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

      const money = 1000;
      const playerName =
        multiplayerPlayers[currentPlayerIndex]?.name || "Jogador";

      const message = `🔄 ${playerName} recebeu 1000 fichas de cortesia! (${currentMoney} → 1000)`;

      showNotification(message, false);
      setTimeout(() => saveChips(currentUser, money, true), 100);

      updateMultiplayerChips(currentPlayerIndex, money);

      setGame((prev) => ({
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
      }));

      setWaitingForNewHand(true);
      return;
    }

    // 🔥 NO MODO CPU, PERGUNTAR SE QUER RECARREGAR
    if (!window.confirm(
      `💰 Você tem ${currentMoney} fichas.\n\nDeseja receber 1000 fichas de cortesia para continuar jogando?\n\n(Suas fichas atuais serão perdidas)`
    )) {
      return;
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

    const money = 1000;
    const playerName = currentUser || "Jogador";

    const message = `🔄 ${playerName} recebeu 1000 fichas de cortesia! (${currentMoney} → 1000)`;

    showNotification(message, false);
    setTimeout(() => saveChips(currentUser, money, true), 100);

    setGame((prev) => ({
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
    }));

    // 🔥 APÓS RENOVAR, AGUARDAR "NOVA MÃO"
    setWaitingForNewHand(true);
  }

  // ====================== TOGGLE TURBO ======================
  const handleTurboToggle = useCallback((turboState) => {
    setIsTurbo(turboState);
  }, []);

  // ====================== MULTIPLAYER ======================
  const handleMultiplayerStart = useCallback(
    (config) => {
      // 🔥 FICHAS GLOBAIS: o Jogador 1 (dono da conta logada) sempre entra
      // no modo 2 Jogadores com o MESMO saldo que tinha no modo CPU — as
      // fichas nunca são um "reset" para 1000. Os demais assentos (convidados
      // sem conta, jogando no mesmo dispositivo) usam o valor configurado.
      const ownerChips =
        currentChips ?? session?.user?.chips ?? game?.playerMoney ?? 0;

      const playersWithChips = config.players.map((p, idx) => ({
        ...p,
        chips: idx === 0 ? ownerChips : p.chips || 0,
      }));

      setMultiplayerPlayers(playersWithChips);
      setIsMultiplayer(true);
      setMultiplayerModeActive(true);
      setCurrentPlayerIndex(0);
      setShowMultiplayerModal(false);
      showNotification(
        `👥 Modo 2 Jogadores ativado! Você entra com ${ownerChips} fichas.`,
        false,
      );

      const firstPlayer = playersWithChips[0];
      setTimeout(() => {
        startNewHand(currentUser, firstPlayer.chips);
      }, 100);
    },
    [currentUser, currentChips, session, game?.playerMoney],
  );

  // ====================== SAIR DO MULTIPLAYER (2 JOGADORES) ======================
  const handleExitMultiplayer = useCallback(() => {
    if (!isMultiplayer && !multiplayerModeActive) return;

    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    if (startNewHandTimeoutRef.current) {
      clearTimeout(startNewHandTimeoutRef.current);
      startNewHandTimeoutRef.current = null;
    }

    const ownerFinalChips =
      multiplayerPlayers[0]?.chips ?? currentChips ?? game.playerMoney ?? 0;

    setIsMultiplayer(false);
    setMultiplayerModeActive(false);
    setMultiplayerPlayers([]);
    setCurrentPlayerIndex(0);
    setShowMultiplayerModal(false);

    showNotification(
      `👋 Saiu do Modo 2 Jogadores. Voltando com ${ownerFinalChips} fichas.`,
      false,
    );

    saveChips(currentUser, ownerFinalChips, true);
    setCurrentChips(ownerFinalChips);

    isProcessingAction.current = false;

    setGame({
      ...INITIAL_GAME,
      playerMoney: ownerFinalChips,
      cpuMoney: 1000,
      handActive: false,
      gameOver: false,
    });

    setWaitingForNewHand(true);
  }, [
    isMultiplayer,
    multiplayerModeActive,
    multiplayerPlayers,
    currentChips,
    game.playerMoney,
    currentUser,
    saveChips,
  ]);

  const handleSwitchPlayer = useCallback(
    (index) => {
      if (index !== currentPlayerIndex) {
        setCurrentPlayerIndex(index);
        const playerName = multiplayerPlayers[index]?.name || "Jogador";
        const playerChips = multiplayerPlayers[index]?.chips || 0;
        showNotification(`🎯 Vez de ${playerName} (💰 ${playerChips} fichas)!`, false);
      }
    },
    [currentPlayerIndex, multiplayerPlayers],
  );

  // ====================== ONLINE ======================
  const handleJoinOnlineGame = useCallback(
    (data) => {
      console.log("🎮 [ONLINE] Entrando no jogo online:", data);

      if (data && data.roomId) {
        const isInviteAccepted = data.isInviteAccepted === true;
        const isInviteCreator = data.isInviteCreator === true;
        
        if (isInviteCreator && !isInviteAccepted) {
          console.log("⏳ Aguardando aceitação do convite...");
          return;
        }

        // 🔥 CORREÇÃO: GARANTIR QUE ROOMID ESTEJA EM MAIÚSCULAS
        const normalizedRoomId = data.roomId.toUpperCase();

        if (data.isInviteAccepted) {
          setPendingInviteJoin(null);
        }

        setOnlineGame({
          ...data,
          roomId: normalizedRoomId,
        });
        setShowOnline(false);
        pauseCpuGame();
        hasLeftOnlineRef.current = false;
        showNotification(`🌐 Entrou na sala ${normalizedRoomId}!`, false);
      } else if (data === null) {
        console.log("👋 Saindo do multiplayer, resetando estado...");
        setOnlineGame(null);
        setShowOnline(false);
        hasLeftOnlineRef.current = true;
        restoreCpuGame();
      }
    },
    [showNotification, pauseCpuGame, restoreCpuGame],
  );

  const handleLeaveOnlineGame = useCallback(
  async (shouldReset = false) => {
    console.log("👋 Saindo do jogo online...");
    
    // 🔥 LIMPAR ESTADO DO JOGO ONLINE
    setOnlineGame(null);
    showNotification("👋 Saiu do jogo online", false);

    hasLeftOnlineRef.current = true;

    if (handleJoinOnlineGame) {
      handleJoinOnlineGame(null);
    }

    // 🔥 FORÇAR ATUALIZAÇÃO DAS FICHAS
    await refreshUserChips();
    
    // 🔥 FORÇAR ATUALIZAÇÃO DO ESTADO DO JOGO CONTRA CPU
    const chips = await fetchChipsFromDB();
    const finalChips = chips !== null ? chips : currentChips || session?.user?.chips || 0;
    
    console.log(`💰 Fichas após sair do multiplayer: ${finalChips}`);
    
    setCurrentChips(finalChips);
    
    // 🔥 RESETAR O JOGO COM AS FICHAS CORRETAS
    setGame({
      ...INITIAL_GAME,
      playerMoney: finalChips,
      cpuMoney: 1000,
      handActive: false,
      gameOver: false,
    });
    
    // 🔥 IMPORTANTE: AGUARDAR CLIQUE EM "NOVA MÃO"
    setWaitingForNewHand(true);
    
    // 🔥 LIMPAR TIMERS PENDENTES
    if (cpuTimerRef.current) {
      clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = null;
    }
    if (startNewHandTimeoutRef.current) {
      clearTimeout(startNewHandTimeoutRef.current);
      startNewHandTimeoutRef.current = null;
    }
    
    // 🔥 LIMPAR FLAG DE PROCESSAMENTO
    isProcessingAction.current = false;
    
    // 🔥 FORÇAR ATUALIZAÇÃO DA SESSÃO
    await update();

    // 🔥 FORÇAR ATUALIZAÇÃO DA INTERFACE
    setTimeout(() => {
      refreshUserChips();
    }, 500);

    console.log("✅ Jogo CPU restaurado após sair do multiplayer");
  },
  [showNotification, refreshUserChips, handleJoinOnlineGame, fetchChipsFromDB, currentChips, session, update],
);

  // ====================== SUGESTÃO DO JOGADOR ======================
  function getPlayerSuggestion(g) {
    if (!g || !g?.playerCards || !g?.playerCards?.length) return "";

    if (g?.stage === "preflop") {
      const isPair = g?.playerCards[0]?.rank === g?.playerCards[1]?.rank;
      const high = Math.max(g?.playerCards[0]?.rank, g?.playerCards[1]?.rank);
      if (isPair) return "🎯 Par - Considere aumentar";
      if (high >= 12) return "📈 Cartas altas - CALL seguro";
      return "⚠️ Mão fraca - Cuidado";
    }
    if (g?.community && g?.community?.length >= 3) {
      const score = getHandRank(g?.playerCards, g?.community);
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

  // ====================== RENDER ======================
  const g = game || INITIAL_GAME;
  const suggestion = getPlayerSuggestion(g);
  const showCpuCards = !g?.handActive || g?.stage === "showdown";
  
  // 🔥 BOTÕES DE AÇÃO SÓ FUNCIONAM SE O JOGO ESTIVER ATIVO
  const actionButtonsDisabled =
  !g?.handActive ||
  !g?.waitingPlayer ||
  g?.gameOver ||
  g?.stage === "showdown" ||
  g?.playerMoney <= 0 ||
  g?.playerAllin ||
  isProcessingAction.current ||
  waitingForNewHand;

  // 🔥 CONSOLE.LOG PARA DEBUG
  console.log("🔍 [Page] RENDER - Estado do jogo:", {
    handActive: g?.handActive,
    waitingPlayer: g?.waitingPlayer,
    gameOver: g?.gameOver,
    stage: g?.stage,
    playerMoney: g?.playerMoney,
    playerAllin: g?.playerAllin,
    isProcessingAction: isProcessingAction.current,
    waitingForNewHand,
    actionButtonsDisabled,
    toCall: (g?.currentBet || 0) - (g?.playerBet || 0),
    canRaise: !actionButtonsDisabled && !g?.playerAllin && (g?.currentBet || 0) - (g?.playerBet || 0) + (50 + (g?.raiseCounter || 0) * 50) <= (g?.playerMoney || 0),
  });

  const toCall = (g?.currentBet || 0) - (g?.playerBet || 0);
  const nextRaise = 50 + (g?.raiseCounter || 0) * 50;
  const canRaise =
    !actionButtonsDisabled &&
    !g?.playerAllin &&
    (g?.currentBet || 0) - (g?.playerBet || 0) + nextRaise <= (g?.playerMoney || 0);
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
      <div
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          justifyContent: "center",
          fontFamily: "'Segoe UI','Poppins',system-ui,sans-serif",
          padding: "8px 15px",
          userSelect: "none",
          position: "relative",
          transition: "var(--transition-theme)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {currentUser && (
          <div
            style={{
              position: "fixed",
              top: 8,
              right: 8,
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
                padding: "6px 12px",
                borderRadius: 20,
                cursor: "pointer",
                fontWeight: "bold",
                backdropFilter: "blur(4px)",
                fontSize: "0.8rem",
              }}
              whileHover={{ scale: 1.05, background: "rgba(200,50,50,0.95)" }}
              whileTap={{ scale: 0.95 }}
            >
              🚪 Sair
            </motion.button>
          </div>
        )}

        <MobileMenu
          onOpenAchievements={() => setShowAchievementsModal(true)}
          onOpenFindings={() => setShowFindingsModal(true)}
          onOpenFriends={() => { /* Friends functionality */ }}
          onOpenMissions={() => { /* Missions functionality */ }}
          onOpenHistory={() => { /* History functionality */ }}
        />

        <ToolbarButtons
          isTurbo={isTurbo}
          onTurboToggle={handleTurboToggle}
          onMultiplayerClick={() =>
            multiplayerModeActive
              ? handleExitMultiplayer()
              : setShowMultiplayerModal(true)
          }
          isMultiplayerActive={multiplayerModeActive}
          onOnlineClick={() => setShowOnline(true)}
          isOnlineActive={!!onlineGame}
          onTournamentClick={handleTournamentClick}
          isTournamentActive={isTournamentActive}
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
            onClose={handleTournamentClose}
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
            padding: "15px 20px",
            maxWidth: 1600,
            width: "100%",
            marginTop: "5px",
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
              padding: "12px 15px",
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
                padding: "8px 15px",
                marginBottom: 15,
                flexWrap: "wrap",
                gap: 8,
                transition: "var(--transition-theme)",
              }}
            >
              {g && (
                <>
                {[
                  ["💰", g?.pot || 0],
                  ["🎴", stageNames[g?.stage] || g?.stage || "preflop"],
                  ["👤", g?.playerMoney || 0],
                  ["🤖", g?.cpuMoney || 0],
                  ["📊", `Aposta: ${g?.currentBet || 0}`],
                  ["🚀", isTurbo ? "Turbo" : "Normal"],
                  ["👥", isMultiplayer && multiplayerModeActive ? "2P" : "1P"],
                ].map(([icon, val], i) => (
                <motion.div
                  key={`header-${i}-${icon}`}
                  style={{
                    background: "var(--bg-button)",
                    padding: "4px 12px",
                    borderRadius: 40,
                    color: "var(--text-primary)",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
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
                </>
              )}

            </div>

            {isMultiplayer &&
              multiplayerModeActive &&
              multiplayerPlayers.length > 0 && (
                <>
                  <PlayerSelector
                    players={multiplayerPlayers}
                    currentPlayer={currentPlayerIndex}
                    onSelectPlayer={handleSwitchPlayer}
                  />
                  {/* 🔥 Botão de renovar fichas no multiplayer */}
                  {(multiplayerPlayers[currentPlayerIndex]?.chips ?? 0) <= 0 && (
                    <motion.button
                      onClick={resetSession}
                      style={{
                        background: "radial-gradient(#f7d97c, #d6a12e)",
                        border: "none",
                        borderRadius: "20px",
                        padding: "8px 16px",
                        fontWeight: "700",
                        fontSize: "0.8rem",
                        color: "#2e241f",
                        boxShadow: "0 4px 0 #7a4c1a",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s ease",
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span style={{ fontSize: "1rem" }}>🔄</span>
                      RENOVAR FICHAS (1000)
                    </motion.button>
                  )}
                </>
              )}

            <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
              <div style={{ flex: 3, minWidth: 280 }}>
                {g && (
                  <GameTable
                    communityCards={g?.community || []}
                    playerCards={g?.playerCards || []}
                    cpuCards={g?.cpuCards || []}
                    playerHandName={g?.playerHandName || ""}
                    cpuHandName={g?.cpuHandName || ""}
                    cpuThought={g?.cpuThought || ""}
                    stage={g?.stage || "preflop"}
                    pot={g?.pot || 0}
                    currentBet={g?.currentBet || 0}
                    playerBet={g?.playerBet || 0}
                    cpuBet={g?.cpuBet || 0}
                    isTurbo={isTurbo}
                    showCpuCards={showCpuCards}
                    isMultiplayer={isMultiplayer && multiplayerModeActive}
                    multiplayerPlayers={multiplayerPlayers}
                    currentPlayerIndex={currentPlayerIndex}
                    onSwitchPlayer={handleSwitchPlayer}
                    currentUser={currentUser}
                  />
                )}

                {/* 🔥 ACTION BUTTONS */}
                {g && (
                  <ActionButtons
                    disabled={actionButtonsDisabled}
                    canRaise={canRaise}
                    toCall={toCall}
                    nextRaise={nextRaise}
                    onFold={playerFold}
                    onCall={playerCall}
                    onRaise={playerRaise}
                    onAllIn={playerAllIn}
                    onReset={resetSession}
                    onNewHand={() => {
                      console.log("🔍 [Page] onNewHand chamado! Iniciando nova mão...");
                      startNewHand(currentUser, undefined);
                    }}
                    playerMoney={g?.playerMoney || 0}
                    isWaitingForNewHand={waitingForNewHand}
                    cpuAction={null}
                  />
                )}

                {g?.winnerMsg && (
                  <motion.div
                    className="winner-message"
                    style={{
                      background: "rgba(0,0,0,0.7)",
                      backdropFilter: "blur(12px)",
                      borderRadius: 40,
                      padding: "6px 15px",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                      color: "#ffd966",
                      marginTop: 12,
                      border: "1px solid rgba(255,215,0,0.3)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {g?.winnerMsg}
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
                  gap: 8,
                }}
              >
                {g && (
                  <StatusPanel
                    stage={g?.stage ?? "preflop"}
                    pot={g?.pot ?? 0}
                    currentBet={g?.currentBet ?? 0}
                    playerBet={g?.playerBet ?? 0}
                    cpuBet={g?.cpuBet ?? 0}
                    nextRaise={nextRaise ?? 0}
                    notification={notification ?? { msg: "", isError: false, visible: false }}
                    stageNames={stageNames ?? {}}
                    gameStatus={g?.gameStatus ?? ""}
                    winnerMsg={g?.winnerMsg ?? ""}
                    isTurbo={isTurbo ?? false}
                  />
                )}

                {g && (
                  <StatsPanel
                    username={currentUser}
                    onShowAchievements={() => setShowAchievementsModal(true)}
                    isResultModalOpen={isResultModalOpen}
                  />
                )}

                {g && (
                  <LevelDisplay
                    username={currentUser}
                    isResultModalOpen={isResultModalOpen}
                    onShowAchievements={() => setShowAchievementsModal(true)}
                    onShowFindings={() => setShowFindingsModal(true)}
                  />
                )}

                <FriendsList
                  username={currentUser}
                  onJoinGame={handleJoinOnlineGame}
                  onNewChatMessage={handleGlobalChatMessage}
                />

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
    </>
  );
}
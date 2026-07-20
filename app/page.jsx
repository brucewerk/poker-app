// app/page.jsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createDeck } from "@/lib/poker/deck.js";
import { getHandRank, getHandName } from "@/lib/poker/evaluation.js";
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
  // 🔥 CORREÇÃO: Declare update na desestruturação
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

  const currentUser = session?.user?.username || null;
  const userChips = session?.user?.chips || 0;

  // ====================== REDIRECIONAMENTO DE AUTENTICAÇÃO ======================
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      console.log("🔒 Não autenticado, redirecionando para login...");
      router.push("/login");
    } else {
      console.log("✅ Usuário autenticado:", session.user?.username);
      if (gameInitialized.current === false) {
        gameInitialized.current = true;
        setIsLoading(false);
      }
    }
  }, [session, status, router]);

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

      if (Math.abs(chips - currentChips) < 10 && !force) {
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
          if (Math.abs(chips - (session?.user?.chips || 0)) > 50) {
            await update();
          }
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
    [isSaving, update, isCpuGamePaused, currentChips, session],
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

  // ====================== CONFIGURAÇÕES DE DELAY ======================
  const getDelays = useCallback(() => {
    if (isTurbo) {
      return {
        revealDelay: 400,
        compareDelay: 600,
        resultDelay: 600,
        showdownStartDelay: 400,
        victoryDelay: 200,
        nextHandDelay: 2500,
        cpuActionDelay: 400,
      };
    }
    return {
      revealDelay: 1000,
      compareDelay: 1500,
      resultDelay: 1500,
      showdownStartDelay: 1000,
      victoryDelay: 500,
      nextHandDelay: 2500,
      cpuActionDelay: 800,
    };
  }, [isTurbo]);

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

  // ====================== NOTIFICAÇÃO ======================
  const showNotification = useCallback((msg, isError = false) => {
    setNotification({ msg, isError, visible: true });

    try {
      if (!isError && msg.includes("VENCEU")) {
        soundManager.playSound("win");
      } else if (isError && msg.includes("perdeu")) {
        soundManager.playSound("lose");
      } else if (msg.includes("ALL-IN")) {
        soundManager.playSound("allin");
      } else if (msg.includes("aumentou")) {
        soundManager.playSound("raise");
      } else if (msg.includes("desistiu")) {
        soundManager.playSound("fold");
      } else if (msg.includes("CHECK")) {
        soundManager.playSound("check");
      }
    } catch (e) {}

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
    if (status === "authenticated" && currentUser) {
      const loadGameState = async () => {
        // 🔥 RESETA O gameInitialized PARA PERMITIR RECARREGAR APÓS REFRESH
        if (gameInitialized.current) {
          console.log("🔄 Já inicializado, verificando estado atual...");
          // Se o jogo não estiver ativo, reinicia
          setGame((prev) => {
            if (!prev.handActive && prev.playerMoney > 0) {
              console.log("🃏 Jogo inativo após refresh, reiniciando...");
              setTimeout(
                () => startNewHand(currentUser, prev.playerMoney),
                100,
              );
            }
            return prev;
          });
          return;
        }

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

        // 🔥 FORÇA A INICIALIZAÇÃO DO JOGO
        const chips = currentChips || userChips || 1000;
        console.log("🃏 Iniciando nova mão com:", chips, "fichas");

        setGame((prev) => ({
          ...prev,
          playerMoney: chips,
          cpuMoney: 1000,
          handActive: false,
        }));

        setTimeout(() => {
          startNewHand(currentUser, chips);
        }, 100);

        gameInitialized.current = true;
        setIsLoading(false);
      };

      loadGameState();
    }
  }, [status, currentUser, userChips, currentChips, showNotification]);

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
        console.log("🔍 [HISTORY] Usuário não logado, ignorando");
        return;
      }

      if (saveHandHistoryRef.current) {
        console.log("🔍 [HISTORY] Já salvando, ignorando chamada duplicada");
        return;
      }

      saveHandHistoryRef.current = true;

      console.log("🔍 [HISTORY] Salvando histórico:", {
        result: handData.result,
        playerHand: handData.playerHand,
        cpuHand: handData.cpuHand,
        pot: handData.pot,
      });

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
        } else {
          console.error("❌ [HISTORY] Erro ao salvar:", data.error);
        }
      } catch (error) {
        console.error("❌ [HISTORY] Erro:", error);
      } finally {
        setTimeout(() => {
          saveHandHistoryRef.current = false;
        }, 1000);
      }
    },
    [currentUser],
  );

  // ====================== FAST FORWARD ======================
  function fastForwardToShowdown(gameState, user) {
    let state = { ...gameState };

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
  async function doShowdown(gameState, user) {
    if (!gameState.handActive || gameState.showdownStarted) {
      console.log("🔍 [SHOWDOWN] Já iniciado ou inativo, ignorando");
      return gameState;
    }

    console.log("🔍 [SHOWDOWN] Iniciando showdown...");

    const delays = getDelays();

    let state = {
      ...gameState,
      showdownStarted: true,
      handActive: false,
      stage: "showdown",
    };

    const playerScore = getHandRank(state.playerCards, state.community);
    const cpuScore = getHandRank(state.cpuCards, state.community);
    const playerHandNameResult = getHandName(playerScore);
    const cpuHandNameResult = getHandName(cpuScore);

    console.log(
      `🔍 [SHOWDOWN] Jogador: ${playerHandNameResult} | CPU: ${cpuHandNameResult}`,
    );

    state.playerHandName = `🏆 ${playerHandNameResult}`;
    state.cpuHandName = `🤖 ${cpuHandNameResult}`;
    state.gameStatus = "Showdown - Revelando...";
    state.cpuThought = "🤖 CPU: 'Vamos ver...'";

    const currentUserRef = user || currentUser;

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
      cpuHandName: `🤖 ${cpuHandNameResult}`,
      cpuThought: `🤖 CPU: '${cpuHandNameResult}!'`,
      gameStatus: `CPU tem ${cpuHandNameResult}!`,
      cpuCards: state.cpuCards,
    }));

    return new Promise((resolve) => {
      setTimeout(async () => {
        let finalState = { ...state };
        finalState.cpuHandName = `🤖 ${cpuHandNameResult}`;

        let result = null;
        let modalData = null;

        const playerScoreNum = playerScore?.raw || playerScore?.score || 0;
        const cpuScoreNum = cpuScore?.raw || cpuScore?.score || 0;

        if (playerScoreNum > cpuScoreNum) {
          finalState.playerMoney += finalState.pot;
          const won = finalState.pot;
          finalState.winnerMsg = `🏆 ${playerName} venceu com ${playerHandNameResult}!`;
          finalState.cpuThought = `🤖 CPU: '${cpuHandNameResult}... Você foi melhor!'`;
          finalState.gameStatus = "🏆 VITÓRIA! 🎉";
          result = "win";

          await updateStats(
            "win",
            won,
            playerHandNameResult,
            state.playerAllin,
          );

          saveHandHistory({
            result: "win",
            playerHand: playerHandNameResult,
            cpuHand: cpuHandNameResult,
            pot: finalState.pot,
            chipsWon: won,
            playerCards: state.playerCards,
            cpuCards: state.cpuCards,
            communityCards: state.community,
            wasAllIn: state.playerAllin || state.cpuAllin,
            timestamp: new Date().toISOString(),
          });

          await saveChips(currentUserRef, finalState.playerMoney, false);

          modalData = {
            winner: "player",
            playerName: playerName,
            playerHand: playerHandNameResult,
            cpuHand: cpuHandNameResult,
            pot: finalState.pot,
            chipsWon: won,
            isSpecial: won >= 500 || playerScoreNum >= 7,
            winnerMsg: finalState.winnerMsg,
            cpuThought: finalState.cpuThought,
            playerCards: state.playerCards || [],
            cpuCards: state.cpuCards || [],
            communityCards: state.community || [],
          };
        } else if (cpuScoreNum > playerScoreNum) {
          finalState.cpuMoney += finalState.pot;
          const lost = finalState.pot;
          finalState.winnerMsg = `🤖 CPU venceu com ${cpuHandNameResult}!`;
          finalState.cpuThought = `🤖 CPU: '${cpuHandNameResult}! Ganhei!'`;
          finalState.gameStatus = "😞 CPU VENCEU!";
          result = "loss";

          await updateStats("loss", lost, cpuHandNameResult);

          saveHandHistory({
            result: "loss",
            playerHand: playerHandNameResult,
            cpuHand: cpuHandNameResult,
            pot: finalState.pot,
            chipsLost: lost,
            playerCards: state.playerCards,
            cpuCards: state.cpuCards,
            communityCards: state.community,
            wasAllIn: state.playerAllin || state.cpuAllin,
            timestamp: new Date().toISOString(),
          });

          if (state.playerAllin || finalState.playerMoney === 0) {
            isAllInRef.current = true;
            hasLostAllRef.current = true;
            await saveChips(currentUserRef, 0, true);
          } else {
            await saveChips(currentUserRef, finalState.playerMoney, false);
          }

          modalData = {
            winner: "cpu",
            playerName: playerName,
            playerHand: playerHandNameResult,
            cpuHand: cpuHandNameResult,
            pot: finalState.pot,
            chipsLost: lost,
            isSpecial: false,
            winnerMsg: finalState.winnerMsg,
            cpuThought: finalState.cpuThought,
            playerCards: state.playerCards || [],
            cpuCards: state.cpuCards || [],
            communityCards: state.community || [],
          };
        } else {
          const split = Math.floor(finalState.pot / 2);
          finalState.playerMoney += split;
          finalState.cpuMoney += finalState.pot - split;
          finalState.winnerMsg = `🤝 Empate! ${playerHandNameResult} — Pote dividido.`;
          finalState.cpuThought = "🤖 CPU: 'Empate justo.'";
          finalState.gameStatus = "🤝 EMPATE!";
          result = "tie";

          saveHandHistory({
            result: "tie",
            playerHand: playerHandNameResult,
            cpuHand: cpuHandNameResult,
            pot: finalState.pot,
            split: split,
            playerCards: state.playerCards,
            cpuCards: state.cpuCards,
            communityCards: state.community,
            wasAllIn: state.playerAllin || state.cpuAllin,
            timestamp: new Date().toISOString(),
          });

          await saveChips(currentUserRef, finalState.playerMoney, false);

          modalData = {
            winner: "tie",
            playerName: playerName,
            playerHand: playerHandNameResult,
            cpuHand: cpuHandNameResult,
            pot: finalState.pot,
            split: split,
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
          showdownStarted: true,
          handActive: false,
          stage: "showdown",
          playerHandName: `🏆 ${playerHandNameResult}`,
          cpuHandName: `🤖 ${cpuHandNameResult}`,
          cpuCards: state.cpuCards,
          winnerMsg: finalState.winnerMsg,
          cpuThought: finalState.cpuThought,
          gameStatus: finalState.gameStatus,
        }));

        if (modalOpenTimeoutRef.current) {
          clearTimeout(modalOpenTimeoutRef.current);
          modalOpenTimeoutRef.current = null;
        }

        if (modalData) {
          console.log("🔍 [SHOWDOWN] Abrindo modal de resultado");
          setResultModalOpen(false);

          setTimeout(() => {
            setResultData(modalData);
            setResultModalOpen(true);
            setIsResultModalOpen(true);
          }, 150);
        }

        resolve(finalState);
      }, 2000);
    });
  }

  // ====================== FECHAR MODAL ======================
  const closeResultModal = useCallback(() => {
    if (!resultModalOpen) return;

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

    if (data && data.winner !== "tie") {
      const user = currentUser;
      const chipsToUse = currentChips || 0;

      startNewHandTimeoutRef.current = setTimeout(() => {
        if (isMultiplayer && multiplayerModeActive) {
          switchToNextPlayer();
        }
        startNewHand(user, chipsToUse);
        startNewHandTimeoutRef.current = null;
      }, 2500);
    }
  }, [
    resultModalOpen,
    resultData,
    currentUser,
    currentChips,
    isMultiplayer,
    multiplayerModeActive,
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
  function advanceStage(gameState, user) {
    let state = { ...gameState };
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
      requestAnimationFrame(() => {
        state.community = [...state.community, ...flopCards];
        setGame((prev) => ({
          ...prev,
          community: state.community,
          gameStatus: "Flop - Sua vez",
          waitingPlayer: true,
        }));
      });
      state.gameStatus = "Flop - Sua vez";
      state.waitingPlayer = true;
      return state;
    } else if (state.stage === "flop") {
      state.stage = "turn";
      const turnCard = state.deck.pop();
      requestAnimationFrame(() => {
        state.community = [...state.community, turnCard];
        setGame((prev) => ({
          ...prev,
          community: state.community,
          gameStatus: "Turn - Sua vez",
          waitingPlayer: true,
        }));
      });
      state.gameStatus = "Turn - Sua vez";
      state.waitingPlayer = true;
      return state;
    } else if (state.stage === "turn") {
      state.stage = "river";
      const riverCard = state.deck.pop();
      requestAnimationFrame(() => {
        state.community = [...state.community, riverCard];
        setGame((prev) => ({
          ...prev,
          community: state.community,
          gameStatus: "River - Sua vez",
          waitingPlayer: true,
        }));
      });
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
    console.log("🃏 startNewHand chamado com:", { user, initialMoney });

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

      console.log("🃏 Iniciando mão com playerMoney:", playerMoney);

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
        }, 300);
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

      const newGame = {
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

      console.log("🃏 Novo estado do jogo:", newGame);

      const currentUserRef = user || currentUser;
      setTimeout(() => saveChips(currentUserRef, newGame.playerMoney), 100);

      if (
        (playerAllin || cpuAllin) &&
        playerBet === currentBet &&
        cpuBet === currentBet
      ) {
        return fastForwardToShowdown(newGame, currentUserRef);
      }
      return newGame;
    });
  }

  // ====================== TRIGGER CPU ACTION ======================
  function triggerCpuAction(gameState, user) {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    const delays = getDelays();

    cpuTimerRef.current = setTimeout(() => {
      setGame((prev) => {
        if (!prev.handActive || prev.waitingPlayer) return prev;

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
          const currentUserRef = user || currentUser;
          saveChips(currentUserRef, result.playerMoney);
          setTimeout(() => startNewHand(currentUserRef, undefined), 1500);
        }

        return result;
      });
    }, delays.cpuActionDelay);
  }

  // ====================== AÇÕES DO JOGADOR ======================
  function afterPlayerMove(state, user) {
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
  function getPlayerSuggestion(gameState) {
    if (!gameState || !gameState.playerCards || !gameState.playerCards.length)
      return "";

    if (gameState.stage === "preflop") {
      const isPair =
        gameState.playerCards[0].rank === gameState.playerCards[1].rank;
      const high = Math.max(
        gameState.playerCards[0].rank,
        gameState.playerCards[1].rank,
      );
      if (isPair) return "🎯 Par - Considere aumentar";
      if (high >= 12) return "📈 Cartas altas - CALL seguro";
      return "⚠️ Mão fraca - Cuidado";
    }
    if (gameState.community && gameState.community.length >= 3) {
      const score = getHandRank(gameState.playerCards, gameState.community);
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

  // ====================== MODAL DE RESULTADO COM CARTAS ======================
  function ResultModal({ data, onClose }) {
    if (!data) return null;

    const isWin = data.winner === "player";
    const isTie = data.winner === "tie";
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
      document.body.style.overflow = "hidden";
      setIsResultModalOpen(true);
      return () => {
        document.body.style.overflow = "";
        setIsResultModalOpen(false);
      };
    }, []);

    const handleClose = () => {
      if (isClosing) return;
      setIsClosing(true);
      setTimeout(() => {
        onClose();
      }, 300);
    };

    const renderCard = useCallback((card, index) => {
      if (!card) return null;
      const isRed = card.suit === "♥" || card.suit === "♦";
      return (
        <div
          key={index}
          style={{
            display: "inline-block",
            width: 50,
            height: 70,
            margin: "2px",
            borderRadius: 6,
            background: "#fff",
            color: isRed ? "#cc0000" : "#000",
            fontSize: "0.9rem",
            fontWeight: "bold",
            textAlign: "center",
            lineHeight: "70px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            border: "1px solid #ccc",
            fontFamily: "monospace",
          }}
        >
          {card.rank}
          {card.suit}
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

    return (
      <div style={modalOverlayStyle()}>
        <div style={modalContentStyle(isWin, isTie)}>
          <button
            onClick={handleClose}
            style={{
              position: "absolute",
              top: 15,
              right: 20,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            ✕
          </button>

          <div style={modalHeaderStyle()}>
            <span style={modalIconStyle(isWin, isTie)}>
              {isWin ? "🏆" : isTie ? "🤝" : "💔"}
            </span>
            <h2 style={modalTitleStyle(isWin, isTie)}>
              {isWin ? "VITÓRIA!" : isTie ? "EMPATE!" : "DERROTA!"}
            </h2>
          </div>

          <div style={modalMessageStyle()}>
            <p style={modalWinnerStyle(isWin, isTie)}>{data.winnerMsg}</p>
          </div>

          {communityCards.length > 0 && (
            <div style={modalCommunityStyle()}>
              <div style={modalCommunityLabelStyle()}>🔥 MESA</div>
              <div style={modalCardsRowStyle()}>
                {communityCards.map((card, index) => renderCard(card, index))}
              </div>
            </div>
          )}

          <div style={modalComparisonStyle()}>
            <div style={modalPlayerStyle(true)}>
              <div style={modalPlayerNameStyle(true)}>
                🃏 {data.playerName || "Você"}
              </div>
              <div style={modalCardsRowStyle()}>
                {playerCards.length > 0 ? (
                  playerCards.map((card, index) => renderCard(card, index))
                ) : (
                  <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                    Sem cartas
                  </span>
                )}
              </div>
              <div style={modalHandStyle(true)}>{data.playerHand}</div>
              {isWin && <div style={modalBadgeStyle("win")}>🏆 VENCEDOR</div>}
            </div>

            <div style={modalVersusStyle()}>
              <span>VS</span>
            </div>

            <div style={modalPlayerStyle(false)}>
              <div style={modalPlayerNameStyle(false)}>🤖 CPU</div>
              <div style={modalCardsRowStyle()}>
                {cpuCards.length > 0 ? (
                  cpuCards.map((card, index) => renderCard(card, index))
                ) : (
                  <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                    Sem cartas
                  </span>
                )}
              </div>
              <div style={modalHandStyle(false)}>{data.cpuHand}</div>
              {!isWin && !isTie && (
                <div style={modalBadgeStyle("loss")}>💔 PERDEU</div>
              )}
              {isTie && <div style={modalBadgeStyle("tie")}>🤝 EMPATOU</div>}
            </div>
          </div>

          <div style={modalPotStyle()}>
            <span>💰 Pote: {data.pot} fichas</span>
            {isWin && (
              <span style={modalWinAmountStyle()}>+{data.chipsWon}</span>
            )}
            {!isWin && !isTie && (
              <span style={modalLoseAmountStyle()}>-{data.chipsLost}</span>
            )}
            {isTie && <span style={modalTieAmountStyle()}>+{data.split}</span>}
          </div>

          <div style={modalCpuThoughtStyle()}>{data.cpuThought}</div>

          <button
            onClick={handleClose}
            style={modalCloseButtonStyle()}
            disabled={isClosing}
          >
            {isClosing ? "⏳" : "CONTINUAR"}
          </button>
        </div>
      </div>
    );
  }

  // ====================== RENDER ======================
  const gameState = game;
  const suggestion = getPlayerSuggestion(gameState);
  const disable =
    !gameState.handActive ||
    !gameState.waitingPlayer ||
    gameState.gameOver ||
    gameState.stage === "showdown" ||
    gameState.playerMoney <= 0 ||
    gameState.playerAllin;
  const toCall = gameState.currentBet - gameState.playerBet;
  const nextRaise = 50 + gameState.raiseCounter * 50;
  const canRaise =
    !disable &&
    !gameState.playerAllin &&
    gameState.currentBet - gameState.playerBet + nextRaise <=
      gameState.playerMoney;
  const stageNames = {
    preflop: "Pré-flop",
    flop: "Flop",
    turn: "Turn",
    river: "River",
    showdown: "Showdown",
  };

  const hasPlayerCards =
    gameState.playerCards &&
    Array.isArray(gameState.playerCards) &&
    gameState.playerCards.length > 0;
  const hasCpuCards =
    gameState.cpuCards &&
    Array.isArray(gameState.cpuCards) &&
    gameState.cpuCards.length > 0;
  const hasCommunityCards =
    gameState.community && Array.isArray(gameState.community);
  const emptyCardCount = getEmptyCardCount();

  // ====================== TELA DE CARREGAMENTO ======================
  if (status === "loading" || !session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🎴</div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (isLoading && status === "authenticated") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🎴</div>
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
          background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🎴</div>
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
        background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Segoe UI','Poppins',system-ui,sans-serif",
        padding: 15,
        userSelect: "none",
        position: "relative",
      }}
    >
      {currentUser && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            zIndex: 100,
          }}
        >
          <button
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
          >
            🚪 Sair
          </button>
        </div>
      )}

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

      <div
        style={{
          background: "radial-gradient(circle at 30% 20%,#1c6e3c,#0a4122)",
          borderRadius: 50,
          boxShadow:
            "0 30px 40px rgba(0,0,0,0.5),inset 0 2px 5px rgba(255,255,255,0.2)",
          padding: 20,
          maxWidth: 1600,
          width: "100%",
        }}
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
              background: "#2c2e2bdd",
              backdropFilter: "blur(8px)",
              borderRadius: 50,
              padding: "8px 20px",
              marginBottom: 20,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {[
              ["💰", gameState.pot],
              ["🎴", stageNames[gameState.stage] || gameState.stage],
              ["👤", gameState.playerMoney],
              ["🤖", gameState.cpuMoney],
              ["📊", `Aposta: ${gameState.currentBet}`],
              ["🚀", isTurbo ? "Turbo" : "Normal"],
              ["👥", isMultiplayer && multiplayerModeActive ? "2P" : "1P"],
            ].map(([icon, value], index) => (
              <div
                key={index}
                style={{
                  background: "#1e1b14cc",
                  padding: "5px 15px",
                  borderRadius: 40,
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap",
                }}
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
                {value}
              </div>
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
              <div
                style={{ display: "flex", flexDirection: "column", gap: 15 }}
              >
                <div style={sectionStyle()}>
                  <div style={sectionTitleStyle()}>🤖 CPU</div>
                  <div style={cardsRowStyle()}>
                    {hasCpuCards ? (
                      gameState.cpuCards.map((card, index) => {
                        const shouldHide =
                          !gameState.showdownStarted && gameState.handActive;
                        return (
                          <Card
                            key={index}
                            card={card}
                            faceDown={shouldHide}
                            delay={index * 300}
                            isRevealing={
                              gameState.stage === "showdown" &&
                              gameState.showdownStarted
                            }
                          />
                        );
                      })
                    ) : (
                      <span style={{ color: "#ffdfaa" }}>Aguardando...</span>
                    )}
                  </div>
                  <div style={handBadgeStyle()}>
                    {gameState.cpuHandName || "🔒 ???"}
                  </div>
                  {gameState.cpuThought && (
                    <div
                      style={{
                        background: "#2a1f0ecc",
                        borderRadius: 20,
                        padding: "4px 10px",
                        fontSize: "0.7rem",
                        marginTop: 6,
                        display: "inline-block",
                        color: "#ffcc88",
                        fontStyle: "italic",
                      }}
                    >
                      {gameState.cpuThought}
                    </div>
                  )}
                </div>

                <div style={sectionStyle()}>
                  <div style={sectionTitleStyle()}>🔥 MESA</div>
                  <div style={cardsRowStyle()}>
                    {hasCommunityCards
                      ? gameState.community.map((card, index) => (
                          <Card key={index} card={card} />
                        ))
                      : null}
                    {Array(emptyCardCount)
                      .fill(0)
                      .map((_, index) => (
                        <div
                          key={index}
                          style={{
                            width: 70,
                            height: 100,
                            borderRadius: 10,
                            background:
                              "repeating-linear-gradient(45deg,#2b5797,#2b5797 15px,#1d3f6e 15px,#1d3f6e 30px)",
                            margin: "0 3px",
                            opacity: 0.4,
                            flexShrink: 0,
                          }}
                        />
                      ))}
                  </div>
                </div>

                <div style={sectionStyle()}>
                  <div style={sectionTitleStyle()}>
                    🃏{" "}
                    {isMultiplayer && multiplayerModeActive
                      ? multiplayerPlayers[currentPlayerIndex]?.name ||
                        "Jogador"
                      : currentUser
                        ? currentUser.toUpperCase()
                        : "JOGADOR"}
                    {isMultiplayer && multiplayerModeActive && (
                      <span
                        style={{
                          fontSize: "0.6rem",
                          color: "#ffd700",
                          marginLeft: "8px",
                          background: "rgba(255,215,0,0.2)",
                          padding: "2px 8px",
                          borderRadius: 10,
                        }}
                      >
                        {currentPlayerIndex + 1}/{multiplayerPlayers.length}
                      </span>
                    )}
                  </div>
                  <div style={cardsRowStyle()}>
                    {hasPlayerCards ? (
                      gameState.playerCards.map((card, index) => (
                        <Card key={index} card={card} />
                      ))
                    ) : (
                      <span style={{ color: "#ffdfaa" }}>Aguardando...</span>
                    )}
                  </div>
                  {gameState.playerHandName && (
                    <div style={handBadgeStyle()}>
                      {gameState.playerHandName}
                    </div>
                  )}
                  {suggestion && (
                    <div
                      style={{
                        background: "#1e5631cc",
                        borderLeft: "3px solid gold",
                        padding: "4px 10px",
                        fontSize: "0.7rem",
                        marginTop: 5,
                        borderRadius: 15,
                        color: "white",
                      }}
                    >
                      {suggestion}
                    </div>
                  )}
                </div>
              </div>

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

              {gameState.winnerMsg && (
                <div
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
                >
                  {gameState.winnerMsg}
                </div>
              )}
              <div
                style={{
                  textAlign: "center",
                  marginTop: 12,
                  fontSize: "0.7rem",
                  color: "#c9a96e",
                  textShadow: "1px 1px 0 #2a1f0e",
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
                stage={gameState.stage}
                pot={gameState.pot}
                currentBet={gameState.currentBet}
                playerBet={gameState.playerBet}
                cpuBet={gameState.cpuBet}
                nextRaise={nextRaise}
                notification={notification}
                stageNames={stageNames}
                gameStatus={gameState.gameStatus}
                winnerMsg={gameState.winnerMsg}
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
      </div>
    </div>
  );
}

// ====================== ESTILOS DO MODAL DE RESULTADO ======================
function modalOverlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: 20,
    backdropFilter: "blur(8px)",
    animation: "fadeIn 0.3s ease-out",
  };
}

function modalContentStyle(isWin, isTie) {
  const colors = {
    win: "linear-gradient(145deg,#1a5a2a,#0d4a1d)",
    loss: "linear-gradient(145deg,#5a1a1a,#4a0d0d)",
    tie: "linear-gradient(145deg,#3a3a1a,#2a2a0d)",
  };
  const border = {
    win: "3px solid #4caf50",
    loss: "3px solid #f44336",
    tie: "3px solid #ffc107",
  };
  const type = isWin ? "win" : isTie ? "tie" : "loss";
  return {
    background: colors[type],
    padding: "25px 30px",
    borderRadius: 30,
    maxWidth: 600,
    width: "100%",
    color: "white",
    border: border[type],
    boxShadow: "0 0 60px rgba(0,0,0,0.5)",
    maxHeight: "95vh",
    overflowY: "auto",
    position: "relative",
    animation: "slideUp 0.5s ease-out",
  };
}

function modalHeaderStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
    marginBottom: "10px",
  };
}

function modalIconStyle(isWin, isTie) {
  return {
    fontSize: "3rem",
  };
}

function modalTitleStyle(isWin, isTie) {
  const colors = {
    win: "#4caf50",
    loss: "#f44336",
    tie: "#ffc107",
  };
  const type = isWin ? "win" : isTie ? "tie" : "loss";
  return {
    margin: 0,
    fontSize: "1.8rem",
    color: colors[type],
    textShadow: "0 0 20px rgba(0,0,0,0.3)",
  };
}

function modalMessageStyle() {
  return {
    textAlign: "center",
    marginBottom: "15px",
  };
}

function modalWinnerStyle(isWin, isTie) {
  const colors = {
    win: "#4caf50",
    loss: "#f44336",
    tie: "#ffc107",
  };
  const type = isWin ? "win" : isTie ? "tie" : "loss";
  return {
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: colors[type],
    margin: 0,
  };
}

function modalCommunityStyle() {
  return {
    background: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: "10px",
    marginBottom: "15px",
    textAlign: "center",
  };
}

function modalCommunityLabelStyle() {
  return {
    fontSize: "0.7rem",
    color: "#aaa",
    marginBottom: "5px",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };
}

function modalCardsRowStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "4px",
    flexWrap: "wrap",
    padding: "5px 0",
    minHeight: "80px",
  };
}

function modalComparisonStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    marginBottom: "10px",
    flexWrap: "wrap",
    gap: "10px",
  };
}

function modalPlayerStyle(isPlayer) {
  return {
    flex: 1,
    textAlign: isPlayer ? "left" : "right",
    minWidth: "130px",
  };
}

function modalPlayerNameStyle(isPlayer) {
  return {
    fontSize: "0.8rem",
    fontWeight: "bold",
    color: isPlayer ? "#4caf50" : "#ff9800",
    marginBottom: "4px",
  };
}

function modalHandStyle(isPlayer) {
  return {
    fontSize: "1rem",
    fontWeight: "bold",
    color: isPlayer ? "#4caf50" : "#ff9800",
    background: "rgba(0,0,0,0.3)",
    padding: "3px 10px",
    borderRadius: 12,
    display: "inline-block",
    marginTop: "4px",
  };
}

function modalVersusStyle() {
  return {
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#888",
    padding: "0 10px",
  };
}

function modalBadgeStyle(type) {
  const colors = {
    win: "#4caf50",
    loss: "#f44336",
    tie: "#ffc107",
  };
  return {
    display: "inline-block",
    marginTop: "4px",
    fontSize: "0.65rem",
    fontWeight: "bold",
    color: "white",
    background: colors[type],
    padding: "2px 10px",
    borderRadius: 10,
  };
}

function modalPotStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    fontSize: "1rem",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    marginBottom: "8px",
    flexWrap: "wrap",
    gap: "5px",
  };
}

function modalWinAmountStyle() {
  return {
    color: "#4caf50",
    fontWeight: "bold",
    fontSize: "1.1rem",
  };
}

function modalLoseAmountStyle() {
  return {
    color: "#f44336",
    fontWeight: "bold",
    fontSize: "1.1rem",
  };
}

function modalTieAmountStyle() {
  return {
    color: "#ffc107",
    fontWeight: "bold",
    fontSize: "1.1rem",
  };
}

function modalCpuThoughtStyle() {
  return {
    textAlign: "center",
    fontSize: "0.8rem",
    color: "#aaa",
    fontStyle: "italic",
    padding: "8px",
    marginBottom: "12px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 15,
  };
}

function modalCloseButtonStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "1rem",
    padding: "12px 30px",
    borderRadius: 60,
    cursor: "pointer",
    boxShadow: "0 4px 0 #7a4c1a",
    color: "#2e241f",
    width: "100%",
    transition: "all 0.3s ease",
    marginTop: "5px",
  };
}

function sectionStyle() {
  return {
    background: "rgba(0,0,0,0.4)",
    borderRadius: 30,
    padding: 10,
    textAlign: "center",
  };
}

function sectionTitleStyle() {
  return {
    color: "#ffefb9",
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: "0.8rem",
    background: "#00000066",
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: 40,
  };
}

function cardsRowStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 5,
    minHeight: 110,
    alignItems: "center",
  };
}

function handBadgeStyle() {
  return {
    background: "#000000aa",
    borderRadius: 60,
    padding: "4px 10px",
    fontSize: "0.75rem",
    marginTop: 6,
    display: "inline-block",
    color: "#ffdd99",
    fontWeight: "bold",
  };
}

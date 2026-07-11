// app/page.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createDeck } from "@/lib/poker/deck.js";
import { getHandRank, getHandName } from "@/lib/poker/evaluation.js";
import { calculateHandStrength } from "@/lib/poker/strength.js";
import { getCpuDecision } from "@/lib/poker/cpu.js";
import Card from "@/components/Poker/Card.jsx";
import ActionButtons from "@/components/Poker/ActionButtons.jsx";
import StatusPanel from "@/components/Poker/StatusPanel.jsx";
import VictoryModal from "@/components/Poker/VictoryModal.jsx";
import StatsPanel from "@/components/Poker/StatsPanel.jsx";
import AchievementsModal from "@/components/Poker/AchievementsModal.jsx";

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [game, setGame] = useState(INITIAL_GAME);
  const [notification, setNotification] = useState({
    msg: "",
    isError: false,
    visible: false,
  });
  const [victoryModal, setVictoryModal] = useState({
    open: false,
    winner: "",
    chipsWon: 0,
    handName: "",
    isSpecial: false,
  });
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cpuTimerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const pendingSaveRef = useRef(false);
  const gameInitialized = useRef(false);

  const currentUser = session?.user?.username || null;
  const userChips = session?.user?.chips || 0;

  // ====================== REDIRECIONAR SE NÃO AUTENTICADO ======================
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ====================== NOTIFICAÇÃO ======================
  const showNotification = useCallback((msg, isError = false) => {
    setNotification({ msg, isError, visible: true });
    setTimeout(() => setNotification((n) => ({ ...n, visible: false })), 2000);
  }, []);

  // ====================== SALVAR FICHAS ======================
  const saveChips = useCallback(
    async (user, chips, force = false) => {
      if (!user) return;
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
        if (!data.success) {
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
    [isSaving],
  );

  // ====================== SALVAR ESTADO DO JOGO ======================
  const saveGameState = useCallback(
    async (state) => {
      if (!currentUser || !state.handActive || state.gameOver) return;

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

        await fetch("/api/save-game-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentUser,
            gameState: gameStateToSave,
          }),
        });
      } catch (error) {
        console.error("Erro ao salvar estado do jogo:", error);
      }
    },
    [currentUser],
  );

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

        startNewHand(currentUser, userChips);
        gameInitialized.current = true;
        setIsLoading(false);
      };

      loadGameState();
    }
  }, [status, currentUser, userChips]);

  // ====================== SALVAR ESTADO AUTOMATICAMENTE ======================
  useEffect(() => {
    if (
      game.handActive &&
      !game.gameOver &&
      currentUser &&
      gameInitialized.current
    ) {
      const saveInterval = setInterval(() => {
        saveGameState(game);
      }, 10000);

      return () => clearInterval(saveInterval);
    }
  }, [game, currentUser, saveGameState]);

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

        if (data.success && data.newAchievements?.length > 0) {
          const achievementNames = data.newAchievements
            .map((a) => a.name)
            .join(", ");
          showNotification(
            `🎉 Conquista desbloqueada: ${achievementNames}!`,
            false,
          );

          setNewAchievements(data.newAchievements);
          setTimeout(() => {
            setShowAchievementsModal(true);
          }, 1500);
        }

        return data;
      } catch (error) {
        console.error("Erro ao atualizar estatísticas:", error);
      }
    },
    [currentUser, showNotification],
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

  // ====================== SHOWDOWN ANIMADO ======================
  function doShowdown(g, user) {
    if (!g.handActive || g.showdownStarted) return g;

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
    state.cpuHandName = "🔒 ???";
    state.gameStatus = "Showdown - Revelando...";
    state.cpuThought = "🤖 CPU: 'Vamos ver...'";

    const u = user || currentUser;

    // Atualizar estado inicial do showdown
    setGame((prev) => ({
      ...prev,
      ...state,
      showdownStarted: true,
      handActive: false,
      stage: "showdown",
    }));

    // Fase 1: Revelar cartas da CPU com delay (1000ms - aumentado)
    setTimeout(() => {
      setGame((prev) => ({
        ...prev,
        cpuHandName: `🤖 ${cName}`,
        gameStatus: `CPU tem ${cName}!`,
        cpuThought: `🤖 CPU: '${cName}!'`,
      }));

      // Fase 2: Mostrar comparação (1500ms depois - aumentado)
      setTimeout(() => {
        setGame((prev) => ({
          ...prev,
          gameStatus: "Comparando mãos...",
          cpuThought: `🤖 CPU: '${cName} vs ${pName}'`,
        }));

        // Fase 3: Resultado (1500ms depois - aumentado)
        setTimeout(() => {
          let finalState = { ...state };
          finalState.cpuHandName = `🤖 ${cName}`;

          if (pScore > cScore) {
            finalState.playerMoney += finalState.pot;
            const won = finalState.pot;
            finalState.winnerMsg = `🏆 Você venceu com ${pName}!`;
            finalState.cpuThought = `🤖 CPU: '${cName}... Você foi melhor!'`;
            finalState.gameStatus = "🏆 VOCÊ VENCEU! 🎉";

            updateStats("win", won, pName, state.playerAllin);

            setTimeout(() => {
              showNotification(`🎉 VOCÊ VENCEU! +${won} fichas!`, false);
              saveChips(u, finalState.playerMoney);
              fetch("/api/save-game-state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: u, gameState: null }),
              }).catch(() => {});

              setVictoryModal({
                open: true,
                winner: "player",
                chipsWon: won,
                handName: pName,
                isSpecial: won >= 500 || pScore / 10 ** 10 >= 7,
              });
            }, 500); // Aumentado para 500ms
          } else if (cScore > pScore) {
            finalState.cpuMoney += finalState.pot;
            const lost = finalState.pot;
            finalState.winnerMsg = `🤖 CPU venceu com ${cName}!`;
            finalState.cpuThought = `🤖 CPU: '${cName}! Ganhei!'`;
            finalState.gameStatus = "😞 CPU VENCEU!";

            updateStats("loss", lost, cName);

            setTimeout(() => {
              showNotification(
                `😞 CPU venceu com ${cName}. Perdeu ${lost} fichas.`,
                true,
              );
              saveChips(u, finalState.playerMoney);
              fetch("/api/save-game-state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: u, gameState: null }),
              }).catch(() => {});

              setVictoryModal({
                open: true,
                winner: "cpu",
                chipsWon: lost,
                handName: cName,
                isSpecial: false,
              });
            }, 500); // Aumentado para 500ms
          } else {
            const split = Math.floor(finalState.pot / 2);
            finalState.playerMoney += split;
            finalState.cpuMoney += finalState.pot - split;
            finalState.winnerMsg = `🤝 Empate! ${pName} — Pote dividido.`;
            finalState.cpuThought = "🤖 CPU: 'Empate justo.'";
            finalState.gameStatus = "🤝 EMPATE!";

            setTimeout(() => {
              showNotification(
                `🤝 Empate! Você recebeu ${split} fichas.`,
                false,
              );
              saveChips(u, finalState.playerMoney);
              fetch("/api/save-game-state", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: u, gameState: null }),
              }).catch(() => {});

              // Aumentado para 5000ms antes de iniciar nova mão
              setTimeout(() => {
                setGame((prev) => ({ ...prev, showdownStarted: false }));
                startNewHand(u, undefined);
              }, 5000);
            }, 500);
          }

          // Atualizar estado final
          setGame((prev) => ({
            ...prev,
            ...finalState,
            showdownStarted: true,
            handActive: false,
            stage: "showdown",
          }));
        }, 1500); // Aumentado para 1500ms
      }, 1500); // Aumentado para 1500ms
    }, 1000); // Aumentado para 1000ms

    return state;
  }

  // ====================== AVANÇAR FASE ======================
  function advanceStage(g, user) {
    let state = { ...g };
    if (!state.playerAllin && !state.cpuAllin) {
      state.playerBet = 0;
      state.cpuBet = 0;
      state.currentBet = 0;
    }
    state.raiseCounter = 0;

    if (state.stage === "preflop") {
      state.stage = "flop";
      state.community = [
        ...state.community,
        state.deck.pop(),
        state.deck.pop(),
        state.deck.pop(),
      ];
      state.gameStatus = "Flop - Sua vez";
      state.waitingPlayer = true;
    } else if (state.stage === "flop") {
      state.stage = "turn";
      state.community = [...state.community, state.deck.pop()];
      state.gameStatus = "Turn - Sua vez";
      state.waitingPlayer = true;
    } else if (state.stage === "turn") {
      state.stage = "river";
      state.community = [...state.community, state.deck.pop()];
      state.gameStatus = "River - Sua vez";
      state.waitingPlayer = true;
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
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);

    setGame((prev) => {
      let playerMoney =
        initialMoney !== undefined ? initialMoney : prev.playerMoney;
      let cpuMoney = prev.cpuMoney <= 0 ? 1000 : prev.cpuMoney;

      if (playerMoney <= 0) {
        playerMoney = 1000;
        showNotification(`🔄 Você foi recarregado com 1000 fichas!`, false);
        setTimeout(() => saveChips(user, 1000), 100);
      }

      const deck = createDeck();
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
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
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
          const u = user || currentUser;
          saveChips(u, result.playerMoney);
          setTimeout(() => startNewHand(u, undefined), 1500);
        }

        return result;
      });
    }, 800);
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
        winnerMsg: `❌ ${currentUser || "Jogador"} desistiu! CPU vence.`,
        gameStatus: "Você desistiu",
        cpuThought: "🤖 CPU: 'Boa, ele desistiu!'",
      };
      showNotification(`❌ Você desistiu! Perdeu ${prev.pot} fichas.`, true);
      saveChips(currentUser, state.playerMoney);
      fetch("/api/save-game-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser,
          gameState: null,
        }),
      }).catch(() => {});
      setTimeout(() => startNewHand(currentUser, undefined), 1500);
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
      saveChips(currentUser, 0);

      if (state.cpuAllin || state.cpuBet === state.currentBet) {
        return fastForwardToShowdown(state, currentUser);
      }

      return afterPlayerMove(state, currentUser);
    });
  }

  function resetSession() {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);

    fetch("/api/save-game-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: currentUser,
        gameState: null,
      }),
    }).catch(() => {});

    setGame((prev) => {
      const money = 1000;
      showNotification(`🔄 Nova mão! Você tem ${money} fichas.`, false);
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

  function closeVictoryModal() {
    setVictoryModal((v) => ({ ...v, open: false }));
    setGame((prev) => {
      const money = prev.playerMoney <= 0 ? 1000 : prev.playerMoney;
      if (prev.playerMoney <= 0) saveChips(currentUser, 1000);
      return { ...prev, playerMoney: money, showdownStarted: false };
    });
    // Aumentar delay antes de iniciar nova mão
    setTimeout(() => startNewHand(currentUser, undefined), 800);
  }

  // ====================== SUGESTÃO DO JOGADOR ======================
  function getPlayerSuggestion(g) {
    if (!g.playerCards.length) return "";
    if (g.stage === "preflop") {
      const isPair = g.playerCards[0].rank === g.playerCards[1].rank;
      const high = Math.max(g.playerCards[0].rank, g.playerCards[1].rank);
      if (isPair) return "🎯 Par - Considere aumentar";
      if (high >= 12) return "📈 Cartas altas - CALL seguro";
      return "⚠️ Mão fraca - Cuidado";
    }
    if (g.community.length >= 3) {
      const score = getHandRank(g.playerCards, g.community);
      return `📊 ${getHandName(score)}`;
    }
    return "";
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
    g.playerAllin;
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

  // Loading
  if (isLoading || status === "loading") {
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
      {/* Botão de Logout */}
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

      {/* Victory Modal */}
      {victoryModal.open && (
        <VictoryModal
          winner={victoryModal.winner}
          chipsWon={victoryModal.chipsWon}
          handName={victoryModal.handName}
          isSpecial={victoryModal.isSpecial}
          playerName={currentUser}
          onClose={closeVictoryModal}
        />
      )}

      {/* Achievements Modal */}
      {showAchievementsModal && (
        <AchievementsModal
          onClose={() => {
            setShowAchievementsModal(false);
            setNewAchievements([]);
          }}
          newAchievements={newAchievements}
        />
      )}

      {/* Mesa Principal */}
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
          {/* Top Bar */}
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
              ["💰", g.pot],
              ["🎴", stageNames[g.stage] || g.stage],
              ["👤", g.playerMoney],
              ["🤖", g.cpuMoney],
              ["📊", `Aposta: ${g.currentBet}`],
            ].map(([icon, val], i) => (
              <div
                key={i}
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
                    color: "gold",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    marginRight: 5,
                  }}
                >
                  {icon}
                </span>
                {val}
              </div>
            ))}
          </div>

          {/* Layout Principal */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Área do Jogo */}
            <div style={{ flex: 3, minWidth: 280 }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 15 }}
              >
                {/* CPU */}
                <div style={sectionStyle()}>
                  <div style={sectionTitleStyle()}>🤖 CPU</div>
                  <div style={cardsRowStyle()}>
                    {g.cpuCards.length ? (
                      g.cpuCards.map((c, i) => (
                        <Card
                          key={i}
                          card={c}
                          faceDown={!showCpuCards}
                          delay={i * 300}
                          isRevealing={
                            g.stage === "showdown" && g.showdownStarted
                          }
                        />
                      ))
                    ) : (
                      <span style={{ color: "#ffdfaa" }}>Aguardando...</span>
                    )}
                  </div>
                  <div style={handBadgeStyle()}>{g.cpuHandName}</div>
                  {g.cpuThought && (
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
                        animation:
                          g.stage === "showdown"
                            ? "pulse 1s ease-in-out infinite"
                            : "none",
                      }}
                    >
                      {g.cpuThought}
                    </div>
                  )}
                </div>

                {/* Mesa */}
                <div style={sectionStyle()}>
                  <div style={sectionTitleStyle()}>🔥 MESA</div>
                  <div style={cardsRowStyle()}>
                    {g.community.map((c, i) => (
                      <Card key={i} card={c} />
                    ))}
                    {Array(5 - g.community.length)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
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

                {/* Jogador */}
                <div style={sectionStyle()}>
                  <div style={sectionTitleStyle()}>
                    🃏 {currentUser ? currentUser.toUpperCase() : "JOGADOR"}
                  </div>
                  <div style={cardsRowStyle()}>
                    {g.playerCards.length ? (
                      g.playerCards.map((c, i) => <Card key={i} card={c} />)
                    ) : (
                      <span style={{ color: "#ffdfaa" }}>Aguardando...</span>
                    )}
                  </div>
                  {g.playerHandName && (
                    <div style={handBadgeStyle()}>{g.playerHandName}</div>
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

              {/* Botões de Ação */}
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
                  {g.winnerMsg}
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

            {/* Status Panel e Stats Panel */}
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
              />

              <StatsPanel
                username={currentUser}
                onShowAchievements={() => setShowAchievementsModal(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================== ESTILOS UTILITÁRIOS ======================
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

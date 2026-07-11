"use client";
import { useState, useEffect, useRef, useCallback } from "react";
 
// ====================== LÓGICA DO BARALHO ======================
function createDeck() {
  const suits = ["♥", "♦", "♣", "♠"];
  const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  let d = [];
  for (let s of suits) for (let r of ranks) d.push({ rank: r, suit: s });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
 
function evaluate5(cards) {
  let ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
  let suits = cards.map((c) => c.suit);
  let flush = suits.every((s) => s === suits[0]);
  let unique = [...new Set(ranks)];
  let straight =
    (unique.length === 5 && ranks[4] - ranks[0] === 4) ||
    (unique.length === 5 &&
      ranks[0] === 2 &&
      ranks[1] === 3 &&
      ranks[2] === 4 &&
      ranks[3] === 5 &&
      ranks[4] === 14);
  let counts = {};
  ranks.forEach((r) => (counts[r] = (counts[r] || 0) + 1));
  let vals = Object.values(counts);
  let isFour = vals.includes(4);
  let isThree = vals.includes(3);
  let pairs = vals.filter((v) => v === 2).length;
  let fullHouse = isThree && pairs === 1;
  let twoPair = pairs === 2;
  let onePair = pairs === 1;
  let score = 0;
  if (flush && straight) score = 9;
  else if (isFour) score = 8;
  else if (fullHouse) score = 7;
  else if (flush) score = 6;
  else if (straight) score = 5;
  else if (isThree) score = 4;
  else if (twoPair) score = 3;
  else if (onePair) score = 2;
  else score = 1;
  let kickers = ranks.slice().sort((a, b) => b - a);
  return score * 10 ** 10 + kickers.reduce((a, b) => a * 100 + b, 0);
}
 
function getHandRank(cards, community) {
  let all = [...cards, ...community];
  let best = 0;
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++)
      for (let k = j + 1; k < all.length; k++)
        for (let l = k + 1; l < all.length; l++)
          for (let m = l + 1; m < all.length; m++) {
            let score = evaluate5([all[i], all[j], all[k], all[l], all[m]]);
            if (score > best) best = score;
          }
  return best;
}
 
function getHandName(score) {
  let type = Math.floor(score / 10 ** 10);
  const names = ["", "Carta Alta", "Um Par", "Dois Pares", "Trinca", "Sequência", "Flush", "Full House", "Quadra", "Straight Flush"];
  return names[type] || "Carta Alta";
}
 
function calculateHandStrength(hand, community) {
  if (!hand || hand.length < 2) return 0.3;
  let high = Math.max(hand[0].rank, hand[1].rank);
  let isPair = hand[0].rank === hand[1].rank;
  let suited = hand[0].suit === hand[1].suit;
  if (community.length >= 3) {
    let handType = Math.floor(getHandRank(hand, community) / 10 ** 10);
    if (handType >= 7) return 0.98;
    if (handType >= 5) return 0.92;
    if (handType >= 4) return 0.85;
    if (handType >= 3) return 0.70;
    if (handType >= 2) return 0.55;
    return 0.40;
  }
  if (isPair) {
    if (high >= 13) return 0.96;
    if (high >= 12) return 0.90;
    if (high >= 10) return 0.80;
    if (high >= 8) return 0.70;
    return 0.60;
  }
  if (high === 14 && Math.min(hand[0].rank, hand[1].rank) >= 12) return 0.88;
  if (high >= 13 && Math.min(hand[0].rank, hand[1].rank) >= 12) return 0.82;
  if (high >= 12 && suited) return 0.78;
  if (high >= 12) return 0.70;
  if (high >= 10 && suited) return 0.65;
  if (high >= 10) return 0.55;
  if (high >= 8 && suited) return 0.50;
  return 0.35;
}
 
function calculateRaiseAmount(strength, potSize, currentBet, playerBet, raiseCounter, cpuMoney) {
  let baseRaise = 50 + raiseCounter * 50;
  let potBasedRaise = Math.floor(potSize * 0.3);
  let mult = strength > 0.9 ? 2.5 : strength > 0.8 ? 2.0 : strength > 0.7 ? 1.5 : strength > 0.6 ? 1.2 : strength > 0.5 ? 0.9 : 0.7;
  let finalRaise = Math.max(baseRaise, Math.floor(potBasedRaise * mult));
  if (playerBet > 0 && strength > 0.65) finalRaise = Math.max(finalRaise, Math.floor(currentBet * 1.5));
  finalRaise = Math.ceil(finalRaise / 25) * 25;
  return Math.min(finalRaise, cpuMoney);
}
 
function shouldGoAllIn(strength, toCall, potSize, cpuChipsLeft) {
  if (strength > 0.92) return true;
  if (strength > 0.85 && potSize > 300) return true;
  if (strength > 0.65 && cpuChipsLeft < 150) return true;
  if (strength > 0.35 && cpuChipsLeft < 200 && Math.random() < 0.1) return true;
  if (toCall > 0 && toCall >= cpuChipsLeft && strength > 0.45) return true;
  return false;
}
 
// ====================== COMPONENTE CARTA ======================
function Card({ card, faceDown = false }) {
  if (faceDown) {
    return (
      <div style={{
        width: 70, height: 100, borderRadius: 10,
        background: "repeating-linear-gradient(45deg,#2b5797,#2b5797 15px,#1d3f6e 15px,#1d3f6e 30px)",
        boxShadow: "-2px 2px 8px rgba(0,0,0,0.5)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        margin: "0 3px", flexShrink: 0
      }}>
        <span style={{ fontSize: "1.8rem", color: "#ffd966", fontWeight: "bold" }}>?</span>
      </div>
    );
  }
  let r = card.rank;
  if (r === 11) r = "J";
  if (r === 12) r = "Q";
  if (r === 13) r = "K";
  if (r === 14) r = "A";
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <div style={{
      width: 70, height: 100, background: "linear-gradient(145deg,#fff,#f8f4e8)",
      borderRadius: 10, boxShadow: "-2px 2px 8px rgba(0,0,0,0.5)",
      display: "inline-flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", margin: "0 3px", flexShrink: 0,
      color: isRed ? "#c33" : "#1f2a2f", fontWeight: "bold"
    }}>
      <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{r}</div>
      <div style={{ fontSize: "2rem", lineHeight: 1 }}>{card.suit}</div>
    </div>
  );
}
 
// ====================== ESTADO INICIAL ======================
const INITIAL_GAME = {
  deck: [], community: [], playerCards: [], cpuCards: [],
  pot: 0, playerMoney: 0, cpuMoney: 1000,
  currentBet: 0, playerBet: 0, cpuBet: 0,
  stage: "preflop", handActive: false, waitingPlayer: true,
  gameOver: false, playerAllin: false, cpuAllin: false,
  raiseCounter: 0, showdownStarted: false,
  playerHandName: "", cpuHandName: "🔒 ???",
  winnerMsg: "", cpuThought: "", playerSuggestion: "", gameStatus: "Pré-flop",
};
 
// ====================== COMPONENTE PRINCIPAL ======================
export default function PokerGame() {
  const [game, setGame] = useState(INITIAL_GAME);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [notification, setNotification] = useState({ msg: "", isError: false, visible: false });
  const [victoryModal, setVictoryModal] = useState({ open: false, winner: "", chipsWon: 0, handName: "", isSpecial: false });
  const [isSaving, setIsSaving] = useState(false);
  const cpuTimerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const pendingSaveRef = useRef(false);
 
  // ====================== NOTIFICAÇÃO ======================
  const showNotification = useCallback((msg, isError = false) => {
    setNotification({ msg, isError, visible: true });
    setTimeout(() => setNotification((n) => ({ ...n, visible: false })), 2000);
  }, []);
 
  // ====================== SALVAR FICHAS ======================
  const saveChips = useCallback(async (user, chips, force = false) => {
    if (!user) return;
    if (isSaving && !force) { pendingSaveRef.current = true; return; }
    setIsSaving(true);
    pendingSaveRef.current = false;
    try {
      const res = await fetch("/api/save-chips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, chips }),
      });
      const data = await res.json();
      if (!data.success) setTimeout(() => saveChips(user, chips, true), 2000);
    } catch {
      setTimeout(() => saveChips(user, chips, true), 3000);
    } finally {
      setIsSaving(false);
      if (pendingSaveRef.current && user) saveChips(user, chips, true);
    }
  }, [isSaving]);
 
  // ====================== LOGIN / REGISTER ======================
  async function handleLogin() {
    const { username, password } = loginForm;
    if (!username || !password) { setLoginError("Preencha usuário e senha"); return; }
    try {
      const res = await fetch("/api/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(username);
        setLoginError("");
        startNewHand(username, data.chips);
        showNotification(`✅ Bem-vindo ${username}! Você tem ${data.chips} fichas.`, false);
        if (autoSaveRef.current) clearInterval(autoSaveRef.current);
        autoSaveRef.current = setInterval(() => {
          setGame((g) => { if (g.handActive && !g.gameOver) saveChips(username, g.playerMoney); return g; });
        }, 30000);
      } else {
        setLoginError(data.error || "Erro no login");
      }
    } catch { setLoginError("Erro de conexão com o servidor"); }
  }
 
  async function handleRegister() {
    const { username, password } = loginForm;
    if (!username || !password) { setLoginError("Preencha usuário e senha"); return; }
    try {
      const res = await fetch("/api/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setLoginError("✅ Cadastro realizado! Faça login.");
        setTimeout(() => setLoginError(""), 3000);
      } else {
        setLoginError(data.error || "Erro no cadastro");
      }
    } catch { setLoginError("Erro de conexão com o servidor"); }
  }
 
  // ====================== INICIAR MÃO ======================
  function startNewHand(user, initialMoney) {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
 
    setGame((prev) => {
      let playerMoney = initialMoney !== undefined ? initialMoney : prev.playerMoney;
      let cpuMoney = prev.cpuMoney <= 0 ? 1000 : prev.cpuMoney;
 
      if (playerMoney <= 0) {
        showNotification(`💀 Você FALIU! Clique em NOVA MÃO para recomeçar.`, true);
        return { ...prev, gameOver: true, handActive: false, playerMoney: 0, cpuMoney };
      }
 
      const deck = createDeck();
      const playerCards = [deck.pop(), deck.pop()];
      const cpuCards = [deck.pop(), deck.pop()];
 
      let pot = 0, playerBet = 0, cpuBet = 0, currentBet = 0;
      let playerAllin = false, cpuAllin = false;
 
      const sb = 25, bb = 50;
      if (playerMoney >= sb) { playerMoney -= sb; playerBet = sb; pot += sb; }
      else { playerBet = playerMoney; pot += playerMoney; playerMoney = 0; playerAllin = true; }
      if (cpuMoney >= bb) { cpuMoney -= bb; cpuBet = bb; pot += bb; }
      else { cpuBet = cpuMoney; pot += cpuMoney; cpuMoney = 0; cpuAllin = true; }
      currentBet = Math.max(playerBet, cpuBet);
 
      const newG = {
        deck, community: [], playerCards, cpuCards,
        pot, playerMoney, cpuMoney, currentBet, playerBet, cpuBet,
        stage: "preflop", handActive: true, waitingPlayer: true,
        gameOver: false, playerAllin, cpuAllin, raiseCounter: 0,
        showdownStarted: false, playerHandName: "", cpuHandName: "🔒 ???",
        winnerMsg: "", cpuThought: "", playerSuggestion: "", gameStatus: "Pré-flop - Sua vez",
      };
 
      const u = user || currentUser;
      setTimeout(() => saveChips(u, newG.playerMoney), 100);
 
      if ((playerAllin || cpuAllin) && playerBet === currentBet && cpuBet === currentBet) {
        return fastForwardToShowdown(newG, u);
      }
      return newG;
    });
  }
 
  // ====================== FAST FORWARD ======================
  function fastForwardToShowdown(g, user) {
    let state = { ...g };
    while (state.stage !== "river") {
      if (state.stage === "preflop") {
        state.stage = "flop";
        state.community = [...state.community, state.deck.pop(), state.deck.pop(), state.deck.pop()];
      } else if (state.stage === "flop") {
        state.stage = "turn";
        state.community = [...state.community, state.deck.pop()];
      } else if (state.stage === "turn") {
        state.stage = "river";
        state.community = [...state.community, state.deck.pop()];
      } else break;
    }
    return doShowdown(state, user);
  }
 
  // ====================== SHOWDOWN ======================
  function doShowdown(g, user) {
    if (!g.handActive || g.showdownStarted) return g;
    let state = { ...g, showdownStarted: true, handActive: false, stage: "showdown" };
    const pScore = getHandRank(state.playerCards, state.community);
    const cScore = getHandRank(state.cpuCards, state.community);
    const pName = getHandName(pScore);
    const cName = getHandName(cScore);
    state.playerHandName = `🏆 ${pName}`;
    state.cpuHandName = `🤖 ${cName}`;
    state.gameStatus = "Showdown";
 
    const u = user || currentUser;
 
    if (pScore > cScore) {
      state.playerMoney += state.pot;
      const won = state.pot;
      state.winnerMsg = `🏆 Você venceu com ${pName}!`;
      state.cpuThought = `🤖 CPU: '${cName}... Você foi melhor!'`;
      setTimeout(() => {
        showNotification(`🎉 VOCÊ VENCEU! +${won} fichas!`, false);
        saveChips(u, state.playerMoney);
        setVictoryModal({ open: true, winner: "player", chipsWon: won, handName: pName, isSpecial: won >= 500 || pScore / 10 ** 10 >= 7 });
      }, 100);
    } else if (cScore > pScore) {
      state.cpuMoney += state.pot;
      const lost = state.pot;
      state.winnerMsg = `🤖 CPU venceu com ${cName}!`;
      state.cpuThought = `🤖 CPU: '${cName}! Ganhei!'`;
      setTimeout(() => {
        showNotification(`😞 CPU venceu com ${cName}. Perdeu ${lost} fichas.`, true);
        saveChips(u, state.playerMoney);
        setVictoryModal({ open: true, winner: "cpu", chipsWon: lost, handName: cName, isSpecial: false });
      }, 100);
    } else {
      const split = Math.floor(state.pot / 2);
      state.playerMoney += split;
      state.cpuMoney += state.pot - split;
      state.winnerMsg = `🤝 Empate! ${pName} — Pote dividido.`;
      state.cpuThought = "🤖 CPU: 'Empate justo.'";
      setTimeout(() => {
        showNotification(`🤝 Empate! Você recebeu ${split} fichas.`, false);
        saveChips(u, state.playerMoney);
        setTimeout(() => {
          setGame((prev) => ({ ...prev, showdownStarted: false }));
          startNewHand(u, undefined);
        }, 3500);
      }, 100);
    }
    return state;
  }
 
  // ====================== AVANÇAR FASE ======================
  function advanceStage(g, user) {
    let state = { ...g };
    if (!state.playerAllin && !state.cpuAllin) {
      state.playerBet = 0; state.cpuBet = 0; state.currentBet = 0;
    }
    state.raiseCounter = 0;
 
    if (state.stage === "preflop") {
      state.stage = "flop";
      state.community = [...state.community, state.deck.pop(), state.deck.pop(), state.deck.pop()];
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
 
  // ====================== CPU ACTION ======================
  function triggerCpuAction(g, user) {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    cpuTimerRef.current = setTimeout(() => {
      setGame((prev) => {
        if (!prev.handActive || prev.waitingPlayer) return prev;
        let state = { ...prev };
        let toCall = Math.max(0, state.currentBet - state.cpuBet);
 
        if (state.cpuAllin) {
          state.cpuThought = "🤖 CPU: 'Já estou all-in...'";
          if (state.playerBet === state.currentBet) return fastForwardToShowdown(state, user);
          return { ...state, waitingPlayer: true };
        }
 
        const strength = calculateHandStrength(state.cpuCards, state.community);
 
        if (shouldGoAllIn(strength, toCall, state.pot, state.cpuMoney)) {
          const amount = state.cpuMoney;
          if (amount > 0) {
            state.cpuMoney = 0;
            state.cpuBet += amount;
            state.pot += amount;
            if (state.cpuBet > state.currentBet) { state.currentBet = state.cpuBet; state.raiseCounter++; }
            state.cpuAllin = true;
            state.cpuThought = "🤖 CPU: 'ALL-IN! Vamos ver!' 💀⚡";
            state.gameStatus = `CPU ALL-IN de ${amount}!`;
            showNotification(`🤖⚡ CPU declarou ALL-IN de ${amount}!`, true);
            if (state.playerBet === state.currentBet || state.playerAllin) return fastForwardToShowdown(state, user);
            return { ...state, waitingPlayer: true };
          }
        }
 
        let shouldRaise = false, raiseAmount = 0;
        if (toCall === 0 && strength > 0.55 && state.cpuMoney >= 50) {
          const chance = strength > 0.8 ? 0.85 : strength > 0.65 ? 0.6 : 0.35;
          if (Math.random() < chance) { shouldRaise = true; raiseAmount = calculateRaiseAmount(strength, state.pot, state.currentBet, state.playerBet, state.raiseCounter, state.cpuMoney); }
        } else if (toCall > 0 && strength > 0.6 && state.cpuMoney >= 50) {
          const chance = strength > 0.85 ? 0.75 : strength > 0.7 ? 0.55 : 0.35;
          if (Math.random() < chance) { shouldRaise = true; raiseAmount = Math.max(calculateRaiseAmount(strength, state.pot, state.currentBet, state.playerBet, state.raiseCounter, state.cpuMoney), state.currentBet + 25); }
        }
 
        if (shouldRaise && raiseAmount > 0) {
          const totalNeeded = (state.currentBet - state.cpuBet) + raiseAmount;
          if (totalNeeded <= state.cpuMoney) {
            state.cpuMoney -= raiseAmount;
            state.cpuBet += raiseAmount;
            state.pot += raiseAmount;
            state.currentBet = state.cpuBet;
            state.raiseCounter++;
            state.cpuThought = `🤖 CPU: 'Vou aumentar para ${state.currentBet}!' 📈`;
            state.gameStatus = `CPU dá RAISE para ${state.currentBet}!`;
            showNotification(`🤖 CPU AUMENTOU para ${state.currentBet}!`, false);
            if (state.playerBet === state.currentBet || state.playerAllin) return advanceStage(state, user);
            return { ...state, waitingPlayer: true };
          }
        }
 
        if (toCall > 0) {
          const callAmount = Math.min(toCall, state.cpuMoney);
          const potOdds = toCall / (state.pot + toCall);
          const adj = strength * 0.7 + (1 - potOdds) * 0.3;
          const willCall = adj > 0.35 || callAmount <= 75 || (strength > 0.4 && callAmount <= 150) || (strength > 0.65) || (Math.random() < 0.2 && callAmount <= 100);
 
          if (willCall && state.cpuMoney > 0) {
            state.cpuMoney -= callAmount;
            state.cpuBet += callAmount;
            state.pot += callAmount;
            if (state.cpuMoney === 0) {
              state.cpuAllin = true;
              state.cpuThought = "🤖 CPU: 'Pago tudo! ALL-IN!' ⚡";
              showNotification(`🤖 CPU paga ${callAmount} e está ALL-IN!`, true);
            } else {
              state.cpuThought = `🤖 CPU: 'Pago ${callAmount}.' 🎴`;
              showNotification(`🤖 CPU paga ${callAmount} fichas`, false);
            }
            state.gameStatus = `CPU paga ${callAmount}`;
            if (state.playerBet === state.currentBet && state.cpuBet === state.currentBet) return advanceStage(state, user);
            return { ...state, waitingPlayer: true };
          } else {
            state.handActive = false;
            state.playerMoney += state.pot;
            state.winnerMsg = "🤖 CPU DESISTIU! Você vence!";
            state.gameStatus = "CPU Fold";
            state.cpuThought = "🤖 CPU: 'Muito caro... Desisto.' 😞";
            showNotification(`🤖 CPU desistiu! Você ganhou ${state.pot} fichas!`, false);
            const u = user || currentUser;
            saveChips(u, state.playerMoney);
            setTimeout(() => startNewHand(u, undefined), 1500);
            return state;
          }
        }
 
        if (toCall === 0) {
          state.cpuThought = "🤖 CPU: 'Vou dar CHECK.' 🤔";
          state.gameStatus = "CPU CHECK";
          showNotification("🤖 CPU deu CHECK", false);
          return advanceStage(state, user);
        }
        return state;
      });
    }, 400);
  }
 
  // ====================== AÇÕES DO JOGADOR ======================
  function afterPlayerMove(state, user) {
    if (state.playerBet === state.currentBet && state.cpuBet === state.currentBet) {
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
      const state = { ...prev, handActive: false, cpuMoney: prev.cpuMoney + prev.pot,
        winnerMsg: `❌ ${currentUser || 'Jogador'} desistiu! CPU vence.`,
        gameStatus: "Você desistiu", cpuThought: "🤖 CPU: 'Boa, ele desistiu!'"
      };
      showNotification(`❌ Você desistiu! Perdeu ${prev.pot} fichas.`, true);
      saveChips(currentUser, state.playerMoney);
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
      if (toCall >= state.playerMoney) { toCall = state.playerMoney; state.playerAllin = true; }
      state.playerMoney -= toCall;
      state.playerBet += toCall;
      state.pot += toCall;
      if (state.playerMoney === 0) state.playerAllin = true;
      showNotification(state.playerAllin ? `⚡ ALL-IN! Você pagou ${toCall} fichas!` : `💰 Você pagou ${toCall} fichas`, state.playerAllin);
      state.gameStatus = state.playerAllin ? "Você pagou ALL-IN!" : `Você pagou ${toCall}`;
      saveChips(currentUser, state.playerMoney);
      return afterPlayerMove(state, currentUser);
    });
  }
 
  function playerRaise() {
    setGame((prev) => {
      if (!prev.handActive || !prev.waitingPlayer || prev.gameOver || prev.playerAllin) return prev;
      const raiseAmount = 50 + prev.raiseCounter * 50;
      const needed = (prev.currentBet - prev.playerBet) + raiseAmount;
      if (needed > prev.playerMoney) { showNotification("❌ Fichas insuficientes!", true); return prev; }
      let state = { ...prev };
      state.playerMoney -= needed;
      state.playerBet += needed;
      state.pot += needed;
      state.currentBet = state.playerBet;
      state.raiseCounter++;
      if (state.playerMoney === 0) state.playerAllin = true;
      showNotification(`📈 Você aumentou para ${state.currentBet}! (+${raiseAmount})`, false);
      state.gameStatus = `Você aumentou para ${state.currentBet}`;
      saveChips(currentUser, state.playerMoney);
      return afterPlayerMove(state, currentUser);
    });
  }
 
  function playerAllIn() {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    setGame((prev) => {
      if (!prev.handActive || !prev.waitingPlayer || prev.gameOver || prev.playerAllin) return prev;
      let state = { ...prev };
      const amount = state.playerMoney;
      state.playerMoney = 0;
      state.playerBet += amount;
      state.pot += amount;
      if (state.playerBet > state.currentBet) state.currentBet = state.playerBet;
      state.playerAllin = true;
      showNotification(`⚡⚡⚡ ALL-IN! ${amount} fichas! ⚡⚡⚡`, true);
      state.gameStatus = "⚡ VOCÊ FOI ALL-IN! ⚡";
      saveChips(currentUser, 0);
      return afterPlayerMove(state, currentUser);
    });
  }
 
  function resetSession() {
    if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
    setGame((prev) => {
      const money = prev.playerMoney <= 0 ? 1000 : prev.playerMoney;
      showNotification(prev.playerMoney <= 0 ? "🔄 Recarregado com 1000 fichas!" : `🔄 Nova mão! Você tem ${money} fichas.`, false);
      return { ...prev, playerMoney: money, cpuMoney: 1000, gameOver: false };
    });
    setTimeout(() => startNewHand(currentUser, undefined), 50);
  }
 
  function closeVictoryModal() {
    setVictoryModal((v) => ({ ...v, open: false }));
    setGame((prev) => {
      const money = prev.playerMoney <= 0 ? 1000 : prev.playerMoney;
      if (prev.playerMoney <= 0) saveChips(currentUser, 1000);
      return { ...prev, playerMoney: money, showdownStarted: false };
    });
    setTimeout(() => startNewHand(currentUser, undefined), 50);
  }
 
  // Sugestão do jogador
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
  const disable = !g.handActive || !g.waitingPlayer || g.gameOver || g.stage === "showdown" || g.playerMoney <= 0 || g.playerAllin;
  const toCall = g.currentBet - g.playerBet;
  const nextRaise = 50 + g.raiseCounter * 50;
  const canRaise = !disable && !g.playerAllin && ((g.currentBet - g.playerBet) + nextRaise) <= g.playerMoney;
  const stageNames = { preflop: "Pré-flop", flop: "Flop", turn: "Turn", river: "River", showdown: "Showdown" };
  const suggestion = getPlayerSuggestion(g);
  const showCpuCards = !g.handActive || g.stage === "showdown";
 
  return (
    <div style={{ margin: 0, minHeight: "100vh", background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Segoe UI','Poppins',system-ui,sans-serif", padding: 15, userSelect: "none" }}>
 
      {/* LOGIN MODAL */}
      {!currentUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "linear-gradient(145deg,#2a6e3a,#0a4122)", padding: "25px 35px", borderRadius: 50, textAlign: "center", color: "#ffefb9", boxShadow: "0 0 50px rgba(0,0,0,0.5)", border: "2px solid gold", minWidth: 320, maxWidth: "90%" }}>
            <h2 style={{ margin: "0 0 15px", fontSize: "1.8rem" }}>🎴 TEXAS HOLD'EM 🎴</h2>
            <p>Login para jogar:</p>
            <input value={loginForm.username} onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="Usuário" autoComplete="off"
              style={{ padding: "10px 20px", fontSize: "1rem", borderRadius: 50, border: "none", textAlign: "center", fontWeight: "bold", marginBottom: 10, width: "100%", boxSizing: "border-box" }} />
            <input type="password" value={loginForm.password}
              onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Senha"
              style={{ padding: "10px 20px", fontSize: "1rem", borderRadius: 50, border: "none", textAlign: "center", fontWeight: "bold", marginBottom: 15, width: "100%", boxSizing: "border-box" }} />
            <div>
              <button onClick={handleLogin} style={btnStyle()}>ENTRAR</button>
              <button onClick={handleRegister} style={btnStyle()}>CADASTRAR</button>
            </div>
            {loginError && <div style={{ color: loginError.startsWith("✅") ? "#88ff88" : "#ff8888", fontSize: "0.8rem", marginTop: 10 }}>{loginError}</div>}
          </div>
        </div>
      )}
 
      {/* VICTORY MODAL */}
      {victoryModal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1001, padding: 20 }}>
          <div style={{ background: "linear-gradient(145deg,#ffd700,#ff8c00)", padding: "30px 50px", borderRadius: 60, textAlign: "center", color: "#2e241f", boxShadow: "0 0 80px rgba(255,215,0,0.6)", border: "3px solid white", maxWidth: "90%" }}>
            <div style={{ fontSize: "2rem" }}>{victoryModal.winner === "player" ? "🏆🎉💰" : "🤖💔"}</div>
            <h2 style={{ fontSize: "2.5rem", margin: "10px 0", textShadow: "2px 2px 0 rgba(255,255,255,0.5)" }}>{victoryModal.winner === "player" ? "🎉 VITÓRIA ÉPICA! 🎉" : "😔 VITÓRIA DA CPU"}</h2>
            <p style={{ fontSize: "1.3rem", fontWeight: "bold" }}>O grande vencedor é:</p>
            <div style={{ fontSize: "2rem", color: "#fff", textShadow: "2px 2px 0 #b45f06", margin: "15px 0" }}>{victoryModal.winner === "player" ? (currentUser || "JOGADOR") : "CPU"}</div>
            <div style={{ fontSize: "1.5rem", margin: "10px 0", color: victoryModal.winner === "player" ? (victoryModal.isSpecial ? "#ff0000" : "#ff6600") : "#ff8888", fontWeight: "bold" }}>
              {victoryModal.winner === "player" ? (victoryModal.isSpecial ? "💥 QUEBROU A BANCA! 💥" : victoryModal.chipsWon >= 200 ? "🔥 GRANDE VITÓRIA! 🔥" : "⭐ BOA MÃO! ⭐") : "🤖 A CPU venceu esta mão!"}
            </div>
            <p style={{ fontSize: "1.3rem", fontWeight: "bold", color: victoryModal.winner === "player" ? "#00ff00" : "#ff8888" }}>
              {victoryModal.winner === "player" ? `💰 Você ganhou ${victoryModal.chipsWon} fichas!` : `💔 Você perdeu ${victoryModal.chipsWon} fichas...`}
            </p>
            <button onClick={closeVictoryModal} style={{ ...btnStyle(), fontSize: "1.1rem", padding: "10px 30px", marginTop: 15, background: "radial-gradient(#fff,#f0f0f0)", boxShadow: "0 4px 0 #b45f06" }}>JOGAR NOVAMENTE</button>
          </div>
        </div>
      )}
 
      {/* MESA */}
      <div style={{ background: "radial-gradient(circle at 30% 20%,#1c6e3c,#0a4122)", borderRadius: 50, boxShadow: "0 30px 40px rgba(0,0,0,0.5),inset 0 2px 5px rgba(255,255,255,0.2)", padding: 20, maxWidth: 1600, width: "100%" }}>
        <div style={{ background: "rgba(0,20,0,0.3)", borderRadius: 40, padding: 15 }}>
 
          {/* TOP BAR */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#2c2e2bdd", backdropFilter: "blur(8px)", borderRadius: 50, padding: "8px 20px", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            {[["💰", g.pot], ["🎴", stageNames[g.stage] || g.stage], ["👤", g.playerMoney], ["🤖", g.cpuMoney], ["📊", `Aposta: ${g.currentBet}`]].map(([icon, val], i) => (
              <div key={i} style={{ background: "#1e1b14cc", padding: "5px 15px", borderRadius: 40, color: "white", fontWeight: "bold", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                <span style={{ color: "gold", fontSize: "1.1rem", fontWeight: 800, marginRight: 5 }}>{icon}</span>{val}
              </div>
            ))}
          </div>
 
          {/* LAYOUT PRINCIPAL */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* ÁREA DO JOGO */}
            <div style={{ flex: 3, minWidth: 280 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {/* CPU */}
                <div style={sectionStyle()}>
                  <div style={sectionTitleStyle()}>🤖 CPU</div>
                  <div style={cardsRowStyle()}>
                    {g.cpuCards.length ? g.cpuCards.map((c, i) => <Card key={i} card={c} faceDown={!showCpuCards} />) : <span style={{ color: "#ffdfaa" }}>Aguardando...</span>}
                  </div>
                  <div style={handBadgeStyle()}>{g.cpuHandName}</div>
                  {g.cpuThought && <div style={{ background: "#2a1f0ecc", borderRadius: 20, padding: "4px 10px", fontSize: "0.7rem", marginTop: 6, display: "inline-block", color: "#ffcc88", fontStyle: "italic" }}>{g.cpuThought}</div>}
                </div>
 
                {/* MESA */}
                <div style={sectionStyle()}>
                  <div style={sectionTitleStyle()}>🔥 MESA</div>
                  <div style={cardsRowStyle()}>
                    {g.community.map((c, i) => <Card key={i} card={c} />)}
                    {Array(5 - g.community.length).fill(0).map((_, i) => (
                      <div key={i} style={{ width: 70, height: 100, borderRadius: 10, background: "repeating-linear-gradient(45deg,#2b5797,#2b5797 15px,#1d3f6e 15px,#1d3f6e 30px)", margin: "0 3px", opacity: 0.4, flexShrink: 0 }} />
                    ))}
                  </div>
                </div>
 
                {/* JOGADOR */}
                <div style={sectionStyle()}>
                  <div style={sectionTitleStyle()}>🃏 {currentUser ? currentUser.toUpperCase() : "JOGADOR"}</div>
                  <div style={cardsRowStyle()}>
                    {g.playerCards.length ? g.playerCards.map((c, i) => <Card key={i} card={c} />) : <span style={{ color: "#ffdfaa" }}>Aguardando...</span>}
                  </div>
                  {g.playerHandName && <div style={handBadgeStyle()}>{g.playerHandName}</div>}
                  {suggestion && <div style={{ background: "#1e5631cc", borderLeft: "3px solid gold", padding: "4px 10px", fontSize: "0.7rem", marginTop: 5, borderRadius: 15, color: "white" }}>{suggestion}</div>}
                </div>
              </div>
 
              {/* BOTÕES */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
                <button disabled={disable} onClick={playerFold} style={btnStyle(disable)}>❌ FOLD</button>
                <button disabled={disable} onClick={playerCall} style={btnStyle(disable)}>💰 {!disable && toCall > 0 ? `CALL (${toCall})` : "CALL"}</button>
                <button disabled={!canRaise} onClick={playerRaise} style={btnStyle(!canRaise)}>📈 RAISE +{nextRaise}</button>
                <button disabled={disable} onClick={playerAllIn} style={{ ...btnStyle(disable), background: "radial-gradient(#e0852c,#b85c0e)", color: "white" }}>⚡ ALL-IN</button>
                <button onClick={resetSession} style={{ ...btnStyle(false), background: "radial-gradient(#b34242,#6e1e1e)", color: "#ffddbb", boxShadow: "0 4px 0 #3e1515" }}>🔄 NOVA MÃO</button>
              </div>
 
              {g.winnerMsg && <div style={{ background: "#000000bb", backdropFilter: "blur(12px)", borderRadius: 40, padding: "6px 15px", textAlign: "center", fontWeight: "bold", fontSize: "0.85rem", color: "#ffd966", marginTop: 12 }}>{g.winnerMsg}</div>}
              <div style={{ textAlign: "center", marginTop: 12, fontSize: "0.7rem", color: "#c9a96e", textShadow: "1px 1px 0 #2a1f0e" }}>Desenvolvido por BruCe - 2026</div>
            </div>
 
            {/* STATUS */}
            <div style={{ flex: 1, minWidth: 220, background: "#1a2a1ecc", backdropFilter: "blur(4px)", borderRadius: 30, padding: 15, color: "white" }}>
              <h3 style={{ color: "gold", margin: "0 0 15px", textAlign: "center", fontSize: "1rem" }}>📋 STATUS DA PARTIDA</h3>
              <div style={statusCardStyle()}>
                <p style={statusPStyle()}><span style={{ color: "gold", fontWeight: "bold" }}>🎯 Fase:</span> {stageNames[g.stage] || g.stage}</p>
                <p style={statusPStyle()}><span style={{ color: "gold", fontWeight: "bold" }}>💰 Pote:</span> {g.pot}</p>
                <p style={statusPStyle()}><span style={{ color: "gold", fontWeight: "bold" }}>🎴 Aposta atual:</span> {g.currentBet}</p>
              </div>
              <div style={statusCardStyle()}>
                <p style={statusPStyle()}><span style={{ color: "gold", fontWeight: "bold" }}>👤 Você apostou:</span> {g.playerBet}</p>
                <p style={statusPStyle()}><span style={{ color: "gold", fontWeight: "bold" }}>🤖 CPU apostou:</span> {g.cpuBet}</p>
              </div>
              <div style={statusCardStyle()}>
                <p style={statusPStyle()}><span style={{ color: "gold", fontWeight: "bold" }}>📈 Próximo raise:</span> +{nextRaise} fichas</p>
                <p style={statusPStyle()}><span style={{ color: "gold", fontWeight: "bold" }}>⚡ All-in:</span> Apostar tudo</p>
              </div>
              {notification.visible && (
                <div style={{ background: notification.isError ? "linear-gradient(135deg,#ff4444,#cc0000)" : "linear-gradient(135deg,#ffd700,#ff8c00)", borderRadius: 20, padding: 10, marginTop: 15, textAlign: "center", color: "#2e241f", fontWeight: "bold", fontSize: "0.8rem" }}>
                  {notification.msg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 
// ====================== ESTILOS UTILITÁRIOS ======================
function btnStyle(disabled = false) {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)", border: "none", fontWeight: "bold",
    fontSize: "0.9rem", padding: "8px 20px", borderRadius: 60, cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: "0 4px 0 #7a4c1a", color: "#2e241f", fontFamily: "inherit", whiteSpace: "nowrap",
    opacity: disabled ? 0.5 : 1, minHeight: 44,
  };
}
function sectionStyle() {
  return { background: "rgba(0,0,0,0.4)", borderRadius: 30, padding: 10, textAlign: "center" };
}
function sectionTitleStyle() {
  return { color: "#ffefb9", fontWeight: "bold", marginBottom: 6, fontSize: "0.8rem", background: "#00000066", display: "inline-block", padding: "2px 12px", borderRadius: 40 };
}
function cardsRowStyle() {
  return { display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 5, minHeight: 110, alignItems: "center" };
}
function handBadgeStyle() {
  return { background: "#000000aa", borderRadius: 60, padding: "4px 10px", fontSize: "0.75rem", marginTop: 6, display: "inline-block", color: "#ffdd99", fontWeight: "bold" };
}
function statusCardStyle() {
  return { background: "#0a1a0eaa", borderRadius: 20, padding: 10, marginBottom: 15 };
}
function statusPStyle() {
  return { margin: "5px 0", fontSize: "0.85rem", color: "#ffefb9", wordBreak: "break-word" };
}
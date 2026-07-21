// lib/game/GameService.js
import { CPUPlayer } from "../poker/cpu.js";
import { evaluateHand, getHandRank } from "../poker/evaluation.js";
import { getHandStrength } from "../poker/strength.js";
import { calculatePotOdds, calculateExpectedValue } from "../poker/odds.js";

export class GameService {
  constructor() {
    this.gameState = null;
    this.cpuPlayer = new CPUPlayer("medium");
  }

  /**
   * Inicializa um novo jogo
   */
  initializeGame(playerChips = 1000, cpuChips = 1000) {
    this.gameState = {
      playerChips,
      cpuChips,
      pot: 0,
      currentBet: 0,
      round: "preflop",
      communityCards: [],
      playerCards: [],
      cpuCards: [],
      playerCurrentBet: 0,
      cpuCurrentBet: 0,
      gameOver: false,
      winner: null,
      actions: [],
    };

    return this.gameState;
  }

  /**
   * Processa uma ação do jogador
   */
  processPlayerAction(action, amount = 0) {
    if (!this.gameState || this.gameState.gameOver) {
      throw new Error("Jogo não está ativo");
    }

    let result = { action, amount, success: true };

    switch (action) {
      case "fold":
        this.gameState.winner = "cpu";
        this.gameState.gameOver = true;
        result.message = "Você desistiu!";
        break;

      case "check_or_call":
        if (this.gameState.currentBet > 0) {
          const callAmount =
            this.gameState.currentBet - this.gameState.playerCurrentBet;
          this.gameState.playerChips -= callAmount;
          this.gameState.pot += callAmount;
          this.gameState.playerCurrentBet = this.gameState.currentBet;
          result.amount = callAmount;
          result.message = `Você pagou R$ ${callAmount}`;
        } else {
          result.message = "Você deu check";
        }
        break;

      case "raise":
        if (amount <= this.gameState.currentBet) {
          throw new Error("O raise deve ser maior que a aposta atual");
        }
        const raiseAmount = amount - this.gameState.playerCurrentBet;
        this.gameState.playerChips -= raiseAmount;
        this.gameState.pot += raiseAmount;
        this.gameState.currentBet = amount;
        this.gameState.playerCurrentBet = amount;
        result.amount = raiseAmount;
        result.message = `Você aumentou para R$ ${amount}`;
        break;

      case "all-in":
        const allInAmount = this.gameState.playerChips;
        this.gameState.pot += allInAmount;
        this.gameState.playerCurrentBet += allInAmount;
        this.gameState.playerChips = 0;
        result.amount = allInAmount;
        result.message = "Você foi all-in!";
        break;
    }

    this.gameState.actions.push({
      player: "player",
      action,
      amount,
      timestamp: Date.now(),
    });

    // Verificar se o jogo deve terminar
    if (!this.gameState.gameOver) {
      this.processCPUAction();
    }

    return result;
  }

  /**
   * Processa a ação da CPU
   */
  processCPUAction() {
    if (this.gameState.gameOver) return;

    const cpuDecision = this.cpuPlayer.decideAction(
      this.gameState,
      this.gameState.cpuCards,
      this.gameState.communityCards,
      this.gameState.pot,
      this.gameState.currentBet,
      this.gameState.cpuChips,
    );

    // Processar decisão da CPU
    const result = this.executeCPUAction(cpuDecision);
    this.gameState.actions.push({ player: "cpu", ...result });

    // Verificar se o jogo deve terminar
    if (!this.gameState.gameOver) {
      // Avançar para a próxima rodada ou showdown
      this.advanceRound();
    }
  }

  /**
   * Executa a ação decidida pela CPU
   */
  executeCPUAction(decision) {
    let result = { action: decision.action, amount: 0 };

    switch (decision.action) {
      case "fold":
        this.gameState.winner = "player";
        this.gameState.gameOver = true;
        result.message = "CPU desistiu!";
        break;

      case "call":
        const callAmount =
          this.gameState.currentBet - this.gameState.cpuCurrentBet;
        this.gameState.cpuChips -= callAmount;
        this.gameState.pot += callAmount;
        this.gameState.cpuCurrentBet = this.gameState.currentBet;
        result.amount = callAmount;
        result.message = `CPU pagou R$ ${callAmount}`;
        break;

      case "raise":
        const raiseAmount = decision.amount - this.gameState.cpuCurrentBet;
        this.gameState.cpuChips -= raiseAmount;
        this.gameState.pot += raiseAmount;
        this.gameState.currentBet = decision.amount;
        this.gameState.cpuCurrentBet = decision.amount;
        result.amount = raiseAmount;
        result.message = `CPU aumentou para R$ ${decision.amount}`;
        break;

      case "check":
        result.message = "CPU deu check";
        break;

      case "all-in":
        const allInAmount = this.gameState.cpuChips;
        this.gameState.pot += allInAmount;
        this.gameState.cpuCurrentBet += allInAmount;
        this.gameState.cpuChips = 0;
        result.amount = allInAmount;
        result.message = "CPU foi all-in!";
        break;
    }

    return result;
  }

  /**
   * Avança para a próxima rodada
   */
  advanceRound() {
    if (this.gameState.gameOver) return;

    const rounds = ["preflop", "flop", "turn", "river"];
    const currentIndex = rounds.indexOf(this.gameState.round);

    if (currentIndex < rounds.length - 1) {
      this.gameState.round = rounds[currentIndex + 1];
      // Adicionar novas cartas comunitárias baseado na rodada
      this.dealCommunityCards();
    } else {
      // Showdown
      this.showdown();
    }
  }

  /**
   * Distribui cartas comunitárias baseado na rodada
   */
  dealCommunityCards() {
    // Simular distribuição de cartas
    // Em uma implementação real, isso viria do baralho
    console.log(`Distribuindo cartas para ${this.gameState.round}`);
  }

  /**
   * Realiza o showdown (revelação das mãos)
   */
  showdown() {
    const playerHand = evaluateHand(
      this.gameState.playerCards,
      this.gameState.communityCards,
    );
    const cpuHand = evaluateHand(
      this.gameState.cpuCards,
      this.gameState.communityCards,
    );

    // Comparar mãos
    let winner = null;
    let message = "";

    if (playerHand.value > cpuHand.value) {
      winner = "player";
      message = `Você venceu com ${playerHand.name}!`;
      this.gameState.playerChips += this.gameState.pot;
    } else if (cpuHand.value > playerHand.value) {
      winner = "cpu";
      message = `CPU venceu com ${cpuHand.name}!`;
      this.gameState.cpuChips += this.gameState.pot;
    } else {
      // Empate (dividir o pote)
      winner = "tie";
      message = "Empate! O pote foi dividido.";
      const halfPot = Math.floor(this.gameState.pot / 2);
      this.gameState.playerChips += halfPot;
      this.gameState.cpuChips += this.gameState.pot - halfPot;
    }

    this.gameState.winner = winner;
    this.gameState.gameOver = true;
    this.gameState.showdownResult = {
      message,
      playerHand: playerHand.name,
      cpuHand: cpuHand.name,
    };
  }

  /**
   * Obtém o estado atual do jogo
   */
  getGameState() {
    return this.gameState;
  }

  /**
   * Verifica se o jogo terminou
   */
  isGameOver() {
    return this.gameState && this.gameState.gameOver;
  }

  /**
   * Reinicia o jogo
   */
  resetGame() {
    this.gameState = null;
  }
}

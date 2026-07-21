// models/Tournament.js
import mongoose from "mongoose";

const TournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["waiting", "active", "finished", "cancelled"],
      default: "waiting",
    },
    type: {
      type: String,
      enum: ["freezeout", "rebuyd", "knockout"],
      default: "freezeout",
    },
    maxPlayers: {
      type: Number,
      default: 20,
    },
    minPlayers: {
      type: Number,
      default: 4,
    },
    buyIn: {
      type: Number,
      default: 100,
    },
    prizePool: {
      type: Number,
      default: 0,
    },
    prizeDistribution: {
      type: Array,
      default: [],
    },
    players: [
      {
        username: String,
        chips: Number,
        isEliminated: { type: Boolean, default: false },
        position: Number,
        prize: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now },
        eliminatedAt: Date,
        handsPlayed: { type: Number, default: 0 },
      },
    ],
    blinds: {
      currentLevel: { type: Number, default: 0 },
      levels: [
        {
          level: Number,
          smallBlind: Number,
          bigBlind: Number,
          duration: Number,
        },
      ],
    },
    currentBlindLevel: {
      type: Number,
      default: 0,
    },
    blindTimer: {
      type: Number,
      default: 0,
    },
    startedAt: Date,
    finishedAt: Date,
    createdBy: String,
    totalHands: { type: Number, default: 0 },
    totalRebuys: { type: Number, default: 0 },
    averageStack: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// 🔥 MÉTODO PARA ADICIONAR JOGADOR
TournamentSchema.methods.addPlayer = async function (username, chips) {
  if (this.players.length >= this.maxPlayers) {
    throw new Error("Torneio lotado");
  }
  if (this.players.find((p) => p.username === username)) {
    throw new Error("Jogador já inscrito");
  }
  this.players.push({
    username,
    chips: chips || this.buyIn * 10,
    isEliminated: false,
    joinedAt: new Date(),
  });
  await this.save();
  return this;
};

// 🔥 MÉTODO PARA REMOVER JOGADOR
TournamentSchema.methods.removePlayer = async function (username) {
  this.players = this.players.filter((p) => p.username !== username);
  await this.save();
  return this;
};

// 🔥 MÉTODO PARA ELIMINAR JOGADOR
TournamentSchema.methods.eliminatePlayer = async function (username) {
  const player = this.players.find((p) => p.username === username);
  if (player) {
    player.isEliminated = true;
    player.eliminatedAt = new Date();
    await this.save();
  }
  return this;
};

// 🔥 MÉTODO PARA ATUALIZAR PRIZE POOL
TournamentSchema.methods.updatePrizePool = async function () {
  const totalBuyIn = this.players.length * this.buyIn;
  this.prizePool = totalBuyIn * 0.9;
  this.prizeDistribution = calculatePrizeDistribution(
    this.players.length,
    this.prizePool,
  );
  await this.save();
  return this;
};

// 🔥 FUNÇÃO PARA CALCULAR DISTRIBUIÇÃO DE PRÊMIOS
function calculatePrizeDistribution(numPlayers, prizePool) {
  const distribution = [];
  const percentages = [];

  if (numPlayers <= 4) {
    percentages.push(0.5, 0.3, 0.2);
  } else if (numPlayers <= 8) {
    percentages.push(0.4, 0.25, 0.15, 0.1, 0.1);
  } else if (numPlayers <= 16) {
    percentages.push(0.3, 0.2, 0.15, 0.1, 0.08, 0.06, 0.06, 0.05);
  } else {
    percentages.push(
      0.25,
      0.18,
      0.14,
      0.1,
      0.08,
      0.06,
      0.05,
      0.04,
      0.03,
      0.03,
      0.02,
      0.02,
    );
  }

  let remaining = prizePool;
  percentages.forEach((pct, index) => {
    const prize = Math.round(remaining * pct);
    remaining -= prize;
    distribution.push({
      position: index + 1,
      prize: prize,
      percentage: pct,
    });
  });

  if (remaining > 0 && distribution.length > 0) {
    distribution[0].prize += remaining;
  }

  return distribution;
}

const Tournament =
  mongoose.models.Tournament || mongoose.model("Tournament", TournamentSchema);

export default Tournament;

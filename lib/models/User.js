// lib/models/User.js - MODELO DE USUÁRIO COM ÍNDICES
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
    },
    chips: {
      type: Number,
      default: 1000,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    stats: {
      handsPlayed: { type: Number, default: 0 },
      handsWon: { type: Number, default: 0 },
      handsLost: { type: Number, default: 0 },
      handsTied: { type: Number, default: 0 },
      totalChipsWon: { type: Number, default: 0 },
      biggestWin: { type: Number, default: 0 },
      bestStreak: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      bestHand: { type: String, default: "" },
      allInWins: { type: Number, default: 0 },
      vpip: { type: Number, default: 0 }, // Voluntarily Put In Pot
      pfr: { type: Number, default: 0 }, // Pre-Flop Raise
      aggressionFactor: { type: Number, default: 0 },
      handDistribution: { type: mongoose.Schema.Types.Mixed, default: {} },
      monthlyProgress: { type: Array, default: [] },
    },
    achievements: {
      type: [String],
      default: [],
    },
    findings: {
      type: Array,
      default: [],
    },
    missions: {
      type: Array,
      default: [],
    },
    handHistory: {
      type: Array,
      default: [],
      maxSize: 1000, // Limitar histórico
    },
    friends: {
      type: Array,
      default: [],
    },
    savedGameState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================
// 🔥 ÍNDICES PARA PERFORMANCE
// ============================================================

// Índice único para username (já existe via unique: true)
userSchema.index({ username: 1 }, { unique: true });

// Índice para ranking por nível
userSchema.index({ level: -1 });

// Índice para ranking por fichas
userSchema.index({ chips: -1 });

// Índice composto para estatísticas
userSchema.index({ "stats.handsPlayed": -1 });
userSchema.index({ "stats.handsWon": -1 });

// Índice para busca de amigos
userSchema.index({ "friends.username": 1 });

// Índice para atualizações recentes
userSchema.index({ updatedAt: -1 });

// ============================================================
// 🔥 MÉTODOS DO ESQUEMA
// ============================================================

// Método para adicionar XP
userSchema.methods.addXP = function (amount) {
  this.xp += amount;
  this.updatedAt = new Date();
  return this.save();
};

// Método para atualizar estatísticas
userSchema.methods.updateStats = function (gameResult) {
  const stats = this.stats;

  stats.handsPlayed++;

  if (gameResult.result === "win") {
    stats.handsWon++;
    stats.totalChipsWon += gameResult.chips;
    stats.currentStreak++;
    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }
    if (gameResult.chips > stats.biggestWin) {
      stats.biggestWin = gameResult.chips;
    }
    if (
      gameResult.handName &&
      (!stats.bestHand ||
        getHandRankValue(gameResult.handName) >
          getHandRankValue(stats.bestHand))
    ) {
      stats.bestHand = gameResult.handName;
    }
    if (gameResult.wasAllIn) {
      stats.allInWins++;
    }
  } else if (gameResult.result === "loss") {
    stats.handsLost++;
    stats.currentStreak = 0;
  } else if (gameResult.result === "tie") {
    stats.handsTied++;
  }

  this.updatedAt = new Date();
  return this.save();
};

// Método para verificar se o usuário é amigo de outro
userSchema.methods.isFriendOf = function (username) {
  return this.friends.some((f) => f.username === username);
};

// Método para adicionar amigo
userSchema.methods.addFriend = function (username) {
  if (!this.isFriendOf(username)) {
    this.friends.push({ username, addedAt: new Date() });
    this.updatedAt = new Date();
    return this.save();
  }
  return this;
};

// Método para remover amigo
userSchema.methods.removeFriend = function (username) {
  this.friends = this.friends.filter((f) => f.username !== username);
  this.updatedAt = new Date();
  return this.save();
};

// ============================================================
// 🔥 FUNÇÃO AUXILIAR PARA RANKING DE MÃOS
// ============================================================
function getHandRankValue(handName) {
  const ranks = {
    "Royal Flush": 10,
    "Straight Flush": 9,
    Quadra: 8,
    "Full House": 7,
    Flush: 6,
    Sequencia: 5,
    Trinca: 4,
    "Dois Pares": 3,
    "Um Par": 2,
    "Carta Alta": 1,
  };
  return ranks[handName] || 0;
}

// ============================================================
// 🔥 HOOKS DE PRÉ-SAVE E PÓS-SAVE
// ============================================================
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// ============================================================
// 🔥 MODELO
// ============================================================
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;

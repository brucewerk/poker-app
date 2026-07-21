// lib/models/User.js - VERSÃO COMPLETA ATUALIZADA
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    chips: {
      type: Number,
      default: 1000,
    },
    level: {
      type: Number,
      default: 1,
    },
    xp: {
      type: Number,
      default: 0,
    },
    totalXpEarned: {
      type: Number,
      default: 0,
    },
    stats: {
      handsPlayed: { type: Number, default: 0 },
      handsWon: { type: Number, default: 0 },
      totalChipsWon: { type: Number, default: 0 },
      biggestWin: { type: Number, default: 0 },
      bestStreak: { type: Number, default: 0 },
      bestHand: { type: String, default: "" },
      allInWins: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      handsLost: { type: Number, default: 0 },
      handsTied: { type: Number, default: 0 },
    },
    achievements: {
      type: Array,
      default: [],
    },
    findings: {
      type: Array,
      default: [],
    },
    dailyMissions: {
      type: Array,
      default: [],
    },
    lastMissionReset: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginStreak: {
      type: Number,
      default: 0,
    },
    preferences: {
      soundEnabled: { type: Boolean, default: true },
      volume: { type: Number, default: 0.8 },
      theme: { type: String, default: "dark" },
      turboMode: { type: Boolean, default: false },
      notificationsEnabled: { type: Boolean, default: true },
    },
    savedGameState: {
      type: Object,
      default: null,
    },
    friends: {
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
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: false,
  },
);

// 🔥 MIDDLEWARE PARA GARANTIR QUE ARRAYS SEJAM INICIALIZADOS
UserSchema.pre("save", function (next) {
  if (!this.friends) this.friends = [];
  if (!this.missions) this.missions = [];
  if (!this.handHistory) this.handHistory = [];
  if (!this.achievements) this.achievements = [];
  if (!this.findings) this.findings = [];
  if (!this.dailyMissions) this.dailyMissions = [];
  if (!this.preferences) {
    this.preferences = {
      soundEnabled: true,
      volume: 0.8,
      theme: "dark",
      turboMode: false,
      notificationsEnabled: true,
    };
  }
  if (!this.stats) {
    this.stats = {
      handsPlayed: 0,
      handsWon: 0,
      totalChipsWon: 0,
      biggestWin: 0,
      bestStreak: 0,
      bestHand: "",
      allInWins: 0,
      currentStreak: 0,
      handsLost: 0,
      handsTied: 0,
    };
  }
  next();
});

// 🔥 MÉTODO PARA ADICIONAR AO HISTÓRICO
UserSchema.methods.addHandHistory = async function (handData) {
  if (!this.handHistory) {
    this.handHistory = [];
  }

  const handToSave = {
    ...handData,
    timestamp: handData.timestamp || new Date().toISOString(),
  };

  this.handHistory.unshift(handToSave);

  if (this.handHistory.length > 100) {
    this.handHistory = this.handHistory.slice(0, 100);
  }

  return this.save();
};

// 🔥 MÉTODO PARA ADICIONAR AMIGO
UserSchema.methods.addFriend = async function (friendUsername, friendData) {
  if (!this.friends) {
    this.friends = [];
  }

  if (this.friends.some((f) => f.username === friendUsername)) {
    return false;
  }

  this.friends.push({
    username: friendUsername,
    level: friendData?.level || 1,
    chips: friendData?.chips || 0,
    isOnline: false,
    addedAt: new Date(),
  });

  await this.save();
  return true;
};

// 🔥 MÉTODO PARA REMOVER AMIGO
UserSchema.methods.removeFriend = async function (friendUsername) {
  if (!this.friends) {
    this.friends = [];
    return false;
  }

  this.friends = this.friends.filter((f) => f.username !== friendUsername);
  await this.save();
  return true;
};

// 🔥 MÉTODO PARA ATUALIZAR ESTATÍSTICAS
UserSchema.methods.updateStats = async function (
  result,
  chips,
  handName,
  wasAllIn,
) {
  if (!this.stats) {
    this.stats = {
      handsPlayed: 0,
      handsWon: 0,
      totalChipsWon: 0,
      biggestWin: 0,
      bestStreak: 0,
      bestHand: "",
      allInWins: 0,
      currentStreak: 0,
      handsLost: 0,
      handsTied: 0,
    };
  }

  this.stats.handsPlayed = (this.stats.handsPlayed || 0) + 1;

  // 🔥 ATUALIZAR STREAK DIÁRIO
  const today = new Date().toDateString();
  if (this.lastLogin) {
    const lastLoginDate = new Date(this.lastLogin).toDateString();
    if (lastLoginDate === today) {
      // Já logou hoje, não incrementa
    } else if (new Date(this.lastLogin).getTime() > Date.now() - 86400000 * 2) {
      this.loginStreak = (this.loginStreak || 0) + 1;
    } else {
      this.loginStreak = 1;
    }
  } else {
    this.loginStreak = 1;
  }
  this.lastLogin = new Date();

  if (result === "win") {
    this.stats.handsWon = (this.stats.handsWon || 0) + 1;
    this.stats.totalChipsWon = (this.stats.totalChipsWon || 0) + (chips || 0);

    if (chips > (this.stats.biggestWin || 0)) {
      this.stats.biggestWin = chips;
    }

    if (handName) {
      const handOrder = [
        "Carta Alta",
        "Um Par",
        "Dois Pares",
        "Trinca",
        "Sequencia",
        "Flush",
        "Full House",
        "Quadra",
        "Straight Flush",
        "Royal Flush",
      ];
      const currentIndex = handOrder.indexOf(this.stats.bestHand || "");
      const newIndex = handOrder.indexOf(handName);
      if (newIndex > currentIndex) {
        this.stats.bestHand = handName;
      }
    }

    this.stats.currentStreak = (this.stats.currentStreak || 0) + 1;
    if ((this.stats.currentStreak || 0) > (this.stats.bestStreak || 0)) {
      this.stats.bestStreak = this.stats.currentStreak;
    }

    if (wasAllIn) {
      this.stats.allInWins = (this.stats.allInWins || 0) + 1;
    }
  } else if (result === "loss") {
    this.stats.handsLost = (this.stats.handsLost || 0) + 1;
    this.stats.currentStreak = 0;
  } else if (result === "tie") {
    this.stats.handsTied = (this.stats.handsTied || 0) + 1;
  }

  return this.save();
};

// 🔥 MÉTODO PARA ATUALIZAR FICHAS
UserSchema.methods.updateChips = async function (amount) {
  this.chips = (this.chips || 0) + amount;
  if (this.chips < 0) this.chips = 0;
  return this.save();
};

// 🔥 MÉTODO PARA ADICIONAR XP
UserSchema.methods.addXp = async function (amount) {
  const xpGain = amount || 0;
  this.xp = (this.xp || 0) + xpGain;
  this.totalXpEarned = (this.totalXpEarned || 0) + xpGain;

  const xpPerLevel = 100;
  const newLevel = Math.floor(this.xp / xpPerLevel) + 1;
  let leveledUp = false;

  if (newLevel > (this.level || 1)) {
    this.level = newLevel;
    leveledUp = true;
  }

  await this.save();
  return { leveledUp, newLevel: this.level, xpGain };
};

// 🔥 MÉTODO PARA RESETAR MISSÕES DIÁRIAS
UserSchema.methods.resetDailyMissions = async function () {
  this.dailyMissions = [];
  this.lastMissionReset = new Date();
  return this.save();
};

// 🔥 MÉTODO PARA VERIFICAR SE DEVE RESETAR MISSÕES
UserSchema.methods.shouldResetMissions = function () {
  if (!this.lastMissionReset) return true;
  const now = new Date();
  const lastReset = new Date(this.lastMissionReset);
  return (
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  );
};

// 🔥 MÉTODO PARA ATUALIZAR PREFERÊNCIAS
UserSchema.methods.updatePreferences = async function (preferences) {
  if (!this.preferences) {
    this.preferences = {
      soundEnabled: true,
      volume: 0.8,
      theme: "dark",
      turboMode: false,
      notificationsEnabled: true,
    };
  }

  Object.assign(this.preferences, preferences);
  return this.save();
};

// 🔥 EVITAR RECOMPILAÇÃO DO MODELO
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;

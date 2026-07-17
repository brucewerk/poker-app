// lib/models/User.js
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
    stats: {
      handsPlayed: { type: Number, default: 0 },
      handsWon: { type: Number, default: 0 },
      totalChipsWon: { type: Number, default: 0 },
      biggestWin: { type: Number, default: 0 },
      bestStreak: { type: Number, default: 0 },
      bestHand: { type: String, default: "" },
      allInWins: { type: Number, default: 0 },
    },
    achievements: {
      type: Array,
      default: [],
    },
    findings: {
      type: Array,
      default: [],
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
    };
  }

  this.stats.handsPlayed = (this.stats.handsPlayed || 0) + 1;

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
      ];
      const currentIndex = handOrder.indexOf(this.stats.bestHand || "");
      const newIndex = handOrder.indexOf(handName);
      if (newIndex > currentIndex) {
        this.stats.bestHand = handName;
      }
    }

    if (wasAllIn) {
      this.stats.allInWins = (this.stats.allInWins || 0) + 1;
    }
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
  this.xp = (this.xp || 0) + amount;

  const xpPerLevel = 100;
  const newLevel = Math.floor(this.xp / xpPerLevel) + 1;
  if (newLevel > (this.level || 1)) {
    this.level = newLevel;
    return { leveledUp: true, newLevel: this.level };
  }

  await this.save();
  return { leveledUp: false, newLevel: this.level };
};

// 🔥 EVITAR RECOMPILAÇÃO DO MODELO
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;

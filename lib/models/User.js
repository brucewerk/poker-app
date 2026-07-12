// lib/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
  },
  password: {
    type: String,
    required: true,
  },
  chips: {
    type: Number,
    default: 1000,
  },
  // Estado do jogo (persistência)
  gameState: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Estatísticas do jogador
  stats: {
    handsPlayed: { type: Number, default: 0 },
    handsWon: { type: Number, default: 0 },
    handsLost: { type: Number, default: 0 },
    totalChipsWon: { type: Number, default: 0 },
    bestHand: { type: String, default: "" },
    biggestWin: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    allInWins: { type: Number, default: 0 },
    totalHands: { type: Number, default: 0 },
  },
  // ✅ SISTEMA DE NÍVEIS
  level: {
    type: Number,
    default: 1,
  },
  xp: {
    type: Number,
    default: 0,
  },
  xpToNextLevel: {
    type: Number,
    default: 100,
  },
  // ✅ ACHADOS (FINDINGS) DESBLOQUEADOS
  findings: {
    type: [String],
    default: [],
  },
  // ✅ LISTA DE AMIGOS
  friends: {
    type: [String],
    default: [],
  },
  // Conquistas desbloqueadas
  achievements: {
    type: [String],
    default: [],
  },
  // Histórico de mãos
  handHistory: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  // Campos para NextAuth
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  emailVerified: {
    type: Date,
  },
  image: {
    type: String,
  },
  accounts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
  ],
});

export default mongoose.models.User || mongoose.model("User", UserSchema);

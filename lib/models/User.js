// lib/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    default: null,
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
  // 🔥 NOVOS CAMPOS para amigos, missões e histórico
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Evitar recompilação do modelo
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;

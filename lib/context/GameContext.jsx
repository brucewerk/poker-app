// lib/context/GameContext.jsx - Gerenciamento de Estado Centralizado
"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from "react";

// ====================== ESTADO INICIAL ======================
const INITIAL_STATE = {
  // Estado do jogo
  game: null,
  isLoading: false,
  isGameActive: false,
  error: null,

  // Estado do usuário
  user: null,
  chips: 0,
  level: 0,
  stats: null,

  // Estado do multiplayer
  multiplayer: {
    isActive: false,
    roomId: null,
    players: [],
    currentPlayerIndex: 0,
  },

  // Estado do online
  online: {
    isActive: false,
    game: null,
    roomId: null,
  },

  // UI State
  ui: {
    showAchievements: false,
    showFindings: false,
    showTournament: false,
    showMultiplayer: false,
    showOnline: false,
    isTurbo: false,
    isResultModalOpen: false,
  },

  // Notificações
  notifications: {
    toast: null,
    badge: 0,
    lastMessage: null,
  },
};

// ====================== REDUCER ======================
function gameReducer(state, action) {
  switch (action.type) {
    // ===== GAME STATE =====
    case "SET_GAME":
      return {
        ...state,
        game: action.payload,
        isGameActive: !!action.payload?.handActive,
        isLoading: false,
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "RESET_GAME":
      return {
        ...state,
        game: null,
        isGameActive: false,
        isLoading: false,
        error: null,
      };

    // ===== USER STATE =====
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        chips: action.payload?.chips || 0,
        level: action.payload?.level || 0,
      };

    case "UPDATE_CHIPS":
      return {
        ...state,
        chips: action.payload,
        user: state.user ? { ...state.user, chips: action.payload } : null,
      };

    case "UPDATE_STATS":
      return {
        ...state,
        stats: action.payload,
      };

    // ===== MULTIPLAYER =====
    case "SET_MULTIPLAYER":
      return {
        ...state,
        multiplayer: {
          ...state.multiplayer,
          ...action.payload,
        },
      };

    case "RESET_MULTIPLAYER":
      return {
        ...state,
        multiplayer: {
          isActive: false,
          roomId: null,
          players: [],
          currentPlayerIndex: 0,
        },
      };

    // ===== ONLINE =====
    case "SET_ONLINE":
      return {
        ...state,
        online: {
          ...state.online,
          ...action.payload,
        },
      };

    case "RESET_ONLINE":
      return {
        ...state,
        online: {
          isActive: false,
          game: null,
          roomId: null,
        },
      };

    // ===== UI =====
    case "TOGGLE_UI":
      return {
        ...state,
        ui: {
          ...state.ui,
          [action.payload.key]: action.payload.value,
        },
      };

    case "SET_TURBO":
      return {
        ...state,
        ui: { ...state.ui, isTurbo: action.payload },
      };

    // ===== NOTIFICATIONS =====
    case "SHOW_TOAST":
      return {
        ...state,
        notifications: {
          ...state.notifications,
          toast: action.payload,
        },
      };

    case "HIDE_TOAST":
      return {
        ...state,
        notifications: { ...state.notifications, toast: null },
      };

    case "UPDATE_BADGE":
      return {
        ...state,
        notifications: {
          ...state.notifications,
          badge: action.payload,
        },
      };

    case "SET_LAST_NOTIFICATION":
      return {
        ...state,
        notifications: {
          ...state.notifications,
          lastMessage: action.payload,
        },
      };

    default:
      return state;
  }
}

// ====================== CONTEXT ======================
const GameContext = createContext();

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  // ===== GAME ACTIONS =====
  const setGame = useCallback((game) => {
    dispatch({ type: "SET_GAME", payload: game });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: "RESET_GAME" });
  }, []);

  // ===== USER ACTIONS =====
  const setUser = useCallback((user) => {
    dispatch({ type: "SET_USER", payload: user });
  }, []);

  const updateChips = useCallback((chips) => {
    dispatch({ type: "UPDATE_CHIPS", payload: chips });
  }, []);

  const updateStats = useCallback((stats) => {
    dispatch({ type: "UPDATE_STATS", payload: stats });
  }, []);

  // ===== MULTIPLAYER ACTIONS =====
  const setMultiplayer = useCallback((data) => {
    dispatch({ type: "SET_MULTIPLAYER", payload: data });
  }, []);

  const resetMultiplayer = useCallback(() => {
    dispatch({ type: "RESET_MULTIPLAYER" });
  }, []);

  // ===== ONLINE ACTIONS =====
  const setOnline = useCallback((data) => {
    dispatch({ type: "SET_ONLINE", payload: data });
  }, []);

  const resetOnline = useCallback(() => {
    dispatch({ type: "RESET_ONLINE" });
  }, []);

  // ===== UI ACTIONS =====
  const toggleUI = useCallback((key, value) => {
    dispatch({ type: "TOGGLE_UI", payload: { key, value } });
  }, []);

  const setTurbo = useCallback((value) => {
    dispatch({ type: "SET_TURBO", payload: value });
  }, []);

  // ===== NOTIFICATION ACTIONS =====
  const showToast = useCallback((toast) => {
    dispatch({ type: "SHOW_TOAST", payload: toast });
    // Auto-hide após 5 segundos
    setTimeout(() => {
      dispatch({ type: "HIDE_TOAST" });
    }, 5000);
  }, []);

  const hideToast = useCallback(() => {
    dispatch({ type: "HIDE_TOAST" });
  }, []);

  const updateBadge = useCallback((count) => {
    dispatch({ type: "UPDATE_BADGE", payload: count });
  }, []);

  const setLastNotification = useCallback((message) => {
    dispatch({ type: "SET_LAST_NOTIFICATION", payload: message });
  }, []);

  // ===== VALORES MEMOIZADOS =====
  const value = useMemo(
    () => ({
      // Estado
      state,

      // Game
      setGame,
      setLoading,
      setError,
      clearError,
      resetGame,

      // User
      setUser,
      updateChips,
      updateStats,

      // Multiplayer
      setMultiplayer,
      resetMultiplayer,

      // Online
      setOnline,
      resetOnline,

      // UI
      toggleUI,
      setTurbo,

      // Notificações
      showToast,
      hideToast,
      updateBadge,
      setLastNotification,
    }),
    [
      state,
      setGame,
      setLoading,
      setError,
      clearError,
      resetGame,
      setUser,
      updateChips,
      updateStats,
      setMultiplayer,
      resetMultiplayer,
      setOnline,
      resetOnline,
      toggleUI,
      setTurbo,
      showToast,
      hideToast,
      updateBadge,
      setLastNotification,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ====================== HOOK PERSONALIZADO ======================
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

// ====================== HOOKS DE CONVENIÊNCIA ======================
export function useGameState() {
  const { state } = useGame();
  return state;
}

export function useGameActions() {
  const {
    setGame,
    setLoading,
    setError,
    clearError,
    resetGame,
    setUser,
    updateChips,
    updateStats,
    setMultiplayer,
    resetMultiplayer,
    setOnline,
    resetOnline,
    toggleUI,
    setTurbo,
    showToast,
    hideToast,
    updateBadge,
    setLastNotification,
  } = useGame();

  return {
    setGame,
    setLoading,
    setError,
    clearError,
    resetGame,
    setUser,
    updateChips,
    updateStats,
    setMultiplayer,
    resetMultiplayer,
    setOnline,
    resetOnline,
    toggleUI,
    setTurbo,
    showToast,
    hideToast,
    updateBadge,
    setLastNotification,
  };
}

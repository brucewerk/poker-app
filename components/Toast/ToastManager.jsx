// components/Toast/ToastManager.jsx - SISTEMA PREMIUM DE NOTIFICAÇÕES
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

export const TOAST_TYPES = {
  LEVEL_UP: "level-up",
  ACHIEVEMENT: "achievement",
  FINDING: "finding",
  CHAT: "chat",
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WIN: "win",
  LOSS: "loss",
  TIE: "tie",
};

export const TOAST_CONFIGS = {
  [TOAST_TYPES.LEVEL_UP]: {
    icon: "🎊",
    bgGradient: "linear-gradient(145deg, #1a3a2a, #2d5a3a)",
    borderColor: "#ffd700",
    glowColor: "rgba(255, 215, 0, 0.2)",
    textColor: "#ffd700",
    duration: 6000,
  },
  [TOAST_TYPES.ACHIEVEMENT]: {
    icon: "🎉",
    bgGradient: "linear-gradient(145deg, #2a1a4a, #4a2a6a)",
    borderColor: "#9c27b0",
    glowColor: "rgba(156, 39, 176, 0.2)",
    textColor: "#ce93d8",
    duration: 5000,
  },
  [TOAST_TYPES.FINDING]: {
    icon: "🏅",
    bgGradient: "linear-gradient(145deg, #2a3a1a, #4a5a2a)",
    borderColor: "#ff9800",
    glowColor: "rgba(255, 152, 0, 0.2)",
    textColor: "#ffa726",
    duration: 5000,
  },
  [TOAST_TYPES.CHAT]: {
    icon: "💬",
    bgGradient: "linear-gradient(145deg, #1a2a4a, #2a4a6a)",
    borderColor: "#2196f3",
    glowColor: "rgba(33, 150, 243, 0.2)",
    textColor: "#64b5f6",
    duration: 5000,
  },
  [TOAST_TYPES.SUCCESS]: {
    icon: "✅",
    bgGradient: "linear-gradient(145deg, #1a3a2a, #2a5a3a)",
    borderColor: "#4caf50",
    glowColor: "rgba(76, 175, 80, 0.2)",
    textColor: "#81c784",
    duration: 3500,
  },
  [TOAST_TYPES.ERROR]: {
    icon: "❌",
    bgGradient: "linear-gradient(145deg, #3a1a1a, #5a2a2a)",
    borderColor: "#f44336",
    glowColor: "rgba(244, 67, 54, 0.2)",
    textColor: "#ef9a9a",
    duration: 4000,
  },
  [TOAST_TYPES.INFO]: {
    icon: "ℹ️",
    bgGradient: "linear-gradient(145deg, #2a2a3a, #4a4a5a)",
    borderColor: "#607d8b",
    glowColor: "rgba(96, 125, 139, 0.2)",
    textColor: "#90a4ae",
    duration: 3500,
  },
  [TOAST_TYPES.WIN]: {
    icon: "🏆",
    bgGradient: "linear-gradient(145deg, #1a3a2a, #2d6a3a)",
    borderColor: "#4caf50",
    glowColor: "rgba(76, 175, 80, 0.25)",
    textColor: "#81c784",
    duration: 4500,
  },
  [TOAST_TYPES.LOSS]: {
    icon: "💔",
    bgGradient: "linear-gradient(145deg, #3a1a1a, #5a2a2a)",
    borderColor: "#f44336",
    glowColor: "rgba(244, 67, 54, 0.25)",
    textColor: "#ef9a9a",
    duration: 4000,
  },
  [TOAST_TYPES.TIE]: {
    icon: "🤝",
    bgGradient: "linear-gradient(145deg, #3a3a1a, #5a5a2a)",
    borderColor: "#ffc107",
    glowColor: "rgba(255, 193, 7, 0.25)",
    textColor: "#ffd54f",
    duration: 4000,
  },
};

// ====================== TOAST CONTEXT ======================
const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    (message, type = TOAST_TYPES.INFO, duration = null) => {
      const config = TOAST_CONFIGS[type] || TOAST_CONFIGS[TOAST_TYPES.INFO];
      const id = Date.now() + Math.random() * 1000;
      const toastDuration = duration || config.duration || 4000;

      setToasts((prev) => {
        const next = [
          ...prev,
          {
            id,
            message,
            type,
            config,
            duration: toastDuration,
            timestamp: Date.now(),
          },
        ];
        // 🔥 NOVO: limita a no máximo 4 toasts visíveis ao mesmo tempo.
        // Em telas de celular, mais que isso ocupa a tela toda e o
        // conteúdo mais antigo geralmente já perdeu relevância.
        return next.length > 4 ? next.slice(next.length - 4) : next;
      });

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toastDuration + 500);

      return id;
    },
    [],
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // 🔥 CORRIGIDO: useCallback espera uma FUNÇÃO como primeiro argumento, não
  // um objeto simples como estava aqui. Isso "funcionava" por acaso (o
  // React não valida o tipo do argumento, só memoiza o que foi passado),
  // mas é o hook errado para este caso - useMemo é o correto para
  // memoizar um valor/objeto.
  const toast = useMemo(
    () => ({
      levelUp: (msg) => showToast(msg, TOAST_TYPES.LEVEL_UP),
      achievement: (msg) => showToast(msg, TOAST_TYPES.ACHIEVEMENT),
      finding: (msg) => showToast(msg, TOAST_TYPES.FINDING),
      chat: (msg) => showToast(msg, TOAST_TYPES.CHAT),
      success: (msg) => showToast(msg, TOAST_TYPES.SUCCESS),
      error: (msg) => showToast(msg, TOAST_TYPES.ERROR),
      info: (msg) => showToast(msg, TOAST_TYPES.INFO),
      win: (msg) => showToast(msg, TOAST_TYPES.WIN),
      loss: (msg) => showToast(msg, TOAST_TYPES.LOSS),
      tie: (msg) => showToast(msg, TOAST_TYPES.TIE),
      show: showToast,
      remove: removeToast,
      clear: clearAllToasts,
    }),
    [showToast, removeToast, clearAllToasts],
  );

  // 🔥 EXPOR GLOBALMENTE
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__toast = toast;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.__toast;
      }
    };
  }, [toast]);

  const value = { toasts, showToast, removeToast, clearAllToasts, toast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRenderer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ====================== TOAST RENDERER ======================
function ToastRenderer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      style={{
        position: "fixed",
        top: 80,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "400px",
        width: "100%",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className="toast-card"
            style={{
              pointerEvents: "auto",
              background: toast.config.bgGradient,
              border: `1px solid ${toast.config.borderColor}`,
              borderRadius: 16,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 40px ${toast.config.glowColor}`,
              backdropFilter: "blur(12px)",
              position: "relative",
              overflow: "hidden",
              minWidth: "280px",
              maxWidth: "400px",
            }}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              duration: 0.4,
            }}
            layout
          >
            <div
              className="toast-icon"
              style={{
                fontSize: "2rem",
                flexShrink: 0,
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "50%",
                border: `1px solid ${toast.config.borderColor}44`,
              }}
            >
              {toast.config.icon}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                className="toast-message"
                style={{
                  color: toast.config.textColor,
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  lineHeight: "1.4",
                  display: "block",
                  textShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              >
                {toast.message}
              </span>
              <div
                style={{
                  width: "100%",
                  height: "3px",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 2,
                  marginTop: "6px",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  style={{
                    height: "100%",
                    background: `linear-gradient(90deg, ${toast.config.borderColor}, ${toast.config.textColor})`,
                    borderRadius: 2,
                  }}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{
                    duration: toast.duration / 1000,
                    ease: "linear",
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: "0.8rem",
                padding: "4px 8px",
                borderRadius: "50%",
                transition: "all 0.3s ease",
                flexShrink: 0,
                lineHeight: 1,
                marginLeft: "4px",
              }}
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ====================== TOAST HOOK ======================
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
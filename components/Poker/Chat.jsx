// components/Poker/Chat.jsx - VERSÃO PREMIUM COM EMOJIS E CORRIGIDA
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 🔥 EMOJIS PARA O CHAT
const EMOJIS = [
  { emoji: "😊", label: "Sorriso" },
  { emoji: "😂", label: "Riso" },
  { emoji: "🤣", label: "Gargalhada" },
  { emoji: "😍", label: "Apaixonado" },
  { emoji: "🥰", label: "Carinho" },
  { emoji: "😘", label: "Beijo" },
  { emoji: "😎", label: "Legal" },
  { emoji: "🤔", label: "Pensativo" },
  { emoji: "🤯", label: "Explosão" },
  { emoji: "🥳", label: "Festa" },
  { emoji: "🎉", label: "Celebração" },
  { emoji: "🃏", label: "Carta" },
  { emoji: "♠️", label: "Espadas" },
  { emoji: "♥️", label: "Copas" },
  { emoji: "♦️", label: "Ouros" },
  { emoji: "♣️", label: "Paus" },
  { emoji: "💰", label: "Dinheiro" },
  { emoji: "💎", label: "Diamante" },
  { emoji: "🔥", label: "Fogo" },
  { emoji: "⭐", label: "Estrela" },
  { emoji: "👑", label: "Coroa" },
];

export default function Chat({ socket, roomId, playerName }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // 🔥 ADICIONAR ESTILOS GLOBAIS NO CLIENTE APENAS
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !document.getElementById("chat-styles")
    ) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "chat-styles";
      styleSheet.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data) => {
      setMessages((prev) => {
        const newMessages = [...prev, data];
        if (newMessages.length > 100) {
          return newMessages.slice(-100);
        }
        return newMessages;
      });

      // Incrementar contador de não lidas se o chat estiver minimizado
      if (isMinimized && data.player !== playerName) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("chat-message", handleChatMessage);
    };
  }, [socket, isMinimized, playerName]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit("send-chat-message", {
      roomId: roomId,
      message: inputMessage.trim(),
    });

    setInputMessage("");
    setShowEmojis(false);
  };

  const insertEmoji = (emoji) => {
    setInputMessage((prev) => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isMinimized) {
    return (
      <motion.button
        onClick={toggleMinimize}
        style={minimizedButtonStyle()}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        💬 Chat
        {unreadCount > 0 && (
          <span style={unreadBadgeStyle()}>{unreadCount}</span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      style={containerStyle()}
      ref={chatContainerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div style={headerStyle()}>
        <span>💬 Chat da Sala</span>
        <div style={headerButtonsStyle()}>
          <span style={messageCountStyle()}>{messages.length} msgs</span>
          <button onClick={toggleMinimize} style={minimizeButtonStyle()}>
            ➖
          </button>
        </div>
      </div>

      <div style={messagesStyle()}>
        {messages.length === 0 && (
          <div style={emptyMessagesStyle()}>
            <span style={{ fontSize: "2rem" }}>💬</span>
            <p>Nenhuma mensagem ainda</p>
            <span style={{ fontSize: "0.7rem", color: "#666" }}>
              Seja o primeiro a falar!
            </span>
          </div>
        )}
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            style={{
              ...messageStyle(msg.isSystem),
              ...(msg.player === playerName ? ownMessageStyle() : {}),
            }}
            initial={{ opacity: 0, x: msg.player === playerName ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={messageHeaderStyle()}>
              <span style={playerNameStyle(msg.isSystem)}>
                {msg.isSystem ? "📢" : msg.player}
              </span>
              <span style={timestampStyle()}>{formatTime(msg.timestamp)}</span>
            </div>
            <div style={messageTextStyle(msg.isSystem)}>{msg.message}</div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={inputContainerStyle()}>
        <AnimatePresence>
          {showEmojis && (
            <motion.div
              style={emojisContainerStyle()}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
            >
              <div style={emojisGridStyle()}>
                {EMOJIS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    style={emojiButtonStyle()}
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={sendMessage} style={inputFormStyle()}>
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            style={emojiToggleStyle()}
          >
            😊
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            style={inputStyle()}
            maxLength={500}
          />
          <motion.button
            type="submit"
            style={sendButtonStyle()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Enviar
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

// ====================== ESTILOS ======================
function containerStyle() {
  return {
    background: "rgba(0,0,0,0.85)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    height: "350px",
    width: "100%",
    maxWidth: "400px",
    border: "1px solid rgba(255,215,0,0.15)",
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 100,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
  };
}

function headerStyle() {
  return {
    padding: "10px 15px",
    background: "rgba(255,215,0,0.08)",
    borderBottom: "1px solid rgba(255,215,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "gold",
    fontWeight: "bold",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px",
  };
}

function headerButtonsStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
}

function messageCountStyle() {
  return {
    fontSize: "0.65rem",
    color: "#888",
    fontWeight: "normal",
  };
}

function minimizeButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0 5px",
    transition: "color 0.3s ease",
  };
}

function minimizedButtonStyle() {
  return {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    border: "1px solid gold",
    borderRadius: "50px",
    padding: "10px 20px",
    color: "gold",
    cursor: "pointer",
    zIndex: 100,
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
}

function unreadBadgeStyle() {
  return {
    background: "#f44336",
    color: "white",
    borderRadius: "50%",
    padding: "1px 6px",
    fontSize: "0.7rem",
    fontWeight: "bold",
    minWidth: "18px",
    textAlign: "center",
  };
}

function messagesStyle() {
  return {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };
}

function emptyMessagesStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#555",
    gap: "4px",
  };
}

function messageStyle(isSystem) {
  return {
    padding: "6px 10px",
    borderRadius: "8px",
    background: isSystem ? "rgba(255,215,0,0.05)" : "rgba(255,255,255,0.03)",
    borderLeft: isSystem ? "3px solid gold" : "3px solid transparent",
    maxWidth: "100%",
  };
}

function ownMessageStyle() {
  return {
    background: "rgba(255,215,0,0.08)",
    borderLeft: "3px solid #ffd700",
  };
}

function messageHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2px",
  };
}

function playerNameStyle(isSystem) {
  return {
    color: isSystem ? "gold" : "#4caf50",
    fontWeight: "bold",
    fontSize: "0.75rem",
  };
}

function timestampStyle() {
  return {
    color: "#666",
    fontSize: "0.55rem",
  };
}

function messageTextStyle(isSystem) {
  return {
    color: isSystem ? "#aaa" : "#eee",
    fontSize: "0.85rem",
    wordBreak: "break-word",
  };
}

function inputContainerStyle() {
  return {
    borderTop: "1px solid rgba(255,255,255,0.05)",
    position: "relative",
  };
}

function emojisContainerStyle() {
  return {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    background: "rgba(0,0,0,0.95)",
    border: "1px solid rgba(255,215,0,0.15)",
    borderRadius: "8px 8px 0 0",
    padding: "8px",
    maxHeight: "150px",
    overflowY: "auto",
  };
}

function emojisGridStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: "4px",
  };
}

function emojiButtonStyle() {
  return {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    transition: "background 0.2s ease",
    textAlign: "center",
  };
}

function emojiToggleStyle() {
  return {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    color: "#888",
    transition: "color 0.3s ease",
  };
}

function inputFormStyle() {
  return {
    display: "flex",
    gap: "6px",
    padding: "8px 10px",
    alignItems: "center",
  };
}

function inputStyle() {
  return {
    flex: 1,
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: "0.85rem",
    outline: "none",
    transition: "border-color 0.3s ease",
  };
}

function sendButtonStyle() {
  return {
    padding: "6px 16px",
    borderRadius: "20px",
    border: "none",
    background: "radial-gradient(#f7d97c,#d6a12e)",
    color: "#2e241f",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.75rem",
    transition: "all 0.3s ease",
  };
}

// components/Poker/Chat.jsx - CORREÇÃO DO SCROLL AO MAXIMIZAR
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { soundManager } from "@/lib/sound";

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

export default function Chat({ 
  socket, 
  roomId, 
  playerName,
  onNewMessage,
  onUnreadChange
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const unreadTimeoutRef = useRef(null);
  const hasScrolledRef = useRef(false);
  const isMinimizedRef = useRef(false);
  const isFocusedRef = useRef(true);

  // 🔥 LOG AO MONTAR PARA DEBUG
  useEffect(() => {
    console.log("🔌 Chat: Componente montado");
    console.log(`📋 Chat: RoomId: ${roomId}, PlayerName: ${playerName}`);
    console.log(`📡 Chat: Socket disponível:`, !!socket);
    if (socket) {
      console.log(`📡 Chat: Socket ID: ${socket.id}`);
      console.log(`📡 Chat: Socket type:`, typeof socket);
      console.log(`📡 Chat: Socket rooms:`, socket.rooms ? Array.from(socket.rooms || []) : "N/A");
      
      // 🔥 VERIFICAR SE ESTÁ NA SALA CORRETA
      const inRoom = socket.rooms && socket.rooms.has(roomId);
      console.log(`📡 Chat: Socket está na sala ${roomId}:`, inRoom);
      
      if (!inRoom) {
        console.warn(`⚠️ Chat: Socket NÃO está na sala ${roomId}`);
        console.warn(`⚠️ Chat: O chat pode não funcionar. Verifique se o socket entrou na sala corretamente.`);
      }
    }
  }, [socket, roomId, playerName]);

  // 🔥 DETECTAR FOCO DA JANELA
  useEffect(() => {
    const handleFocus = () => {
      setIsFocused(true);
      isFocusedRef.current = true;
    };
    const handleBlur = () => {
      setIsFocused(false);
      isFocusedRef.current = false;
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // 🔥 ATUALIZAR REFS QUANDO ESTADOS MUDAM
  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  // 🔥 SCROLL PARA O FINAL (FORÇADO)
  const scrollChatToBottom = useCallback((force = false) => {
    if (force) {
      hasScrolledRef.current = true;
    }
    
    // 🔥 TENTAR VÁRIAS FORMAS DE ROLAR
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      return;
    }

    if (chatContainerRef.current) {
      const container = chatContainerRef.current.querySelector('.chat-messages-scroll');
      if (container) {
        container.scrollTop = container.scrollHeight;
        return;
      }
    }

    // 🔥 FALLBACK: SCROLL DO CONTAINER PAI
    const container = document.querySelector(".chat-messages-scroll");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // 🔥 ATUALIZAR CONTAGEM DE NÃO LIDAS
  useEffect(() => {
    if (onUnreadChange) {
      onUnreadChange(unreadCount);
    }
  }, [unreadCount, onUnreadChange]);

  // 🔥 RECEBER MENSAGENS
  useEffect(() => {
    if (!socket) {
      console.log("⚠️ Chat: Socket não disponível");
      return;
    }

    const handleChatMessage = (data) => {
      console.log("📡 Chat: Mensagem recebida:", data);
      const isOwnMessage = data.player === playerName;
      
      setMessages((prev) => {
        const newMessages = [...prev, data];
        if (newMessages.length > 100) {
          return newMessages.slice(-100);
        }
        return newMessages;
      });

      if (!isOwnMessage) {
        if (notificationSound) {
          try {
            soundManager.playSound("deal", { volume: 0.15 });
          } catch (e) {}
        }

        if (onNewMessage) {
          onNewMessage({
            from: data.player,
            message: data.message,
            timestamp: data.timestamp,
          });
        }

        const shouldCountUnread = isMinimizedRef.current || !isFocusedRef.current;
        
        if (shouldCountUnread) {
          setUnreadCount((prev) => {
            const newCount = prev + 1;
            if (newCount > 0) {
              document.title = `💬 (${newCount}) Poker by BruCe`;
            }
            return newCount;
          });

          if (unreadTimeoutRef.current) {
            clearTimeout(unreadTimeoutRef.current);
          }

          unreadTimeoutRef.current = setTimeout(() => {
            setUnreadCount(0);
            document.title = "Poker by BruCe";
          }, 30000);
        }
      }

      // 🔥 ROLAR PARA O FINAL SEMPRE QUE RECEBE MENSAGEM
      scrollChatToBottom(true);
    };

    socket.on("chat-message", handleChatMessage);
    console.log("✅ Chat: Listener chat-message registrado");

    return () => {
      socket.off("chat-message", handleChatMessage);
      console.log("🔌 Chat: Listener chat-message removido");
      if (unreadTimeoutRef.current) {
        clearTimeout(unreadTimeoutRef.current);
      }
    };
  }, [socket, playerName, notificationSound, onNewMessage, scrollChatToBottom]);

  // 🔥 ENVIAR MENSAGEM
  const sendMessage = useCallback((e) => {
    e.preventDefault();
    const message = inputMessage.trim();
    if (!message || !socket) {
      console.log("⚠️ Chat: Não é possível enviar - socket:", !!socket, "message:", message);
      return;
    }

    setInputMessage("");

    console.log("📤 Chat: Enviando mensagem para sala", roomId, ":", message);
    socket.emit("send-chat-message", {
      roomId: roomId,
      message: message,
    });

    // 🔥 NÃO ADICIONAR LOCALMENTE - O SERVIDOR ENVIA PARA TODOS
    // Isso evita duplicação de mensagens
    
    setShowEmojis(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputMessage, socket, roomId]);

  // 🔥 INSERIR EMOJI
  const insertEmoji = useCallback((emoji) => {
    setInputMessage((prev) => prev + emoji);
    setShowEmojis(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 🔥 ALTERNAR MINIMIZAR - COM AUTO-ROLAGEM AO MAXIMIZAR
  const toggleMinimize = useCallback(() => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    
    // 🔥 SE ESTIVER MAXIMIZANDO, ROLAR PARA O FINAL
    if (newMinimized === false) {
      setUnreadCount(0);
      document.title = "Poker by BruCe";
      if (unreadTimeoutRef.current) {
        clearTimeout(unreadTimeoutRef.current);
      }
      // 🔥 FORÇAR SCROLL PARA O FINAL
      setTimeout(() => scrollChatToBottom(true), 300);
      setTimeout(() => scrollChatToBottom(true), 600);
    }
  }, [isMinimized, scrollChatToBottom]);

  // 🔥 FORMATAR HORA
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // 🔥 SOM DE NOTIFICAÇÃO
  const toggleNotificationSound = useCallback(() => {
    setNotificationSound((prev) => !prev);
  }, []);

  // ============================================================
  // 🔥 RENDER: CHAT MINIMIZADO
  // ============================================================
  if (isMinimized) {
    return (
      <motion.button
        onClick={toggleMinimize}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "var(--bg-modal)",
          border: `2px solid ${unreadCount > 0 ? "#4caf50" : "var(--border-gold)"}`,
          borderRadius: "50px",
          padding: "10px 20px",
          color: "var(--text-primary)",
          cursor: "pointer",
          zIndex: 100,
          boxShadow: "0 4px 16px var(--shadow-dark)",
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "var(--transition-theme)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        💬 Chat
        {unreadCount > 0 && (
          <motion.span
            style={{
              background: "#f44336",
              color: "white",
              borderRadius: "50%",
              padding: "1px 8px",
              fontSize: "0.7rem",
              fontWeight: "bold",
              minWidth: "20px",
              textAlign: "center",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {unreadCount}
          </motion.span>
        )}
        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
          {unreadCount > 0 ? "🔔" : "💤"}
        </span>
      </motion.button>
    );
  }

  // ============================================================
  // 🔥 RENDER: CHAT EXPANDIDO
  // ============================================================
  return (
    <motion.div
      style={{
        background: "var(--bg-modal)",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        height: "400px",
        width: "100%",
        maxWidth: "400px",
        border: "2px solid var(--border-gold)",
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 100,
        boxShadow: "0 8px 32px var(--shadow-dark)",
        backdropFilter: "blur(8px)",
        transition: "var(--transition-theme)",
        overflow: "hidden",
      }}
      ref={chatContainerRef}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "10px 15px",
          background: "rgba(255,215,0,0.08)",
          borderBottom: "1px solid var(--border-gold)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "var(--text-primary)",
          fontWeight: "bold",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          transition: "var(--transition-theme)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>💬 Chat</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: "#f44336",
                color: "white",
                borderRadius: "50%",
                padding: "1px 8px",
                fontSize: "0.6rem",
                fontWeight: "bold",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
            {messages.length} msgs
          </span>
          <button
            onClick={toggleNotificationSound}
            style={{
              background: "none",
              border: "none",
              color: notificationSound ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.8rem",
              padding: "2px 6px",
              borderRadius: "4px",
              opacity: notificationSound ? 1 : 0.5,
            }}
            title={notificationSound ? "Som ativado" : "Som desativado"}
          >
            {notificationSound ? "🔊" : "🔇"}
          </button>
          <button
            onClick={toggleMinimize}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1rem",
              padding: "0 5px",
              transition: "color 0.3s ease",
            }}
          >
            ➖
          </button>
        </div>
      </div>

      {/* MENSAGENS */}
      <div
        className="chat-messages-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          minHeight: "200px",
          maxHeight: "100%",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-muted)",
              gap: "4px",
              transition: "var(--transition-theme)",
            }}
          >
            <span style={{ fontSize: "2rem" }}>💬</span>
            <p>Nenhuma mensagem ainda</p>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Seja o primeiro a falar!
            </span>
          </div>
        )}
        {messages.map((msg, index) => {
          const isOwn = msg.player === playerName || msg.isOwn === true;
          const isSystem = msg.isSystem === true;
          
          return (
            <motion.div
              key={`msg_${index}_${msg.timestamp}`}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                background: isSystem
                  ? "rgba(255,215,0,0.05)"
                  : isOwn
                    ? "rgba(255,215,0,0.08)"
                    : "rgba(255,255,255,0.03)",
                borderLeft: isSystem
                  ? "3px solid gold"
                  : isOwn
                    ? "3px solid #ffd700"
                    : "3px solid transparent",
                maxWidth: "100%",
                alignSelf: isOwn ? "flex-end" : "flex-start",
              }}
              initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "2px",
                }}
              >
                <span
                  style={{
                    color: isSystem ? "gold" : isOwn ? "#ffd700" : "#4caf50",
                    fontWeight: "bold",
                    fontSize: "0.75rem",
                  }}
                >
                  {isSystem ? "📢" : isOwn ? "👤 Você" : msg.player}
                </span>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.55rem",
                    transition: "var(--transition-theme)",
                  }}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <div
                style={{
                  color: isSystem ? "var(--text-muted)" : "var(--text-primary)",
                  fontSize: "0.85rem",
                  wordBreak: "break-word",
                  transition: "var(--transition-theme)",
                }}
              >
                {msg.message}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          borderTop: "1px solid var(--border-light)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <AnimatePresence>
          {showEmojis && (
            <motion.div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                right: 0,
                background: "var(--bg-modal)",
                border: "1px solid var(--border-gold)",
                borderRadius: "8px 8px 0 0",
                padding: "8px",
                maxHeight: "150px",
                overflowY: "auto",
                transition: "var(--transition-theme)",
              }}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(8, 1fr)",
                  gap: "4px",
                }}
              >
                {EMOJIS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      transition: "background 0.2s ease",
                      textAlign: "center",
                    }}
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={sendMessage}
          style={{
            display: "flex",
            gap: "6px",
            padding: "8px 10px",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              color: "var(--text-muted)",
              transition: "color 0.3s ease",
            }}
          >
            😊
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            style={{
              flex: 1,
              padding: "6px 12px",
              borderRadius: "20px",
              border: "1px solid var(--border-input)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              outline: "none",
              transition: "border-color 0.3s ease",
            }}
            maxLength={500}
            onFocus={() => {
              setUnreadCount(0);
              document.title = "Poker by BruCe";
              if (unreadTimeoutRef.current) {
                clearTimeout(unreadTimeoutRef.current);
              }
              // 🔥 ROLAR PARA O FINAL AO FOCAR
              setTimeout(() => scrollChatToBottom(true), 200);
            }}
          />
          <motion.button
            type="submit"
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "none",
              background: "radial-gradient(#f7d97c,#d6a12e)",
              color: "#2e241f",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "0.75rem",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap",
            }}
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
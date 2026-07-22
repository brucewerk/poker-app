// components/Poker/OnlineLobby.jsx - CORRIGIDO (sem document no server)
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import Chat from "./Chat.jsx";

export default function OnlineLobby({ onJoinGame, onCancel, currentUser }) {
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const socketRef = useRef(null);
  const roomListInterval = useRef(null);

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

  // 🔥 ADICIONAR ESTILOS GLOBAIS NO CLIENTE APENAS
  useEffect(() => {
    // Verificar se está no navegador
    if (
      typeof window !== "undefined" &&
      !document.getElementById("online-lobby-styles")
    ) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "online-lobby-styles";
      styleSheet.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  // ====================== CONECTAR AO SOCKET ======================
  useEffect(() => {
    if (!currentUser) return;

    console.log(`🔵 OnlineLobby: Conectando ao Socket.IO para ${currentUser}`);

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: true,
        reconnection: true,
      });
    }

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log(`🟢 OnlineLobby: Socket conectado (${socket.id})`);
      setIsConnected(true);
      socket.emit("friend-online", { username: currentUser });
      fetchRooms();
    });

    socket.on("disconnect", () => {
      console.log(`🔴 OnlineLobby: Socket desconectado`);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error(`❌ OnlineLobby: Erro de conexão:`, err.message);
      setIsConnected(false);
      setError("❌ Erro de conexão com o servidor");
    });

    // 🔥 RECEBER LISTA DE SALAS
    socket.on("room-list", (roomList) => {
      console.log("📡 Lista de salas recebida:", roomList.length);
      setRooms(roomList || []);
      setLoading(false);
    });

    // 🔥 CONVITE EM GRUPO - REDIRECIONAR PARA A SALA
    socket.on("group-invite", (data) => {
      console.log("📡 Convite recebido no lobby:", data);

      if (data.players?.includes(currentUser)) {
        setPendingInvite(data);
        setSuccess(`🎯 ${data.from} te convidou para uma partida!`);

        setTimeout(() => {
          handleAcceptInvite(data);
        }, 1000);
      }
    });

    // 🔥 CONVITE ACEITO
    socket.on("invite-accepted", (data) => {
      console.log("📡 Convite aceito no lobby:", data);
      if (data.from === currentUser) {
        setSuccess(`✅ Convite aceito! Entrando na sala...`);

        const inviteData = pendingInvite;
        if (inviteData && onJoinGame) {
          const roomId = inviteData.roomId || `room_${inviteData.inviteId}`;
          socket.emit("join-room", {
            roomId: roomId,
            playerName: currentUser,
          });

          onJoinGame({
            roomId: roomId,
            playerName: currentUser,
            socket: socket,
            invitedPlayers: inviteData.players || [],
            isInviteAccepted: true,
          });
        }
      }
    });

    // 🔥 SALA CRIADA
    socket.on("room-created", (data) => {
      console.log("✅ Sala criada:", data);
      setCreating(false);
      setCurrentRoomId(data.roomId);
      setSuccess(`✅ Sala ${data.roomId} criada com sucesso!`);

      setTimeout(() => {
        if (onJoinGame) {
          onJoinGame({
            roomId: data.roomId,
            playerName: currentUser,
            socket: socket,
            isInviteCreator: true,
          });
        }
      }, 500);
    });

    // 🔥 ATUALIZAÇÃO DA SALA
    socket.on("room-update", (data) => {
      console.log("📡 Atualização da sala recebida");
      fetchRooms();
    });

    // 🔥 MENSAGEM DE ERRO
    socket.on("error", (data) => {
      console.error("❌ Erro do servidor:", data);
      setError(`❌ ${data.message || "Erro desconhecido"}`);
      setTimeout(() => setError(""), 5000);
    });

    // 🔥 Buscar salas periodicamente
    roomListInterval.current = setInterval(() => {
      if (isConnected) {
        fetchRooms();
      }
    }, 10000);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("room-list");
      socket.off("group-invite");
      socket.off("invite-accepted");
      socket.off("room-created");
      socket.off("room-update");
      socket.off("error");

      if (roomListInterval.current) {
        clearInterval(roomListInterval.current);
        roomListInterval.current = null;
      }
    };
  }, [currentUser, onJoinGame]);

  // ====================== BUSCAR SALAS ======================
  const fetchRooms = useCallback(() => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit("list-rooms");
  }, [isConnected]);

  // ====================== CRIAR SALA ======================
  const createRoom = useCallback(() => {
    if (!socketRef.current || !isConnected) {
      setError("❌ Não conectado ao servidor");
      return;
    }

    if (!currentUser) {
      setError("❌ Você precisa estar logado");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    socketRef.current.emit("create-room", {
      playerName: currentUser,
      maxPlayers: maxPlayers,
    });
  }, [currentUser, maxPlayers, isConnected]);

  // ====================== ENTRAR NA SALA ======================
  const joinRoom = useCallback(
    (roomIdToJoin) => {
      if (!socketRef.current || !isConnected) {
        setError("❌ Não conectado ao servidor");
        return;
      }

      if (!currentUser) {
        setError("❌ Você precisa estar logado");
        return;
      }

      const normalizedRoomId = roomIdToJoin.toUpperCase();

      const room = rooms.find((r) => r.roomId === normalizedRoomId);
      if (room) {
        const playerInRoom = room.players?.some((p) => p.name === currentUser);
        if (playerInRoom) {
          setError(`❌ Você já está na sala ${normalizedRoomId}`);
          return;
        }

        if (room.playerCount >= room.maxPlayers) {
          setError(`❌ Sala ${normalizedRoomId} está lotada!`);
          return;
        }
      }

      setJoining(true);
      setError("");
      setSuccess("");
      setCurrentRoomId(normalizedRoomId);

      socketRef.current.emit("join-room", {
        roomId: normalizedRoomId,
        playerName: currentUser,
      });

      const joinTimeout = setTimeout(() => {
        setJoining(false);
        if (onJoinGame) {
          onJoinGame({
            roomId: normalizedRoomId,
            playerName: currentUser,
            socket: socketRef.current,
          });
        }
      }, 3000);

      const handleRoomUpdate = (data) => {
        if (data.players?.some((p) => p.name === currentUser)) {
          setJoining(false);
          clearTimeout(joinTimeout);
          if (onJoinGame) {
            onJoinGame({
              roomId: normalizedRoomId,
              playerName: currentUser,
              socket: socketRef.current,
            });
          }
          socketRef.current.off("room-update", handleRoomUpdate);
        }
      };

      socketRef.current.on("room-update", handleRoomUpdate);

      return () => {
        clearTimeout(joinTimeout);
        socketRef.current?.off("room-update", handleRoomUpdate);
      };
    },
    [currentUser, isConnected, onJoinGame, rooms],
  );

  // ====================== ACEITAR CONVITE ======================
  const handleAcceptInvite = useCallback(
    (inviteData) => {
      if (!socketRef.current || !isConnected) {
        setError("❌ Não conectado ao servidor");
        return;
      }

      console.log("✅ Aceitando convite:", inviteData);

      const roomId = inviteData.roomId || `room_${inviteData.inviteId}`;
      setCurrentRoomId(roomId);

      socketRef.current.emit("join-room", {
        roomId: roomId,
        playerName: currentUser,
      });

      socketRef.current.emit("accept-invite", {
        inviteId: inviteData.inviteId,
        from: currentUser,
      });

      setTimeout(() => {
        if (onJoinGame) {
          onJoinGame({
            roomId: roomId,
            playerName: currentUser,
            socket: socketRef.current,
            invitedPlayers: inviteData.players || [],
            isInviteAccepted: true,
          });
        }
      }, 500);

      setPendingInvite(null);
    },
    [currentUser, isConnected, onJoinGame],
  );

  // ====================== RECUSAR CONVITE ======================
  const handleDeclineInvite = useCallback(
    (inviteData) => {
      if (!socketRef.current || !isConnected) return;

      socketRef.current.emit("decline-invite", {
        inviteId: inviteData.inviteId,
        from: currentUser,
      });

      setPendingInvite(null);
      setError(`❌ Convite recusado`);
      setTimeout(() => setError(""), 3000);
    },
    [currentUser, isConnected],
  );

  // ====================== RENDER ======================
  return (
    <motion.div
      style={overlayStyle()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <motion.div
        style={modalStyle()}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle()}>
          <h2 style={titleStyle()}>🌐 Lobby Multiplayer</h2>
          <button onClick={onCancel} style={closeButtonStyle()}>
            ✕
          </button>
        </div>

        {!isConnected && (
          <div style={connectionErrorStyle()}>⚠️ Conectando ao servidor...</div>
        )}

        {error && (
          <div style={errorStyle()}>
            {error}
            <button onClick={() => setError("")} style={errorCloseStyle()}>
              ✕
            </button>
          </div>
        )}

        {success && (
          <div style={successStyle()}>
            {success}
            <button onClick={() => setSuccess("")} style={successCloseStyle()}>
              ✕
            </button>
          </div>
        )}

        {/* 🔥 CONVITE PENDENTE */}
        {pendingInvite && (
          <motion.div
            style={inviteBannerStyle()}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div style={inviteContentStyle()}>
              <span style={inviteIconStyle()}>🎯</span>
              <div>
                <div style={inviteTitleStyle()}>
                  {pendingInvite.from} te convidou!
                </div>
                <div style={invitePlayersStyle()}>
                  👥 {pendingInvite.players?.join(", ") || "Jogadores"}
                </div>
              </div>
            </div>
            <div style={inviteActionsStyle()}>
              <button
                onClick={() => handleAcceptInvite(pendingInvite)}
                style={inviteAcceptStyle()}
              >
                Aceitar
              </button>
              <button
                onClick={() => handleDeclineInvite(pendingInvite)}
                style={inviteDeclineStyle()}
              >
                Recusar
              </button>
            </div>
          </motion.div>
        )}

        <div style={createSectionStyle()}>
          <h3 style={sectionTitleStyle()}>🎯 Criar Nova Sala</h3>
          <div style={createRowStyle()}>
            <div style={playersSelectStyle()}>
              <label style={labelStyle()}>Jogadores:</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                style={selectStyle()}
                disabled={creating}
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} jogadores
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={createRoom}
              style={createButtonStyle(creating || !isConnected)}
              disabled={creating || !isConnected}
            >
              {creating ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={spinnerStyle()} />
                  Criando...
                </span>
              ) : (
                "🚀 Criar Sala"
              )}
            </button>
          </div>
        </div>

        <div style={roomsSectionStyle()}>
          <div style={roomsHeaderStyle()}>
            <h3 style={sectionTitleStyle()}>📋 Salas Disponíveis</h3>
            <button
              onClick={fetchRooms}
              style={refreshButtonStyle()}
              disabled={loading || !isConnected}
            >
              🔄
            </button>
          </div>

          {loading ? (
            <div style={loadingStyle()}>
              <span style={spinnerStyle()} />
              Carregando salas...
            </div>
          ) : rooms.length === 0 ? (
            <div style={emptyStyle()}>
              <p>Nenhuma sala disponível no momento.</p>
              <p style={emptySubStyle()}>Crie uma sala para começar!</p>
            </div>
          ) : (
            <div style={roomsListStyle()}>
              {rooms.map((room) => {
                const isFull = room.playerCount >= room.maxPlayers;
                const playerNames = room.players?.map((p) => p.name) || [];
                const isInRoom = playerNames.includes(currentUser);

                return (
                  <motion.div
                    key={room.roomId}
                    style={roomItemStyle(isFull, isInRoom)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div style={roomInfoStyle()}>
                      <div style={roomIdStyle()}>
                        🏠 {room.roomId}
                        {room.isGameActive && (
                          <span style={gameActiveBadgeStyle()}>🎮 Em jogo</span>
                        )}
                        {isInRoom && (
                          <span style={inRoomBadgeStyle()}>
                            ✅ Você está aqui
                          </span>
                        )}
                      </div>
                      <div style={roomDetailsStyle()}>
                        <span>
                          👥 {room.playerCount}/{room.maxPlayers}
                        </span>
                        <span style={playerNamesStyle()}>
                          {playerNames.join(", ")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (isInRoom) {
                          if (onJoinGame) {
                            onJoinGame({
                              roomId: room.roomId,
                              playerName: currentUser,
                              socket: socketRef.current,
                            });
                          }
                        } else {
                          joinRoom(room.roomId);
                        }
                      }}
                      style={joinButtonStyle(isFull || isInRoom, isInRoom)}
                      disabled={isFull && !isInRoom}
                    >
                      {isInRoom ? "🔁 Entrar" : isFull ? "Lotada" : "🎯 Entrar"}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* 🔥 CHAT DO LOBBY */}
        {currentRoomId && socketRef.current && (
          <div style={chatWrapperStyle()}>
            <Chat
              socket={socketRef.current}
              roomId={currentRoomId}
              playerName={currentUser}
            />
          </div>
        )}

        <div style={footerStyle()}>
          <button onClick={onCancel} style={cancelButtonStyle()}>
            ❌ Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ====================== ESTILOS ======================

function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: "20px",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  };
}

function modalStyle() {
  return {
    background: "var(--bg-modal)",
    borderRadius: 24,
    padding: "24px 28px",
    maxWidth: "550px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    color: "var(--text-primary)",
    border: "2px solid var(--border-gold)",
    boxShadow: "0 20px 60px var(--shadow-dark)",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255,215,0,0.3) transparent",
  };
}

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--border-light)",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "bold",
  };
}

function closeButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "1.3rem",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 8,
    transition: "all 0.3s ease",
  };
}

function connectionErrorStyle() {
  return {
    background: "rgba(255,152,0,0.15)",
    border: "1px solid #ff9800",
    borderRadius: 12,
    padding: "10px 14px",
    color: "#ff9800",
    textAlign: "center",
    marginBottom: "16px",
    fontSize: "0.9rem",
  };
}

function errorStyle() {
  return {
    background: "rgba(244,67,54,0.15)",
    border: "1px solid #f44336",
    borderRadius: 12,
    padding: "10px 14px",
    color: "#f44336",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
  };
}

function errorCloseStyle() {
  return {
    background: "none",
    border: "none",
    color: "#f44336",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0 4px",
  };
}

function successStyle() {
  return {
    background: "rgba(76,175,80,0.15)",
    border: "1px solid #4caf50",
    borderRadius: 12,
    padding: "10px 14px",
    color: "#4caf50",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
  };
}

function successCloseStyle() {
  return {
    background: "none",
    border: "none",
    color: "#4caf50",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0 4px",
  };
}

function inviteBannerStyle() {
  return {
    background: "rgba(255,215,0,0.12)",
    border: "2px solid gold",
    borderRadius: 16,
    padding: "14px 18px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  };
}

function inviteContentStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };
}

function inviteIconStyle() {
  return {
    fontSize: "2rem",
  };
}

function inviteTitleStyle() {
  return {
    fontWeight: "bold",
    fontSize: "1rem",
    color: "gold",
  };
}

function invitePlayersStyle() {
  return {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
  };
}

function inviteActionsStyle() {
  return {
    display: "flex",
    gap: "8px",
  };
}

function inviteAcceptStyle() {
  return {
    background: "rgba(76,175,80,0.2)",
    border: "1px solid #4caf50",
    borderRadius: 12,
    padding: "6px 16px",
    color: "#4caf50",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
    transition: "all 0.3s ease",
  };
}

function inviteDeclineStyle() {
  return {
    background: "rgba(244,67,54,0.15)",
    border: "1px solid #f44336",
    borderRadius: 12,
    padding: "6px 16px",
    color: "#f44336",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
    transition: "all 0.3s ease",
  };
}

function createSectionStyle() {
  return {
    background: "rgba(255,215,0,0.05)",
    borderRadius: 16,
    padding: "16px",
    marginBottom: "20px",
    border: "1px solid rgba(255,215,0,0.1)",
  };
}

function sectionTitleStyle() {
  return {
    margin: "0 0 12px 0",
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    fontWeight: "600",
  };
}

function createRowStyle() {
  return {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap",
  };
}

function playersSelectStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    minWidth: "120px",
  };
}

function labelStyle() {
  return {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    fontWeight: "500",
  };
}

function selectStyle() {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid var(--border-input)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    outline: "none",
    cursor: "pointer",
    transition: "var(--transition-theme)",
  };
}

function createButtonStyle(disabled) {
  return {
    padding: "10px 24px",
    borderRadius: 30,
    border: "none",
    background: disabled ? "#444" : "radial-gradient(#f7d97c, #d6a12e)",
    color: disabled ? "#888" : "#2e241f",
    fontWeight: "bold",
    fontSize: "0.95rem",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
    minWidth: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function roomsSectionStyle() {
  return {
    marginBottom: "16px",
  };
}

function roomsHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  };
}

function refreshButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 8,
    transition: "all 0.3s ease",
  };
}

function loadingStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "30px 0",
    color: "var(--text-muted)",
    fontSize: "0.9rem",
  };
}

function spinnerStyle() {
  return {
    display: "inline-block",
    width: 20,
    height: 20,
    border: "2px solid rgba(255,215,0,0.2)",
    borderTop: "2px solid gold",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  };
}

function emptyStyle() {
  return {
    textAlign: "center",
    padding: "30px 0",
    color: "var(--text-muted)",
  };
}

function emptySubStyle() {
  return {
    fontSize: "0.8rem",
    marginTop: "4px",
    opacity: 0.7,
  };
}

function roomsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "250px",
    overflowY: "auto",
    paddingRight: "4px",
  };
}

function roomItemStyle(isFull, isInRoom) {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: isInRoom
      ? "rgba(76,175,80,0.08)"
      : isFull
        ? "rgba(244,67,54,0.05)"
        : "rgba(255,255,255,0.03)",
    borderRadius: 12,
    border: isInRoom
      ? "2px solid #4caf50"
      : isFull
        ? "1px solid rgba(244,67,54,0.2)"
        : "1px solid var(--border-light)",
    transition: "all 0.3s ease",
  };
}

function roomInfoStyle() {
  return {
    flex: 1,
    minWidth: 0,
  };
}

function roomIdStyle() {
  return {
    fontWeight: "bold",
    fontSize: "0.95rem",
    color: "gold",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  };
}

function gameActiveBadgeStyle() {
  return {
    fontSize: "0.6rem",
    background: "rgba(255,152,0,0.2)",
    color: "#ff9800",
    padding: "2px 8px",
    borderRadius: 10,
    border: "1px solid rgba(255,152,0,0.2)",
  };
}

function inRoomBadgeStyle() {
  return {
    fontSize: "0.6rem",
    background: "rgba(76,175,80,0.2)",
    color: "#4caf50",
    padding: "2px 8px",
    borderRadius: 10,
    border: "1px solid rgba(76,175,80,0.2)",
  };
}

function roomDetailsStyle() {
  return {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  };
}

function playerNamesStyle() {
  return {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    opacity: 0.7,
  };
}

function joinButtonStyle(isFull, isInRoom) {
  return {
    padding: "6px 16px",
    borderRadius: 20,
    border: "none",
    background: isInRoom
      ? "rgba(76,175,80,0.2)"
      : isFull
        ? "#333"
        : "rgba(76,175,80,0.15)",
    color: isInRoom ? "#4caf50" : isFull ? "#666" : "#4caf50",
    fontWeight: "bold",
    fontSize: "0.8rem",
    cursor: isFull && !isInRoom ? "not-allowed" : "pointer",
    opacity: isFull && !isInRoom ? 0.5 : 1,
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
    border: isInRoom
      ? "1px solid #4caf50"
      : isFull
        ? "1px solid #444"
        : "1px solid rgba(76,175,80,0.3)",
  };
}

function chatWrapperStyle() {
  return {
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid var(--border-light)",
  };
}

function footerStyle() {
  return {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid var(--border-light)",
  };
}

function cancelButtonStyle() {
  return {
    padding: "8px 20px",
    borderRadius: 20,
    border: "1px solid rgba(244,67,54,0.3)",
    background: "rgba(244,67,54,0.1)",
    color: "#f44336",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
    transition: "all 0.3s ease",
  };
}

// components/Poker/OnlineLobby.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function OnlineLobby({ onJoinGame }) {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");
  const socketRef = useRef(null);
  const listenersAttached = useRef(false);

  // ✅ URL do servidor Socket.IO (Render ou local)
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

  useEffect(() => {
    console.log("🔄 Conectando ao servidor Socket.IO...");
    console.log(`📍 URL: ${SOCKET_URL}`);

    const newSocket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.off("connect");
    newSocket.off("connect_error");
    newSocket.off("disconnect");
    newSocket.off("error");

    newSocket.on("connect", () => {
      setConnected(true);
      setError("");
      console.log("🟢 Conectado ao servidor Socket.IO");
    });

    newSocket.on("connect_error", (err) => {
      setConnected(false);
      setError(`❌ Erro de conexão: ${err.message}`);
      console.error("🔴 Erro de conexão:", err);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
      console.log("🔴 Desconectado do servidor");
    });

    const errorHandler = (data) => {
      console.log("📡 Erro do lobby:", data);
      setError(`❌ ${data.message}`);
      setTimeout(() => setError(""), 5000);
    };

    newSocket.on("error", errorHandler);

    newSocket.onAny((event, ...args) => {
      if (event !== "error") {
        console.log(`📡 Evento: ${event}`, args);
      }
    });

    listenersAttached.current = true;

    return () => {
      console.log("🔌 Componente OnlineLobby desmontando...");
      newSocket.off("connect");
      newSocket.off("connect_error");
      newSocket.off("disconnect");
      newSocket.off("error");
      newSocket.offAny();
    };
  }, [SOCKET_URL]);

  const createRoom = () => {
    if (!playerName.trim()) {
      setError("❌ Digite seu nome!");
      return;
    }
    if (!connected) {
      setError("❌ Não conectado ao servidor!");
      return;
    }

    setIsConnecting(true);
    console.log(`📤 Criando sala para: ${playerName}`);
    const currentSocket = socketRef.current;

    currentSocket.off("room-created");
    currentSocket.off("error");

    currentSocket.emit("create-room", { playerName: playerName.trim() });

    currentSocket.once("room-created", (data) => {
      setIsConnecting(false);
      setCreatedRoomId(data.roomId);
      console.log(`✅ Sala criada: ${data.roomId}`);

      setError(`✅ Sala criada! Código: ${data.roomId}`);
      setTimeout(() => setError(""), 5000);

      onJoinGame({
        roomId: data.roomId,
        playerName: playerName.trim(),
        socket: currentSocket,
      });
    });

    currentSocket.once("error", (data) => {
      setIsConnecting(false);
      setError(`❌ ${data.message}`);
      console.error("❌ Erro ao criar sala:", data);
      setTimeout(() => setError(""), 3000);
    });
  };

  const joinRoom = () => {
    if (!playerName.trim()) {
      setError("❌ Digite seu nome!");
      return;
    }
    if (!roomId.trim()) {
      setError("❌ Digite o código da sala!");
      return;
    }
    if (!connected) {
      setError("❌ Não conectado ao servidor!");
      return;
    }

    setIsConnecting(true);
    const roomIdUpper = roomId.trim().toUpperCase();
    console.log(`📤 Tentando entrar na sala: ${roomIdUpper}`);
    console.log(`📤 Jogador: ${playerName}`);

    const currentSocket = socketRef.current;

    currentSocket.off("room-update");
    currentSocket.off("error");

    currentSocket.emit("join-room", {
      roomId: roomIdUpper,
      playerName: playerName.trim(),
    });

    currentSocket.once("room-update", (data) => {
      setIsConnecting(false);
      console.log(`✅ Entrou na sala: ${roomIdUpper}`);
      onJoinGame({
        roomId: roomIdUpper,
        playerName: playerName.trim(),
        socket: currentSocket,
      });
    });

    currentSocket.once("error", (data) => {
      setIsConnecting(false);
      setError(`❌ ${data.message}`);
      console.error("❌ Erro ao entrar na sala:", data);
      setTimeout(() => setError(""), 3000);
    });
  };

  return (
    <div style={overlayStyle()}>
      <div style={modalStyle()}>
        <h2 style={titleStyle()}>🌐 JOGAR ONLINE</h2>

        <div style={statusStyle()}>
          <span
            style={{
              color: connected ? "#4caf50" : "#f44336",
              fontWeight: "bold",
            }}
          >
            {connected ? "🟢 Conectado ao servidor" : "🔴 Desconectado"}
          </span>
        </div>

        {!connected && (
          <div style={warningStyle()}>
            ⚠️ Servidor Socket.IO não está rodando!
            <br />
            <span style={{ fontSize: "0.8rem", color: "#888" }}>
              URL: {SOCKET_URL}
            </span>
          </div>
        )}

        <div style={inputGroupStyle()}>
          <label style={labelStyle()}>Seu nome:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Digite seu nome"
            style={inputStyle()}
            disabled={isConnecting}
          />
        </div>

        {createdRoomId && (
          <div style={successStyle()}>
            ✅ Sala criada: <strong>{createdRoomId}</strong>
            <br />
            <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
              Compartilhe este código com seus amigos!
            </span>
          </div>
        )}

        <div style={buttonGroupStyle()}>
          <button
            onClick={createRoom}
            style={buttonStyle(connected && !isConnecting)}
            disabled={!connected || isConnecting}
          >
            {isConnecting ? "⏳ Criando..." : "🆕 Criar Sala"}
          </button>
        </div>

        <div style={dividerStyle()}>OU</div>

        <div style={inputGroupStyle()}>
          <label style={labelStyle()}>Código da sala:</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="Ex: ABC123"
            style={inputStyle()}
            maxLength={6}
            disabled={isConnecting}
          />
        </div>

        <button
          onClick={joinRoom}
          style={buttonStyle(connected && !isConnecting && roomId.trim())}
          disabled={!connected || isConnecting || !roomId.trim()}
        >
          {isConnecting ? "⏳ Entrando..." : "🔗 Entrar na Sala"}
        </button>

        {error && <div style={errorStyle()}>{error}</div>}

        <div style={infoStyle()}>
          💡 Dica: Abra outra janela do navegador para testar!
          <br />
          <span style={{ fontSize: "0.7rem", color: "#666" }}>
            Servidor: {SOCKET_URL}
          </span>
        </div>
      </div>
    </div>
  );
}

// ====================== ESTILOS ======================
function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.95)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: 20,
  };
}

function modalStyle() {
  return {
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "30px 40px",
    borderRadius: 30,
    maxWidth: 450,
    width: "100%",
    color: "white",
    border: "2px solid gold",
    maxHeight: "90vh",
    overflowY: "auto",
  };
}

function titleStyle() {
  return {
    textAlign: "center",
    color: "gold",
    margin: "0 0 15px",
    fontSize: "1.8rem",
  };
}

function statusStyle() {
  return {
    textAlign: "center",
    marginBottom: "15px",
    fontSize: "0.9rem",
  };
}

function warningStyle() {
  return {
    background: "rgba(255,152,0,0.15)",
    border: "1px solid #ff9800",
    borderRadius: 15,
    padding: "12px",
    marginBottom: "15px",
    fontSize: "0.85rem",
    color: "#ff9800",
    textAlign: "center",
    lineHeight: "1.6",
  };
}

function codeStyle() {
  return {
    background: "rgba(0,0,0,0.4)",
    padding: "4px 10px",
    borderRadius: 8,
    fontFamily: "monospace",
    fontSize: "0.8rem",
  };
}

function successStyle() {
  return {
    background: "rgba(76,175,80,0.15)",
    border: "1px solid #4caf50",
    borderRadius: 15,
    padding: "10px",
    marginBottom: "15px",
    fontSize: "0.9rem",
    color: "#4caf50",
    textAlign: "center",
  };
}

function inputGroupStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "15px",
  };
}

function labelStyle() {
  return {
    color: "#ffefb9",
    fontSize: "0.9rem",
    fontWeight: "bold",
  };
}

function inputStyle() {
  return {
    padding: "12px 15px",
    borderRadius: 15,
    border: "1px solid rgba(255,215,0,0.3)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: "1rem",
    transition: "all 0.3s ease",
  };
}

function buttonGroupStyle() {
  return {
    marginBottom: "15px",
  };
}

function buttonStyle(enabled) {
  return {
    background: enabled
      ? "radial-gradient(#f7d97c,#d6a12e)"
      : "rgba(255,255,255,0.1)",
    border: enabled ? "none" : "1px solid rgba(255,255,255,0.2)",
    fontWeight: "bold",
    fontSize: "1rem",
    padding: "12px 20px",
    borderRadius: 60,
    cursor: enabled ? "pointer" : "not-allowed",
    boxShadow: enabled ? "0 4px 0 #7a4c1a" : "none",
    color: enabled ? "#2e241f" : "#666",
    width: "100%",
    opacity: enabled ? 1 : 0.5,
    transition: "all 0.3s ease",
  };
}

function dividerStyle() {
  return {
    textAlign: "center",
    color: "#888",
    margin: "15px 0",
    fontSize: "0.9rem",
  };
}

function errorStyle() {
  return {
    marginTop: "15px",
    padding: "10px",
    background: "rgba(244,67,54,0.2)",
    borderRadius: 15,
    color: "#f44336",
    textAlign: "center",
    fontSize: "0.9rem",
  };
}

function infoStyle() {
  return {
    marginTop: "15px",
    padding: "10px",
    background: "rgba(255,215,0,0.05)",
    borderRadius: 15,
    color: "#888",
    textAlign: "center",
    fontSize: "0.8rem",
    lineHeight: "1.6",
  };
}

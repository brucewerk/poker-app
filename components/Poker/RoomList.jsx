// components/Poker/RoomList.jsx
"use client";

import { useState, useEffect } from "react";

export default function RoomList({ socket, onJoinRoom }) {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("list-rooms");

    socket.on("room-list", (data) => {
      setRooms(data);
    });

    return () => {
      socket.off("room-list");
    };
  }, [socket]);

  if (rooms.length === 0) {
    return (
      <div style={emptyStyle()}>
        <p style={emptyTextStyle()}>📭 Nenhuma sala disponível no momento.</p>
        <p style={emptySubStyle()}>Crie uma sala para começar a jogar!</p>
      </div>
    );
  }

  return (
    <div style={containerStyle()}>
      <h3 style={titleStyle()}>🏠 SALAS DISPONÍVEIS</h3>
      <div style={listStyle()}>
        {rooms.map((room) => (
          <div key={room.roomId} style={roomCardStyle(room.isGameActive)}>
            <div style={roomHeaderStyle()}>
              <span style={roomIdStyle()}>🔑 {room.roomId}</span>
              <span style={roomStatusStyle(room.isGameActive)}>
                {room.isGameActive ? "🎮 Em jogo" : "🟢 Disponível"}
              </span>
            </div>
            <div style={roomPlayersStyle()}>
              <span>
                👥 {room.playerCount}/{room.maxPlayers} jogadores
              </span>
            </div>
            <div style={roomPlayersListStyle()}>
              {room.players.map((player, i) => (
                <span key={i} style={playerChipStyle()}>
                  {player.name}{" "}
                  <span style={chipsStyle()}>💰{player.chips || 0}</span>
                </span>
              ))}
            </div>
            {!room.isGameActive && room.playerCount < room.maxPlayers && (
              <button
                onClick={() => onJoinRoom(room.roomId)}
                style={joinButtonStyle()}
              >
                🔗 Entrar na Sala
              </button>
            )}
            {room.isGameActive && (
              <span style={gameActiveStyle()}>
                ⏳ Aguarde o fim da partida...
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ====================== ESTILOS ======================
function containerStyle() {
  return {
    marginTop: "15px",
    padding: "15px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    maxHeight: "300px",
    overflowY: "auto",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: "0 0 15px",
    fontSize: "1rem",
    textAlign: "center",
  };
}

function listStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };
}

function roomCardStyle(isGameActive) {
  return {
    background: isGameActive ? "rgba(255,152,0,0.1)" : "rgba(255,255,255,0.05)",
    border: isGameActive
      ? "1px solid rgba(255,152,0,0.3)"
      : "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "12px 15px",
    color: "white",
  };
}

function roomHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "5px",
  };
}

function roomIdStyle() {
  return {
    fontWeight: "bold",
    fontSize: "0.9rem",
    color: "#ffd700",
  };
}

function roomStatusStyle(isGameActive) {
  return {
    fontSize: "0.75rem",
    padding: "2px 10px",
    borderRadius: 10,
    background: isGameActive ? "rgba(255,152,0,0.3)" : "rgba(76,175,80,0.3)",
    color: isGameActive ? "#ff9800" : "#4caf50",
  };
}

function roomPlayersStyle() {
  return {
    fontSize: "0.8rem",
    color: "#aaa",
    marginBottom: "5px",
  };
}

function roomPlayersListStyle() {
  return {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px",
  };
}

function playerChipStyle() {
  return {
    fontSize: "0.75rem",
    color: "#ddd",
    background: "rgba(255,255,255,0.05)",
    padding: "2px 10px",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: "5px",
  };
}

function chipsStyle() {
  return {
    color: "#4caf50",
    fontWeight: "bold",
    fontSize: "0.7rem",
  };
}

function joinButtonStyle() {
  return {
    background: "rgba(76,175,80,0.3)",
    border: "1px solid #4caf50",
    borderRadius: 15,
    padding: "6px 15px",
    color: "#4caf50",
    cursor: "pointer",
    fontSize: "0.8rem",
    width: "100%",
    transition: "all 0.3s ease",
  };
}

function gameActiveStyle() {
  return {
    fontSize: "0.75rem",
    color: "#888",
    display: "block",
    textAlign: "center",
  };
}

function emptyStyle() {
  return {
    marginTop: "15px",
    padding: "20px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    textAlign: "center",
  };
}

function emptyTextStyle() {
  return {
    color: "#888",
    fontSize: "0.9rem",
    margin: "0 0 5px",
  };
}

function emptySubStyle() {
  return {
    color: "#666",
    fontSize: "0.8rem",
    margin: 0,
  };
}

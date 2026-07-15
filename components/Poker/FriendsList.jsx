// components/Poker/FriendsList.jsx
"use client";

import { useState, useEffect } from "react";

export default function FriendsList({ username }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFriends, setShowFriends] = useState(false);
  const [newFriend, setNewFriend] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (username) {
      fetchFriends();
    } else {
      setLoading(false);
    }
  }, [username]);

  const fetchFriends = async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/friends?username=${encodeURIComponent(username)}`,
      );
      const data = await res.json();
      if (data.success) {
        // 🔥 Garantir que cada amigo tenha os campos corretos
        const validFriends = (data.friends || []).map((friend) => ({
          username: friend.username || "Desconhecido",
          level: friend.level || 1,
          chips: friend.chips || 0,
          isOnline: friend.isOnline || false,
        }));
        setFriends(validFriends);
        console.log(
          `✅ ${validFriends.length} amigos carregados:`,
          validFriends,
        );
      } else {
        console.log("ℹ️ API de amigos retornou erro:", data.error);
        setFriends([]);
      }
    } catch (error) {
      console.log("ℹ️ Erro ao carregar amigos:", error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async () => {
    if (!newFriend.trim()) return;
    setError("");
    setRefreshing(true);

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendUsername: newFriend.trim(),
          action: "add",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewFriend("");
        await fetchFriends();
        alert(`✅ ${newFriend.trim()} adicionado como amigo!`);
      } else {
        setError(data.error || "Erro ao adicionar amigo");
      }
    } catch (error) {
      setError("Erro de conexão");
    } finally {
      setRefreshing(false);
    }
  };

  const removeFriend = async (friendUsername) => {
    if (!confirm(`Remover ${friendUsername} da lista de amigos?`)) return;

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendUsername,
          action: "remove",
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchFriends();
      }
    } catch (error) {
      console.error("Erro ao remover amigo:", error);
      alert("Erro ao remover amigo");
    }
  };

  if (loading) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>👥 AMIGOS</h3>
        <p style={emptyStyle()}>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={panelStyle()}>
      <div style={headerStyle()}>
        <h3 style={titleStyle()}>👥 AMIGOS</h3>
        <button
          onClick={() => setShowFriends(!showFriends)}
          style={toggleButtonStyle()}
        >
          {showFriends ? "▲" : "▼"} ({friends.length})
        </button>
      </div>

      {showFriends && (
        <div style={contentStyle()}>
          <div style={addFriendStyle()}>
            <input
              type="text"
              value={newFriend}
              onChange={(e) => setNewFriend(e.target.value)}
              placeholder="Nome do amigo"
              style={inputStyle()}
              onKeyPress={(e) => e.key === "Enter" && addFriend()}
              disabled={refreshing}
            />
            <button
              onClick={addFriend}
              style={addButtonStyle()}
              disabled={refreshing || !newFriend.trim()}
            >
              {refreshing ? "⏳" : "Adicionar"}
            </button>
          </div>

          {error && <div style={errorStyle()}>{error}</div>}

          {friends.length === 0 ? (
            <p style={emptyStyle()}>
              {username
                ? "Nenhum amigo adicionado ainda."
                : "Faça login para ver seus amigos."}
            </p>
          ) : (
            <div style={friendsListStyle()}>
              {friends.map((friend, index) => (
                <div key={index} style={friendItemStyle()}>
                  <div style={friendInfoStyle()}>
                    <span style={friendNameStyle()}>
                      {friend.username || "Desconhecido"}
                    </span>
                    <span style={friendLevelStyle()}>
                      Nv. {friend.level || 1}
                    </span>
                    <span style={friendChipsStyle()}>
                      💰 {friend.chips || 0}
                    </span>
                    {friend.isOnline && (
                      <span style={onlineBadgeStyle()}>🟢 Online</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeFriend(friend.username)}
                    style={removeButtonStyle()}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ====================== ESTILOS ======================
function panelStyle() {
  return {
    background: "#1a2a1ecc",
    backdropFilter: "blur(4px)",
    borderRadius: 20,
    padding: 15,
    marginTop: 10,
    color: "white",
    border: "1px solid rgba(255,215,0,0.2)",
  };
}

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: "0 0 10px",
    fontSize: "1rem",
  };
}

function toggleButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "gold",
    fontSize: "1rem",
    cursor: "pointer",
  };
}

function contentStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };
}

function addFriendStyle() {
  return {
    display: "flex",
    gap: "8px",
  };
}

function inputStyle() {
  return {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 15,
    border: "1px solid rgba(255,215,0,0.2)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: "0.85rem",
  };
}

function addButtonStyle() {
  return {
    background: "rgba(255,215,0,0.2)",
    border: "1px solid rgba(255,215,0,0.3)",
    borderRadius: 15,
    padding: "8px 15px",
    color: "gold",
    cursor: "pointer",
    fontSize: "0.8rem",
  };
}

function errorStyle() {
  return {
    color: "#f44336",
    fontSize: "0.8rem",
    textAlign: "center",
  };
}

function emptyStyle() {
  return {
    textAlign: "center",
    color: "#888",
    fontSize: "0.85rem",
    padding: "10px 0",
  };
}

function friendsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "150px",
    overflowY: "auto",
  };
}

function friendItemStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.05)",
  };
}

function friendInfoStyle() {
  return {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  };
}

function friendNameStyle() {
  return {
    fontWeight: "bold",
    color: "#ffefb9",
    fontSize: "0.85rem",
  };
}

function friendLevelStyle() {
  return {
    color: "gold",
    fontSize: "0.7rem",
  };
}

function friendChipsStyle() {
  return {
    color: "#4caf50",
    fontSize: "0.7rem",
  };
}

function onlineBadgeStyle() {
  return {
    fontSize: "0.6rem",
    color: "#4caf50",
    background: "rgba(76,175,80,0.2)",
    padding: "2px 8px",
    borderRadius: 10,
  };
}

function removeButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "#f44336",
    cursor: "pointer",
    fontSize: "0.8rem",
  };
}

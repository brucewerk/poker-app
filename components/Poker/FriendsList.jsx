// components/Poker/FriendsList.jsx
"use client";

import { useState, useEffect } from "react";

export default function FriendsList({ username }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFriends, setShowFriends] = useState(false);
  const [newFriend, setNewFriend] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
      setError("");
      const res = await fetch(
        `/api/friends?username=${encodeURIComponent(username)}`,
        {
          credentials: "include",
        },
      );
      const data = await res.json();

      if (data.success) {
        const validFriends = (data.friends || []).map((friend) => ({
          username: friend.username || "Desconhecido",
          level: friend.level || 1,
          chips: friend.chips || 0,
          isOnline: friend.isOnline || false,
        }));
        setFriends(validFriends);
        console.log(`✅ ${validFriends.length} amigos carregados`);
      } else {
        console.log("ℹ️ Erro ao carregar amigos:", data.error);
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
    const friendName = newFriend.trim();
    if (!friendName) {
      setError("Digite o nome do amigo");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (friendName.toLowerCase() === username?.toLowerCase()) {
      setError("❌ Você não pode adicionar a si mesmo como amigo!");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Verificação case-insensitive
    const alreadyFriend = friends.some(
      (f) => f.username.toLowerCase() === friendName.toLowerCase(),
    );

    if (alreadyFriend) {
      setError(`ℹ️ "${friendName}" já está na sua lista de amigos!`);
      setTimeout(() => setError(""), 3000);
      setNewFriend("");
      return;
    }

    setError("");
    setSuccess("");
    setRefreshing(true);

    try {
      const payload = {
        friendUsername: friendName,
        action: "add",
      };
      console.log("📤 Enviando POST /api/friends:", payload);

      const res = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📡 POST /api/friends - Resposta:", data);

      // 🔥 CASO 1: Amigo já existe (status 200 com alreadyFriend)
      if (data.alreadyFriend) {
        setError(`ℹ️ "${friendName}" já está na sua lista de amigos!`);
        setTimeout(() => setError(""), 3000);
        setNewFriend("");
        setRefreshing(false);
        return;
      }

      // 🔥 CASO 2: Amigo não encontrado (status 200 com notFound)
      if (data.notFound) {
        setError(
          `❌ Usuário "${friendName}" não encontrado. Verifique o nome.`,
        );
        setTimeout(() => setError(""), 3000);
        setRefreshing(false);
        return;
      }

      // 🔥 CASO 3: Sucesso
      if (data.success) {
        setNewFriend("");
        setSuccess(`✅ ${friendName} adicionado como amigo!`);
        await fetchFriends();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        // Fallback para outros erros
        setError(data.error || "Erro ao adicionar amigo");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error("❌ Erro ao adicionar amigo:", error);
      setError("Erro de conexão");
      setTimeout(() => setError(""), 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const removeFriend = async (friendUsername) => {
    if (!confirm(`Remover ${friendUsername} da lista de amigos?`)) return;

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          friendUsername,
          action: "remove",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`✅ ${friendUsername} removido com sucesso!`);
        await fetchFriends();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Erro ao remover amigo");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error("Erro ao remover amigo:", error);
      setError("Erro ao remover amigo");
      setTimeout(() => setError(""), 3000);
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
              placeholder="Digite o nome do amigo"
              style={inputStyle()}
              onKeyDown={(e) => e.key === "Enter" && addFriend()}
              disabled={refreshing}
            />
            <button
              onClick={addFriend}
              style={addButtonStyle()}
              disabled={refreshing || !newFriend.trim()}
            >
              {refreshing ? "⏳" : "➕ Adicionar"}
            </button>
          </div>

          {error && (
            <div style={errorStyle()}>
              {error.includes("ℹ️") ? "ℹ️" : "❌"}{" "}
              {error.replace("ℹ️", "").trim()}
            </div>
          )}
          {success && <div style={successStyle()}>{success}</div>}

          {friends.length === 0 ? (
            <p style={emptyStyle()}>
              {username
                ? "Nenhum amigo adicionado ainda. Digite um nome acima e clique em Adicionar."
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
                  </div>
                  <button
                    onClick={() => removeFriend(friend.username)}
                    style={removeButtonStyle()}
                    title="Remover amigo"
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
    color: "#ff9800",
    fontSize: "0.8rem",
    textAlign: "center",
    padding: "5px",
    background: "rgba(255,152,0,0.1)",
    borderRadius: 10,
  };
}

function successStyle() {
  return {
    color: "#4caf50",
    fontSize: "0.8rem",
    textAlign: "center",
    padding: "5px",
    background: "rgba(76,175,80,0.1)",
    borderRadius: 10,
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

function removeButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "#f44336",
    cursor: "pointer",
    fontSize: "0.8rem",
    padding: "4px 8px",
    borderRadius: 5,
  };
}

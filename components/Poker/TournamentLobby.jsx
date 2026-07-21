// components/Poker/TournamentLobby.jsx - COMPLETO COM HEADER CORRIGIDO
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TournamentGame from "./TournamentGame.jsx";

export default function TournamentLobby({ onClose, username }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTournament, setActiveTournament] = useState(null);
  const [showTournamentGame, setShowTournamentGame] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    maxPlayers: 20,
    buyIn: 100,
  });
  const isMounted = useRef(true);
  const isFetching = useRef(false);
  const intervalRef = useRef(null);

  const [newTournament, setNewTournament] = useState({
    name: "",
    description: "",
    maxPlayers: 20,
    buyIn: 100,
  });

  // 🔥 FUNÇÃO DE BUSCA
  const fetchTournaments = useCallback(async (silent = false) => {
    if (isFetching.current || !isMounted.current) return;

    try {
      isFetching.current = true;
      if (!silent) {
        setLoading(true);
        setIsRefreshing(true);
      }

      const res = await fetch("/api/tournaments?type=active");
      const data = await res.json();

      if (data.success && isMounted.current) {
        setTournaments(data.tournaments || []);
        if (!silent) {
          setSuccess("✅ Lista atualizada");
          setTimeout(() => setSuccess(""), 2000);
        }
      }
    } catch (error) {
      if (!silent) {
        console.error("Erro ao buscar torneios:", error);
      }
    } finally {
      if (isMounted.current) {
        isFetching.current = false;
        if (!silent) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    }
  }, []);

  // 🔥 CARREGAMENTO INICIAL
  useEffect(() => {
    isMounted.current = true;
    fetchTournaments();

    intervalRef.current = setInterval(() => {
      if (isMounted.current && !isRefreshing) {
        fetchTournaments(true);
      }
    }, 30000);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchTournaments]);

  // 🔥 CRIAR TORNEIO
  const handleCreateTournament = async () => {
    if (!newTournament.name.trim()) {
      setError("Digite um nome para o torneio");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newTournament.name,
          description: newTournament.description,
          maxPlayers: newTournament.maxPlayers,
          buyIn: newTournament.buyIn,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewTournament({
          name: "",
          description: "",
          maxPlayers: 20,
          buyIn: 100,
        });
        setSuccess("✅ Torneio criado com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
        await fetchTournaments(false);
      } else {
        setError(`❌ ${data.error}`);
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("❌ Erro ao criar torneio");
      setTimeout(() => setError(""), 3000);
    } finally {
      setCreating(false);
    }
  };

  // 🔥 PARTICIPAR DO TORNEIO
  const handleJoinTournament = async (tournamentId) => {
    setJoinLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          tournamentId: tournamentId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("✅ Inscrito com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
        await fetchTournaments(false);
      } else {
        setError(`❌ ${data.error}`);
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("❌ Erro ao entrar no torneio");
      setTimeout(() => setError(""), 3000);
    } finally {
      setJoinLoading(false);
    }
  };

  // 🔥 INICIAR TORNEIO
  const handleStartTournament = async (tournamentId) => {
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          tournamentId: tournamentId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("✅ Torneio iniciado!");
        setTimeout(() => setSuccess(""), 3000);
        await fetchTournaments(false);
      } else {
        setError(`❌ ${data.error}`);
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("❌ Erro ao iniciar torneio");
      setTimeout(() => setError(""), 3000);
    }
  };

  // 🔥 EDITAR TORNEIO
  const handleEditTournament = (tournament) => {
    setEditingTournament(tournament);
    setEditForm({
      name: tournament.name,
      description: tournament.description || "",
      maxPlayers: tournament.maxPlayers,
      buyIn: tournament.buyIn,
    });
  };

  // 🔥 SALVAR EDIÇÃO
  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      setError("Digite um nome para o torneio");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          tournamentId: editingTournament._id,
          name: editForm.name,
          description: editForm.description,
          maxPlayers: editForm.maxPlayers,
          buyIn: editForm.buyIn,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("✅ Torneio atualizado com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
        setEditingTournament(null);
        await fetchTournaments(false);
      } else {
        setError(`❌ ${data.error}`);
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("❌ Erro ao atualizar torneio");
      setTimeout(() => setError(""), 3000);
    } finally {
      setCreating(false);
    }
  };

  // 🔥 DELETAR TORNEIO
  const handleDeleteTournament = async (tournamentId, tournamentName) => {
    if (
      !confirm(
        `⚠️ Tem certeza que deseja deletar o torneio "${tournamentName}"?\n\nEsta ação não pode ser desfeita e as fichas dos jogadores serão devolvidas.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/tournaments?id=${tournamentId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("✅ Torneio deletado com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
        await fetchTournaments(false);
      } else {
        setError(`❌ ${data.error}`);
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("❌ Erro ao deletar torneio");
      setTimeout(() => setError(""), 3000);
    }
  };

  // 🔥 ENTRAR NO JOGO DO TORNEIO
  const handleEnterGame = async (tournament) => {
    try {
      const res = await fetch(
        `/api/tournaments/game?tournamentId=${tournament._id}`,
      );
      const data = await res.json();

      if (data.success && data.gameState) {
        setActiveTournament(tournament);
        setShowTournamentGame(true);
      } else {
        const startRes = await fetch("/api/tournaments/game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournamentId: tournament._id }),
        });
        const startData = await startRes.json();
        if (startData.success) {
          setActiveTournament(tournament);
          setShowTournamentGame(true);
        } else {
          setError(`❌ ${startData.error}`);
          setTimeout(() => setError(""), 3000);
        }
      }
    } catch (error) {
      setError("❌ Erro ao entrar no jogo");
      setTimeout(() => setError(""), 3000);
    }
  };

  // 🔥 SAIR DO JOGO DO TORNEIO
  const handleLeaveTournamentGame = () => {
    setShowTournamentGame(false);
    setActiveTournament(null);
    fetchTournaments(false);
  };

  // 🔥 REFRESH MANUAL
  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchTournaments(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("pt-BR");
  };

  // 🔥 SE ESTIVER NO JOGO DO TORNEIO
  if (showTournamentGame && activeTournament) {
    return (
      <TournamentGame
        tournament={activeTournament}
        onLeave={handleLeaveTournamentGame}
        username={username}
      />
    );
  }

  if (loading) {
    return (
      <div style={overlayStyle()}>
        <div style={modalStyle()}>
          <div style={loadingContainerStyle()}>
            <motion.div
              style={loadingSpinnerStyle()}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              🏅
            </motion.div>
            <p style={loadingTextStyle()}>Carregando torneios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      style={overlayStyle()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={modalStyle()}
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {/* 🔥 HEADER CORRIGIDO - BOTÃO DE REFRESH AO LADO DO TÍTULO */}
        <div style={headerRowStyle()}>
          <h2 style={titleStyle()}>
            🏅 TORNEIOS
            <button
              onClick={handleRefresh}
              style={refreshButtonStyle(isRefreshing)}
              disabled={isRefreshing}
              title="Atualizar lista"
            >
              {isRefreshing ? "⏳" : "🔄"}
            </button>
          </h2>
          <button onClick={onClose} style={closeButtonStyle()}>
            ✕
          </button>
        </div>

        {error && (
          <motion.div
            style={errorStyle()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            style={successStyle()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {success}
          </motion.div>
        )}

        {/* Criar Torneio */}
        <div style={createSectionStyle()}>
          <h3 style={subtitleStyle()}>🆕 Criar Torneio</h3>
          <div style={createFormStyle()}>
            <input
              type="text"
              placeholder="Nome do torneio"
              value={newTournament.name}
              onChange={(e) =>
                setNewTournament({ ...newTournament, name: e.target.value })
              }
              style={inputStyle()}
              disabled={creating}
            />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={newTournament.description}
              onChange={(e) =>
                setNewTournament({
                  ...newTournament,
                  description: e.target.value,
                })
              }
              style={inputStyle()}
              disabled={creating}
            />
            <div style={createRowStyle()}>
              <div style={createFieldStyle()}>
                <label style={labelStyle()}>Jogadores</label>
                <select
                  value={newTournament.maxPlayers}
                  onChange={(e) =>
                    setNewTournament({
                      ...newTournament,
                      maxPlayers: parseInt(e.target.value),
                    })
                  }
                  style={selectStyle()}
                  disabled={creating}
                >
                  {[4, 8, 12, 16, 20, 30, 40, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div style={createFieldStyle()}>
                <label style={labelStyle()}>Buy-in</label>
                <select
                  value={newTournament.buyIn}
                  onChange={(e) =>
                    setNewTournament({
                      ...newTournament,
                      buyIn: parseInt(e.target.value),
                    })
                  }
                  style={selectStyle()}
                  disabled={creating}
                >
                  {[50, 100, 200, 500, 1000].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <motion.button
              onClick={handleCreateTournament}
              style={createButtonStyle()}
              disabled={creating}
              whileHover={{ scale: creating ? 1 : 1.02 }}
              whileTap={{ scale: creating ? 1 : 0.98 }}
            >
              {creating ? "⏳ Criando..." : "🆕 Criar Torneio"}
            </motion.button>
          </div>
        </div>

        <div style={dividerStyle()} />

        {/* Lista de Torneios */}
        <div style={tournamentsListStyle()}>
          <h3 style={subtitleStyle()}>📋 Torneios Ativos</h3>
          {tournaments.length === 0 ? (
            <p style={emptyStyle()}>
              Nenhum torneio ativo no momento. Crie um!
            </p>
          ) : (
            tournaments.map((tournament) => {
              const isJoined = tournament.players?.some(
                (p) => p.username === username,
              );
              const isCreator = tournament.createdBy === username;
              const canStart =
                isCreator &&
                tournament.status === "waiting" &&
                tournament.players?.length >= tournament.minPlayers;
              const isActive = tournament.status === "active";
              const canEnterGame = isActive && isJoined;
              const canEditDelete =
                isCreator && tournament.status === "waiting";

              return (
                <motion.div
                  key={tournament._id}
                  style={tournamentItemStyle(
                    tournament.status === "active" ? "#ff9800" : "#4caf50",
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div style={tournamentHeaderStyle()}>
                    <span style={tournamentNameStyle()}>
                      {tournament.name}
                      {isCreator && (
                        <span style={creatorBadgeStyle()}>👑 Criador</span>
                      )}
                    </span>
                    <span style={tournamentStatusStyle(tournament.status)}>
                      {tournament.status === "waiting"
                        ? "🟢 Aguardando"
                        : tournament.status === "active"
                          ? "🟡 Em andamento"
                          : "🔴 Finalizado"}
                    </span>
                  </div>
                  <div style={tournamentInfoStyle()}>
                    <span>
                      👥 {tournament.players?.length || 0}/
                      {tournament.maxPlayers}
                    </span>
                    <span>💰 ${tournament.buyIn}</span>
                    <span>🏆 ${tournament.prizePool || 0}</span>
                    <span>📅 {formatDate(tournament.createdAt)}</span>
                  </div>
                  {tournament.description && (
                    <div style={tournamentDescStyle()}>
                      {tournament.description}
                    </div>
                  )}
                  <div style={tournamentActionsStyle()}>
                    {tournament.status === "waiting" && (
                      <>
                        {!isJoined ? (
                          <motion.button
                            onClick={() => handleJoinTournament(tournament._id)}
                            style={joinButtonStyle()}
                            disabled={joinLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {joinLoading ? "⏳" : "🔗 Participar"}
                          </motion.button>
                        ) : (
                          <span style={joinedStyle()}>✅ Inscrito</span>
                        )}
                        {canStart && (
                          <motion.button
                            onClick={() =>
                              handleStartTournament(tournament._id)
                            }
                            style={startButtonStyle()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            🚀 Iniciar
                          </motion.button>
                        )}
                      </>
                    )}
                    {isActive && (
                      <>
                        {canEnterGame ? (
                          <motion.button
                            onClick={() => handleEnterGame(tournament)}
                            style={enterGameButtonStyle()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            🎯 Entrar no Jogo
                          </motion.button>
                        ) : (
                          <span style={activeStyle()}>
                            {isJoined ? "⏳ Aguardando" : "🔥 Em andamento"}
                          </span>
                        )}
                      </>
                    )}
                    {canEditDelete && (
                      <div style={adminActionsStyle()}>
                        <motion.button
                          onClick={() => handleEditTournament(tournament)}
                          style={editButtonStyle()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Editar torneio"
                        >
                          ✏️ Editar
                        </motion.button>
                        <motion.button
                          onClick={() =>
                            handleDeleteTournament(
                              tournament._id,
                              tournament.name,
                            )
                          }
                          style={deleteButtonStyle()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Deletar torneio"
                        >
                          🗑️ Deletar
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <motion.button
          onClick={onClose}
          style={closeModalButtonStyle()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          FECHAR
        </motion.button>
      </motion.div>

      {/* 🔥 MODAL DE EDIÇÃO */}
      {editingTournament && (
        <div
          style={editOverlayStyle()}
          onClick={() => setEditingTournament(null)}
        >
          <div style={editModalStyle()} onClick={(e) => e.stopPropagation()}>
            <h3 style={subtitleStyle()}>✏️ Editar Torneio</h3>
            <div style={createFormStyle()}>
              <input
                type="text"
                placeholder="Nome do torneio"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                style={inputStyle()}
              />
              <input
                type="text"
                placeholder="Descrição (opcional)"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                style={inputStyle()}
              />
              <div style={createRowStyle()}>
                <div style={createFieldStyle()}>
                  <label style={labelStyle()}>Jogadores</label>
                  <select
                    value={editForm.maxPlayers}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        maxPlayers: parseInt(e.target.value),
                      })
                    }
                    style={selectStyle()}
                  >
                    {[4, 8, 12, 16, 20, 30, 40, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={createFieldStyle()}>
                  <label style={labelStyle()}>Buy-in</label>
                  <select
                    value={editForm.buyIn}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        buyIn: parseInt(e.target.value),
                      })
                    }
                    style={selectStyle()}
                  >
                    {[50, 100, 200, 500, 1000].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={editButtonsStyle()}>
                <motion.button
                  onClick={handleSaveEdit}
                  style={saveEditButtonStyle()}
                  disabled={creating}
                  whileHover={{ scale: creating ? 1 : 1.02 }}
                  whileTap={{ scale: creating ? 1 : 0.98 }}
                >
                  {creating ? "⏳ Salvando..." : "💾 Salvar"}
                </motion.button>
                <motion.button
                  onClick={() => setEditingTournament(null)}
                  style={cancelEditButtonStyle()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ❌ Cancelar
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ====================== ESTILOS ======================
function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: 20,
    backdropFilter: "blur(8px)",
  };
}

function modalStyle() {
  return {
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "30px 35px",
    borderRadius: 30,
    maxWidth: 600,
    width: "100%",
    maxHeight: "85vh",
    overflowY: "auto",
    color: "white",
    border: "2px solid gold",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  };
}

// 🔥 CLOSE BUTTON CORRIGIDO
function closeButtonStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    border: "none",
    color: "white",
    fontSize: "1.3rem",
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

// 🔥 HEADER CORRIGIDO
function headerRowStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  };
}

// 🔥 TITLE CORRIGIDO COM O BOTÃO DE REFRESH
function titleStyle() {
  return {
    color: "gold",
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "800",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };
}

// 🔥 REFRESH BUTTON CORRIGIDO (MENOR E AO LADO DO TÍTULO)
function refreshButtonStyle(isRefreshing) {
  return {
    background: isRefreshing
      ? "rgba(255,255,255,0.05)"
      : "rgba(255,215,0,0.15)",
    border: "1px solid rgba(255,215,0,0.2)",
    borderRadius: "50%",
    width: 32,
    height: 32,
    color: isRefreshing ? "#666" : "gold",
    cursor: isRefreshing ? "not-allowed" : "pointer",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
  };
}

function subtitleStyle() {
  return {
    color: "#ffd700",
    fontSize: "1.1rem",
    margin: "0 0 10px",
  };
}

function errorStyle() {
  return {
    padding: "10px",
    marginBottom: "15px",
    background: "rgba(244,67,54,0.15)",
    border: "1px solid #f44336",
    borderRadius: 10,
    color: "#f44336",
    textAlign: "center",
  };
}

function successStyle() {
  return {
    padding: "10px",
    marginBottom: "15px",
    background: "rgba(76,175,80,0.15)",
    border: "1px solid #4caf50",
    borderRadius: 10,
    color: "#4caf50",
    textAlign: "center",
  };
}

function createSectionStyle() {
  return {
    background: "rgba(255,255,255,0.03)",
    borderRadius: 15,
    padding: "15px",
    marginBottom: "15px",
  };
}

function createFormStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };
}

function createRowStyle() {
  return {
    display: "flex",
    gap: "10px",
  };
}

function createFieldStyle() {
  return {
    flex: 1,
  };
}

function labelStyle() {
  return {
    display: "block",
    fontSize: "0.7rem",
    color: "#888",
    marginBottom: "4px",
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: "0.85rem",
    outline: "none",
    transition: "border-color 0.3s ease",
  };
}

function selectStyle() {
  return {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: "0.85rem",
    outline: "none",
  };
}

function createButtonStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    padding: "10px",
    borderRadius: 30,
    color: "#2e241f",
    cursor: "pointer",
    width: "100%",
    transition: "all 0.3s ease",
  };
}

function dividerStyle() {
  return {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    margin: "15px 0",
  };
}

function tournamentsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "300px",
    overflowY: "auto",
  };
}

function emptyStyle() {
  return {
    textAlign: "center",
    color: "#888",
    padding: "20px 0",
  };
}

function tournamentItemStyle(statusColor) {
  return {
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${statusColor}33`,
    borderRadius: 12,
    padding: "12px 15px",
  };
}

function tournamentHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
    flexWrap: "wrap",
    gap: "4px",
  };
}

function tournamentNameStyle() {
  return {
    fontWeight: "bold",
    fontSize: "1rem",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  };
}

function creatorBadgeStyle() {
  return {
    fontSize: "0.55rem",
    color: "gold",
    background: "rgba(255,215,0,0.15)",
    padding: "1px 8px",
    borderRadius: 10,
  };
}

function tournamentStatusStyle(status) {
  const colors = {
    waiting: "#4caf50",
    active: "#ff9800",
    finished: "#666",
    cancelled: "#f44336",
  };
  return {
    fontSize: "0.65rem",
    color: colors[status] || "#888",
    background: `${colors[status] || "#888"}22`,
    padding: "2px 10px",
    borderRadius: 10,
  };
}

function tournamentInfoStyle() {
  return {
    display: "flex",
    gap: "15px",
    fontSize: "0.75rem",
    color: "#aaa",
    flexWrap: "wrap",
  };
}

function tournamentDescStyle() {
  return {
    fontSize: "0.75rem",
    color: "#888",
    marginTop: "4px",
    fontStyle: "italic",
  };
}

function tournamentActionsStyle() {
  return {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  };
}

function joinButtonStyle() {
  return {
    background: "rgba(76,175,80,0.2)",
    border: "1px solid #4caf50",
    borderRadius: 15,
    padding: "4px 14px",
    color: "#4caf50",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}

function startButtonStyle() {
  return {
    background: "rgba(255,152,0,0.2)",
    border: "1px solid #ff9800",
    borderRadius: 15,
    padding: "4px 14px",
    color: "#ff9800",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}

function enterGameButtonStyle() {
  return {
    background: "rgba(76,175,80,0.3)",
    border: "1px solid #4caf50",
    borderRadius: 15,
    padding: "4px 14px",
    color: "#4caf50",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "bold",
  };
}

function adminActionsStyle() {
  return {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  };
}

function editButtonStyle() {
  return {
    background: "rgba(33,150,243,0.2)",
    border: "1px solid #2196f3",
    borderRadius: 15,
    padding: "3px 12px",
    color: "#2196f3",
    fontSize: "0.7rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}

function deleteButtonStyle() {
  return {
    background: "rgba(244,67,54,0.2)",
    border: "1px solid #f44336",
    borderRadius: 15,
    padding: "3px 12px",
    color: "#f44336",
    fontSize: "0.7rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}

function joinedStyle() {
  return {
    fontSize: "0.75rem",
    color: "#4caf50",
  };
}

function activeStyle() {
  return {
    fontSize: "0.75rem",
    color: "#ff9800",
  };
}

function closeModalButtonStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "1rem",
    padding: "12px 30px",
    borderRadius: 60,
    cursor: "pointer",
    boxShadow: "0 4px 0 #7a4c1a",
    color: "#2e241f",
    width: "100%",
    marginTop: "15px",
    transition: "all 0.3s ease",
  };
}

function loadingContainerStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  };
}

function loadingSpinnerStyle() {
  return {
    fontSize: "4rem",
    marginBottom: "20px",
  };
}

function loadingTextStyle() {
  return {
    color: "#aaa",
    fontSize: "1rem",
  };
}

// 🔥 ESTILOS DO MODAL DE EDIÇÃO
function editOverlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: 20,
    backdropFilter: "blur(4px)",
  };
}

function editModalStyle() {
  return {
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "30px",
    borderRadius: 25,
    maxWidth: 500,
    width: "100%",
    color: "white",
    border: "2px solid gold",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  };
}

function editButtonsStyle() {
  return {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  };
}

function saveEditButtonStyle() {
  return {
    flex: 1,
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    padding: "10px",
    borderRadius: 30,
    color: "#2e241f",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}

function cancelEditButtonStyle() {
  return {
    flex: 1,
    background: "rgba(244,67,54,0.2)",
    border: "1px solid #f44336",
    borderRadius: 30,
    padding: "10px",
    color: "#f44336",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  };
}

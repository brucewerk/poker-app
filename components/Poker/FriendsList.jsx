// components/Poker/FriendsList.jsx - CONVITE FLUTUANTE + FEEDBACKS CLICÁVEIS + FILA DE CONVITES
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

export default function FriendsList({ username, onJoinGame }) {
  // ============================================================
  // 🔥 TODOS OS HOOKS NO TOPO
  // ============================================================

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFriends, setShowFriends] = useState(false);
  const [newFriend, setNewFriend] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [selectedChatFriend, setSelectedChatFriend] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [unreadChats, setUnreadChats] = useState({});
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isWaitingForAccept, setIsWaitingForAccept] = useState(false);
  const [pendingInviteId, setPendingInviteId] = useState(null);
  const [isInLobby, setIsInLobby] = useState(false);
  const [isProcessingInvite, setIsProcessingInvite] = useState(false);

  // 🔥 CONVITE FLUTUANTE (COM BOTÕES)
  const [floatingInvite, setFloatingInvite] = useState(null);
  const [showFloatingInvite, setShowFloatingInvite] = useState(false);
  const [pendingInviteQueue, setPendingInviteQueue] = useState([]); // 🔥 FILA DE CONVITES

  // 🔥 FEEDBACKS NO CARD
  const [cardFeedback, setCardFeedback] = useState(null);
  const [feedbackIsClickable, setFeedbackIsClickable] = useState(false);
  const [feedbackClickAction, setFeedbackClickAction] = useState(null);
  const cardFeedbackTimerRef = useRef(null);

  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const isMounted = useRef(true);
  const onlineUsersRef = useRef([]);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const redirectTimeoutRef = useRef(null);
  const isChatOpenRef = useRef(false);
  const messagesContainerRef = useRef(null);
  const previousOnJoinGameRef = useRef(null);
  const resettingRef = useRef(false);
  const currentRoomIdRef = useRef(null);

  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

  // ============================================================
  // 🔥 useMemo - CALCULAR TOTAL DE NÃO LIDAS
  // ============================================================
  const totalUnread = useMemo(() => {
    return Object.values(unreadChats).reduce((a, b) => a + b, 0);
  }, [unreadChats]);

  // ============================================================
  // 🔥 useMemo - LISTA DE AMIGOS ORDENADA
  // ============================================================
  const sortedFriends = useMemo(
    () => [...friends].sort((a, b) => b.chips - a.chips),
    [friends],
  );

  // ============================================================
  // 🔥 FUNÇÃO PARA ROLAR PARA O FINAL DO CHAT
  // ============================================================
  const scrollChatToBottom = useCallback(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      return;
    }

    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // ============================================================
  // 🔥 FUNÇÃO PARA MOSTRAR FEEDBACK NO CARD (CLICÁVEL OU NÃO)
  // ============================================================
  const showCardFeedback = useCallback(
    (
      message,
      isError = false,
      duration = 5000,
      clickable = false,
      onClick = null,
    ) => {
      if (cardFeedbackTimerRef.current) {
        clearTimeout(cardFeedbackTimerRef.current);
        cardFeedbackTimerRef.current = null;
      }

      setCardFeedback({ message, isError });
      setFeedbackIsClickable(clickable);
      setFeedbackClickAction(() => onClick);

      cardFeedbackTimerRef.current = setTimeout(() => {
        setCardFeedback(null);
        setFeedbackIsClickable(false);
        setFeedbackClickAction(null);
        cardFeedbackTimerRef.current = null;
      }, duration);
    },
    [],
  );

  // ============================================================
  // 🔥 FUNÇÃO PARA MOSTRAR CONVITE FLUTUANTE
  // ============================================================
  const showFloatingInviteCard = useCallback(
    (inviteData) => {
      // 🔥 Se o chat estiver aberto, adicionar à fila
      if (isChatOpenRef.current) {
        console.log("📥 Chat aberto, convite adicionado à fila");
        setPendingInviteQueue((prev) => [...prev, inviteData]);
        showCardFeedback(
          `🎯 Novo convite de ${inviteData.from} (aguardando...`,
          false,
          4000,
        );
        return;
      }

      setFloatingInvite(inviteData);
      setShowFloatingInvite(true);
    },
    [isChatOpenRef, showCardFeedback],
  );

  const closeFloatingInvite = useCallback(() => {
    setShowFloatingInvite(false);
    setTimeout(() => setFloatingInvite(null), 300);

    // 🔥 Verificar se há convites na fila
    if (pendingInviteQueue.length > 0) {
      setTimeout(() => {
        const nextInvite = pendingInviteQueue[0];
        setPendingInviteQueue((prev) => prev.slice(1));
        showFloatingInviteCard(nextInvite);
      }, 500);
    }
  }, [pendingInviteQueue, showFloatingInviteCard]);

  // ============================================================
  // 🔥 FUNÇÃO PARA RESETAR ESTADO DO LOBBY
  // ============================================================
  const resetLobbyState = useCallback(() => {
    if (resettingRef.current) {
      console.log("🔄 Reset já em andamento, ignorando...");
      return;
    }

    resettingRef.current = true;
    console.log(`🔄 Resetando estado do lobby para ${username}`);

    setIsInLobby(false);
    setIsWaitingForAccept(false);
    setPendingInviteId(null);
    setIsProcessingInvite(false);
    currentRoomIdRef.current = null;
    closeFloatingInvite();
    setPendingInviteQueue([]);

    setTimeout(() => {
      resettingRef.current = false;
    }, 300);
  }, [username, closeFloatingInvite]);

  // ============================================================
  // 🔥 FUNÇÃO PARA ABRIR CHAT E LIMPAR FEEDBACK
  // ============================================================
  const openChat = useCallback(
    (friendUsername) => {
      setSelectedChatFriend(friendUsername);
      setShowChat(true);
      isChatOpenRef.current = true;

      // 🔥 Limpar feedbacks
      setCardFeedback(null);
      setFeedbackIsClickable(false);
      setFeedbackClickAction(null);
      if (cardFeedbackTimerRef.current) {
        clearTimeout(cardFeedbackTimerRef.current);
        cardFeedbackTimerRef.current = null;
      }

      // 🔥 Limpar não lidas
      setUnreadChats((prev) => {
        const newUnread = { ...prev };
        delete newUnread[friendUsername];
        return newUnread;
      });

      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
        scrollChatToBottom();
      }, 200);
    },
    [scrollChatToBottom],
  );

  // ============================================================
  // 🔥 useEffect - DETECTAR SAÍDA DO MULTIPLAYER
  // ============================================================
  useEffect(() => {
    if (previousOnJoinGameRef.current !== null && onJoinGame === null) {
      console.log(`🔄 Detectada saída do multiplayer, resetando estado...`);
      resetLobbyState();
    }
    previousOnJoinGameRef.current = onJoinGame;
  }, [onJoinGame, resetLobbyState]);

  // ============================================================
  // 🔥 useEffect - CONECTAR AO SOCKET
  // ============================================================
  useEffect(() => {
    if (!username) return;

    console.log(`🔵 FriendsList: Conectando ao Socket.IO para ${username}`);

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
      console.log(`🟢 FriendsList: Socket conectado (${socket.id})`);
      setIsConnected(true);
      socket.emit("friend-online", { username });
    });

    socket.on("disconnect", () => {
      console.log(`🔴 FriendsList: Socket desconectado`);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error(`❌ FriendsList: Erro de conexão:`, err.message);
      setIsConnected(false);
      showCardFeedback("⚠️ Erro de conexão com o servidor", true, 5000);
    });

    socket.on("friends-online", (data) => {
      console.log("📡 Friends online recebido:", data);
      const onlineList = data.online || [];
      onlineUsersRef.current = onlineList;

      setFriends((prevFriends) => {
        const updated = prevFriends.map((friend) => ({
          ...friend,
          isOnline: onlineList.includes(friend.username),
        }));

        const online = updated.filter((f) => f.isOnline);
        setOnlineFriends(online);

        return updated;
      });
    });

    socket.on("room-created", (data) => {
      console.log("📡 Sala criada com sucesso:", data);
      setIsCreatingRoom(false);
      console.log(`✅ Sala ${data.roomId} criada!`);
      currentRoomIdRef.current = data.roomId;
      showCardFeedback(`✅ Sala ${data.roomId} criada!`, false, 3000);

      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    });

    // 🔥 RECEBER CONVITE - FLUTUANTE (com fila)
    socket.on("group-invite", (data) => {
      if (isProcessingInvite) {
        console.log("📡 Já processando um convite, ignorando...");
        return;
      }

      if (isInLobby) {
        console.log("📡 Convite recebido mas usuário está no lobby, ignorando");
        return;
      }

      console.log("📡 Convite em grupo recebido:", data);

      const inviteData = {
        inviteId: data.inviteId,
        from: data.from,
        players: data.players || [],
        roomId: data.roomId || `ROOM_${data.inviteId}`,
        message: data.message || `${data.from} te convidou para uma partida!`,
      };

      // 🔥 Se o chat estiver aberto, enfileirar
      if (isChatOpenRef.current) {
        setPendingInviteQueue((prev) => [...prev, inviteData]);
        showCardFeedback(
          `🎯 ${data.from} te convidou! (clique no chat para ver)`,
          false,
          4000,
          false,
        );
        return;
      }

      showFloatingInviteCard(inviteData);

      setPendingInvites((prev) => {
        const exists = prev.some((n) => n.inviteId === data.inviteId);
        if (exists) return prev;
        return [
          {
            ...inviteData,
            id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            accepted: [],
            declined: [],
            timestamp: new Date(),
          },
          ...prev.slice(0, 4),
        ];
      });
    });

    // 🔥 CONVITE ACEITO - FEEDBACK NO CARD
    socket.on("invite-accepted", (data) => {
      console.log("📡 Convite aceito:", data);

      if (data.from !== username) {
        console.log(`🎯 ${data.from} aceitou o convite!`);
        showCardFeedback(`✅ ${data.from} aceitou o convite!`, false, 3000);

        const inviteData = pendingInvites.find(
          (n) => n.inviteId === data.inviteId,
        );

        if (inviteData && onJoinGame) {
          const roomId = inviteData.roomId || `ROOM_${data.inviteId}`;

          socket.emit("join-room", {
            roomId: roomId,
            playerName: username,
          });
          currentRoomIdRef.current = roomId;

          setTimeout(() => {
            onJoinGame({
              roomId: roomId,
              playerName: username,
              socket: socket,
              invitedPlayers: inviteData.players || [],
              isInviteCreator: true,
            });
          }, 500);

          setPendingInvites((prev) =>
            prev.filter((n) => n.inviteId !== data.inviteId),
          );
          setIsWaitingForAccept(false);
          setPendingInviteId(null);
          closeFloatingInvite();
        }
      } else {
        showCardFeedback(`✅ Convite aceito! Entrando na sala...`, false, 2000);
        closeFloatingInvite();
      }
    });

    // 🔥 CONVITE RECUSADO - FEEDBACK NO CARD
    socket.on("invite-declined", (data) => {
      console.log("📡 Convite recusado:", data);

      if (data.from !== username) {
        showCardFeedback(`❌ ${data.from} recusou o convite.`, true, 3000);
        setPendingInvites((prev) =>
          prev.filter((n) => n.inviteId !== data.inviteId),
        );
      } else {
        showCardFeedback(`❌ Convite recusado`, true, 2000);
        closeFloatingInvite();
      }
    });

    socket.on("invite-sent", (data) => {
      console.log("📡 Convite enviado:", data);
      if (data.success) {
        setSuccess(`✅ Convites enviados para ${data.players?.join(", ")}!`);
        setIsWaitingForAccept(true);
        setPendingInviteId(data.inviteId);
        showCardFeedback(
          `✅ Convites enviados! Aguardando resposta...`,
          false,
          4000,
        );
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(`❌ ${data.error || "Erro ao enviar convites"}`);
        setIsWaitingForAccept(false);
        showCardFeedback(
          `❌ ${data.error || "Erro ao enviar convites"}`,
          true,
          3000,
        );
        setTimeout(() => setError(""), 3000);
      }
    });

    // 🔥 MENSAGEM PRIVADA - FEEDBACK CLICÁVEL
    socket.on("private-message", (data) => {
      console.log(
        `📡 Mensagem privada recebida de ${data.from}:`,
        data.message,
      );

      setChatMessages((prev) => {
        const friendMessages = prev[data.from] || [];
        return {
          ...prev,
          [data.from]: [
            ...friendMessages,
            {
              from: data.from,
              message: data.message,
              timestamp: new Date(),
              isOwn: false,
            },
          ],
        };
      });

      if (selectedChatFriend !== data.from || !showChat) {
        setUnreadChats((prev) => ({
          ...prev,
          [data.from]: (prev[data.from] || 0) + 1,
        }));

        // 🔥 Feedback clicável - ao clicar abre o chat
        showCardFeedback(
          `💬 Nova mensagem de ${data.from} (clique para abrir)`,
          false,
          6000,
          true,
          () => openChat(data.from),
        );
      } else {
        setTimeout(() => scrollChatToBottom(), 100);
      }
    });

    socket.on("room-update", (data) => {
      if (data && data.players && !resettingRef.current) {
        const playerInRoom = data.players.some((p) => p.name === username);
        if (!playerInRoom && isInLobby) {
          console.log(
            `🔄 ${username} saiu da sala (room-update), resetando estado...`,
          );
          resetLobbyState();
          showCardFeedback(`👋 Você saiu da sala`, false, 2000);
        }
        if (playerInRoom && data.roomId) {
          currentRoomIdRef.current = data.roomId;
        }
      }
    });

    socket.on("leave-room-response", (data) => {
      if (
        data &&
        data.roomId &&
        data.playerName === username &&
        !resettingRef.current
      ) {
        console.log(
          `🔄 ${username} confirmou saída da sala ${data.roomId}, resetando estado...`,
        );
        currentRoomIdRef.current = null;
        resetLobbyState();
        showCardFeedback(`👋 Você saiu da sala`, false, 2000);
      }
    });

    socket.on("game-reset", (data) => {
      if (!resettingRef.current) {
        console.log(
          `🔄 Jogo resetado, resetando estado do lobby para ${username}`,
        );
        resetLobbyState();
        showCardFeedback(`🔄 Jogo resetado!`, false, 2000);
      }
    });

    socket.on("error", (data) => {
      if (data.message && data.message.includes("Sala não encontrada")) {
        console.log(`⚠️ Sala não encontrada: ${data.message}`);
        if (isInLobby && !resettingRef.current) {
          console.log(`🔄 Resetando estado do lobby (sala não encontrada)`);
          resetLobbyState();
        }
        showCardFeedback(`⚠️ ${data.message}`, true, 4000);
        return;
      }

      console.error("❌ Erro do servidor (FriendsList):", data);
      showCardFeedback(`❌ ${data.message || "Erro desconhecido"}`, true, 4000);
    });

    if (socket.connected) {
      socket.emit("friend-online", { username });
      setIsConnected(true);
    }

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("friends-online");
      socket.off("group-invite");
      socket.off("invite-accepted");
      socket.off("invite-declined");
      socket.off("invite-sent");
      socket.off("private-message");
      socket.off("room-created");
      socket.off("room-update");
      socket.off("leave-room-response");
      socket.off("game-reset");
      socket.off("error");

      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
      if (cardFeedbackTimerRef.current) {
        clearTimeout(cardFeedbackTimerRef.current);
        cardFeedbackTimerRef.current = null;
      }
    };
  }, [
    username,
    onJoinGame,
    pendingInvites,
    scrollChatToBottom,
    selectedChatFriend,
    showChat,
    isInLobby,
    resetLobbyState,
    isProcessingInvite,
    showCardFeedback,
    showFloatingInviteCard,
    closeFloatingInvite,
    openChat,
    isChatOpenRef,
  ]);

  // ============================================================
  // 🔥 useEffect - BUSCAR AMIGOS
  // ============================================================
  const fetchFriends = useCallback(
    async (silent = false) => {
      if (!username || !isMounted.current) return;

      try {
        if (!silent) setLoading(true);
        setError("");
        const res = await fetch(
          `/api/friends?username=${encodeURIComponent(username)}`,
          {
            credentials: "include",
          },
        );
        const data = await res.json();

        if (data.success && isMounted.current) {
          const validFriends = (data.friends || []).map((friend) => ({
            username: friend.username || "Desconhecido",
            level: friend.level || 1,
            chips: friend.chips || 0,
            isOnline: false,
            isInGame: false,
            lastSeen: null,
            selected: false,
          }));

          const onlineNames = onlineUsersRef.current;
          const updatedFriends = validFriends.map((f) => ({
            ...f,
            isOnline: onlineNames.includes(f.username),
          }));

          setFriends(updatedFriends);
          setOnlineFriends(updatedFriends.filter((f) => f.isOnline));

          if (!silent) {
            console.info(`✅ ${validFriends.length} amigos carregados`);
            console.info(
              `🟢 ${updatedFriends.filter((f) => f.isOnline).length} amigos online`,
            );
          }
        } else {
          if (!silent)
            console.info(`ℹ️ ${data.error || "Erro ao carregar amigos"}`);
          setFriends([]);
        }
      } catch (error) {
        console.debug("🔍 Erro de rede ao carregar amigos:", error);
        setFriends([]);
      } finally {
        if (!silent && isMounted.current) setLoading(false);
      }
    },
    [username],
  );

  // ============================================================
  // 🔥 useEffect - CARREGAR AMIGOS INICIALMENTE
  // ============================================================
  useEffect(() => {
    isMounted.current = true;
    if (username) {
      fetchFriends();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [username, fetchFriends]);

  // ============================================================
  // 🔥 useEffect - POLLING
  // ============================================================
  useEffect(() => {
    if (!username) return;

    intervalRef.current = setInterval(() => {
      if (isMounted.current && username) {
        fetchFriends(true);
      }
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [username, fetchFriends]);

  // ============================================================
  // 🔥 useEffect - ROLAGEM AUTOMÁTICA DO CHAT
  // ============================================================
  useEffect(() => {
    if (showChat && selectedChatFriend) {
      const messages = chatMessages[selectedChatFriend] || [];
      if (messages.length > 0) {
        setTimeout(() => scrollChatToBottom(), 150);
      }
    }
  }, [chatMessages, selectedChatFriend, showChat, scrollChatToBottom]);

  // ============================================================
  // 🔥 useEffect - LIMPAR FEEDBACK QUANDO CHAT ABRE
  // ============================================================
  useEffect(() => {
    if (showChat) {
      // 🔥 Limpar feedbacks quando o chat abre
      setCardFeedback(null);
      setFeedbackIsClickable(false);
      setFeedbackClickAction(null);
      if (cardFeedbackTimerRef.current) {
        clearTimeout(cardFeedbackTimerRef.current);
        cardFeedbackTimerRef.current = null;
      }
    }
  }, [showChat]);

  // ============================================================
  // 🔥 useCallback - SELECIONAR/DESELECIONAR AMIGO
  // ============================================================
  const toggleFriendSelection = useCallback((friendUsername) => {
    setFriends((prev) =>
      prev.map((f) =>
        f.username === friendUsername ? { ...f, selected: !f.selected } : f,
      ),
    );

    setSelectedFriends((prev) => {
      if (prev.includes(friendUsername)) {
        return prev.filter((f) => f !== friendUsername);
      } else {
        return [...prev, friendUsername];
      }
    });
  }, []);

  // ============================================================
  // 🔥 useCallback - ACEITAR CONVITE
  // ============================================================
  const acceptGroupInvite = useCallback(
    (inviteId) => {
      if (isProcessingInvite) {
        console.log("⏳ Já processando um convite, aguarde...");
        return;
      }

      if (!socketRef.current || !isConnected) {
        showCardFeedback("❌ Servidor não disponível", true, 3000);
        return;
      }

      console.log(`✅ Aceitando convite: ${inviteId}`);

      const inviteData =
        pendingInvites.find((n) => n.inviteId === inviteId) ||
        (floatingInvite && floatingInvite.inviteId === inviteId
          ? floatingInvite
          : null);

      if (!inviteData) {
        showCardFeedback("❌ Convite não encontrado", true, 3000);
        return;
      }

      const roomId = inviteData.roomId || `ROOM_${inviteId}`;

      setIsProcessingInvite(true);
      closeFloatingInvite();

      if (isInLobby && currentRoomIdRef.current) {
        console.log(`📤 Saindo da sala atual: ${currentRoomIdRef.current}`);
        socketRef.current.emit("leave-room", {
          roomId: currentRoomIdRef.current,
        });
        setTimeout(() => {
          enterNewRoom(roomId, inviteData);
        }, 500);
      } else {
        enterNewRoom(roomId, inviteData);
      }
    },
    [
      username,
      isConnected,
      pendingInvites,
      floatingInvite,
      isInLobby,
      isProcessingInvite,
      closeFloatingInvite,
      showCardFeedback,
    ],
  );

  // ============================================================
  // 🔥 useCallback - RECUSAR CONVITE
  // ============================================================
  const declineGroupInvite = useCallback(
    (inviteId) => {
      if (isProcessingInvite) {
        console.log("⏳ Já processando um convite, aguarde...");
        return;
      }

      if (!socketRef.current || !isConnected) {
        showCardFeedback("❌ Servidor não disponível", true, 3000);
        return;
      }

      console.log(`❌ Recusando convite: ${inviteId}`);
      socketRef.current.emit("decline-invite", {
        inviteId,
        from: username,
      });

      const inviteData = pendingInvites.find((n) => n.inviteId === inviteId);
      if (inviteData) {
        setPendingInvites((prev) =>
          prev.filter((n) => n.inviteId !== inviteId),
        );
      }

      closeFloatingInvite();
      showCardFeedback(`❌ Convite recusado`, true, 2000);
    },
    [
      username,
      isConnected,
      pendingInvites,
      isProcessingInvite,
      closeFloatingInvite,
      showCardFeedback,
    ],
  );

  // 🔥 FUNÇÃO AUXILIAR PARA ENTRAR NA NOVA SALA
  const enterNewRoom = useCallback(
    (roomId, inviteData) => {
      console.log(`📤 Entrando na nova sala ${roomId}...`);

      setIsInLobby(true);
      currentRoomIdRef.current = roomId;

      socketRef.current.emit("join-room", {
        roomId: roomId,
        playerName: username,
      });

      socketRef.current.emit("accept-invite", {
        inviteId: inviteData.inviteId,
        from: username,
      });

      setPendingInvites((prev) =>
        prev.filter((n) => n.inviteId !== inviteData.inviteId),
      );
      setIsProcessingInvite(false);

      if (onJoinGame) {
        setTimeout(() => {
          onJoinGame({
            roomId: roomId,
            playerName: username,
            socket: socketRef.current,
            invitedPlayers: inviteData.players || [],
            isInviteAccepted: true,
          });
        }, 500);
      }
    },
    [username, onJoinGame],
  );

  // ============================================================
  // 🔥 useCallback - ENVIAR CONVITES MÚLTIPLOS
  // ============================================================
  const sendGroupInvite = useCallback(() => {
    if (selectedFriends.length === 0) {
      showCardFeedback("❌ Selecione pelo menos um amigo!", true, 3000);
      return;
    }

    if (!socketRef.current || !isConnected) {
      showCardFeedback("❌ Servidor não disponível", true, 3000);
      return;
    }

    const inviteId = `invite_${Date.now()}`;
    const roomId = `ROOM_${inviteId}`;

    const inviteData = {
      inviteId,
      from: username,
      players: selectedFriends,
      message: `🏆 ${username} está te convidando para uma partida de poker!`,
      roomId: roomId,
    };

    setPendingInvites((prev) => [
      ...prev,
      {
        ...inviteData,
        accepted: [username],
        declined: [],
        timestamp: new Date(),
      },
    ]);

    setIsCreatingRoom(true);
    setIsWaitingForAccept(true);
    setPendingInviteId(inviteId);
    setError("");
    setSuccess("");

    console.log(`📤 Criando sala ${roomId}...`);
    socketRef.current.emit("create-room", {
      playerName: username,
      maxPlayers: selectedFriends.length + 1,
      invitedPlayers: selectedFriends,
      roomId: roomId,
    });

    setTimeout(() => {
      console.log(`📤 Enviando convites...`);
      socketRef.current.emit("group-invite", inviteData);
    }, 500);

    setSelectedFriends([]);
    setFriends((prev) => prev.map((f) => ({ ...f, selected: false })));
    setShowInviteModal(false);

    showCardFeedback(
      `✅ Convites enviados! Aguardando resposta...`,
      false,
      4000,
    );

    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    redirectTimeoutRef.current = setTimeout(() => {
      setIsWaitingForAccept(false);
      setPendingInviteId(null);
      showCardFeedback(
        "⏰ Tempo esgotado. Ninguém aceitou o convite.",
        true,
        4000,
      );
      redirectTimeoutRef.current = null;
    }, 60000);
  }, [selectedFriends, username, isConnected, showCardFeedback]);

  // ============================================================
  // 🔥 useCallback - ADICIONAR AMIGO
  // ============================================================
  const addFriend = useCallback(async () => {
    const friendName = newFriend.trim();
    if (!friendName) {
      showCardFeedback("Digite o nome do amigo", true, 3000);
      return;
    }

    if (friendName.toLowerCase() === username?.toLowerCase()) {
      showCardFeedback(
        "❌ Você não pode adicionar a si mesmo como amigo!",
        true,
        3000,
      );
      return;
    }

    setError("");
    setSuccess("");
    setRefreshing(true);

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          friendUsername: friendName,
          action: "add",
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        showCardFeedback("Erro ao processar resposta do servidor", true, 3000);
        setRefreshing(false);
        return;
      }

      if (res.status === 401) {
        showCardFeedback(
          "❌ Você precisa estar logado para adicionar amigos",
          true,
          3000,
        );
        return;
      }

      if (data.success) {
        setNewFriend("");
        setSuccess(`✅ ${friendName} adicionado como amigo!`);
        await fetchFriends(false);
        setTimeout(() => setSuccess(""), 3000);
        showCardFeedback(
          `✅ ${friendName} adicionado como amigo!`,
          false,
          3000,
        );
      } else {
        const errorMsg = data.error || "Erro ao adicionar amigo";
        showCardFeedback(`❌ ${errorMsg}`, true, 3000);
      }
    } catch (error) {
      showCardFeedback("❌ Erro de conexão com o servidor", true, 3000);
    } finally {
      setRefreshing(false);
    }
  }, [newFriend, username, fetchFriends, showCardFeedback]);

  // ============================================================
  // 🔥 useCallback - REMOVER AMIGO
  // ============================================================
  const removeFriend = useCallback(
    async (friendUsername) => {
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
          await fetchFriends(false);
          setTimeout(() => setSuccess(""), 3000);
          showCardFeedback(
            `✅ ${friendUsername} removido com sucesso!`,
            false,
            3000,
          );
        } else {
          showCardFeedback(
            `❌ ${data.error || "Erro ao remover amigo"}`,
            true,
            3000,
          );
        }
      } catch (error) {
        showCardFeedback("❌ Erro de conexão com o servidor", true, 3000);
      }
    },
    [fetchFriends, showCardFeedback],
  );

  // ============================================================
  // 🔥 useCallback - FECHAR CHAT
  // ============================================================
  const closeChat = useCallback(() => {
    setShowChat(false);
    setSelectedChatFriend(null);
    isChatOpenRef.current = false;
    setChatInput("");

    // 🔥 Verificar se há convites na fila
    if (pendingInviteQueue.length > 0) {
      setTimeout(() => {
        const nextInvite = pendingInviteQueue[0];
        setPendingInviteQueue((prev) => prev.slice(1));
        showFloatingInviteCard(nextInvite);
      }, 300);
    }
  }, [pendingInviteQueue, showFloatingInviteCard]);

  // ============================================================
  // 🔥 useCallback - ENVIAR MENSAGEM
  // ============================================================
  const sendChatMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!chatInput.trim() || !selectedChatFriend) return;
      if (!socketRef.current || !isConnected) {
        showCardFeedback("❌ Servidor não disponível", true, 3000);
        return;
      }

      const message = chatInput.trim();
      setChatInput("");

      setChatMessages((prev) => {
        const friendMessages = prev[selectedChatFriend] || [];
        return {
          ...prev,
          [selectedChatFriend]: [
            ...friendMessages,
            {
              from: username,
              message: message,
              timestamp: new Date(),
              isOwn: true,
            },
          ],
        };
      });

      socketRef.current.emit("private-message", {
        to: selectedChatFriend,
        from: username,
        message: message,
      });

      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
        scrollChatToBottom();
      }, 100);
    },
    [
      chatInput,
      selectedChatFriend,
      username,
      isConnected,
      scrollChatToBottom,
      showCardFeedback,
    ],
  );

  // ============================================================
  // 🔥 useCallback - FECHAR MODAL DE CONVITE
  // ============================================================
  const closeInviteModal = useCallback(() => {
    setShowInviteModal(false);
    setSelectedFriends([]);
    setFriends((prev) => prev.map((f) => ({ ...f, selected: false })));
  }, []);

  // ============================================================
  // 🔥 COMPONENTE DE CHAT (useMemo)
  // ============================================================
  const ChatPanel = useMemo(() => {
    if (!showChat || !selectedChatFriend) return null;

    const messages = chatMessages[selectedChatFriend] || [];

    return (
      <motion.div
        style={chatOverlayStyle()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeChat}
      >
        <motion.div
          style={chatPanelStyle()}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={chatHeaderStyle()}>
            <span>💬 {selectedChatFriend}</span>
            <div style={chatHeaderRightStyle()}>
              <span style={chatMessageCountStyle()}>
                {messages.length} mensagens
              </span>
              <button onClick={closeChat} style={closeChatStyle()}>
                ✕
              </button>
            </div>
          </div>

          <div
            style={chatMessagesStyle()}
            ref={messagesContainerRef}
            id={`chat-messages-${selectedChatFriend}`}
          >
            {messages.length === 0 ? (
              <p style={emptyChatStyle()}>Nenhuma mensagem ainda</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={`chat_msg_${index}_${msg.timestamp}`}
                  style={chatMessageStyle(msg.isOwn)}
                >
                  <div style={chatMessageBubbleStyle(msg.isOwn)}>
                    <div style={chatMessageTextStyle()}>{msg.message}</div>
                    <div style={chatMessageTimeStyle(msg.isOwn)}>
                      {msg.timestamp?.toLocaleTimeString?.() || ""}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendChatMessage} style={chatInputFormStyle()}>
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Digite uma mensagem..."
              style={chatInputStyle()}
              maxLength={500}
            />
            <button type="submit" style={chatSendButtonStyle()}>
              Enviar
            </button>
          </form>
        </motion.div>
      </motion.div>
    );
  }, [
    showChat,
    selectedChatFriend,
    chatMessages,
    chatInput,
    sendChatMessage,
    closeChat,
  ]);

  // ============================================================
  // 🔥 COMPONENTE DE MODAL DE CONVITE
  // ============================================================
  const InviteModal = () => {
    if (!showInviteModal) return null;

    return (
      <div style={inviteOverlayStyle()} onClick={closeInviteModal}>
        <motion.div
          style={inviteModalStyle()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={inviteTitleStyle()}>🎯 Convidar Amigos</h3>
          <p style={inviteTextStyle()}>
            Selecione os amigos que deseja convidar:
          </p>

          <div style={friendSelectionStyle()}>
            {friends.filter((f) => f.isOnline).length === 0 ? (
              <p style={emptySelectionStyle()}>
                Nenhum amigo online no momento.
              </p>
            ) : (
              friends
                .filter((f) => f.isOnline)
                .map((friend) => (
                  <div
                    key={`select_${friend.username}`}
                    style={friendSelectItemStyle(friend.selected)}
                    onClick={() => toggleFriendSelection(friend.username)}
                  >
                    <span style={friendSelectCheckStyle()}>
                      {friend.selected ? "☑️" : "⬜"}
                    </span>
                    <span style={friendSelectNameStyle()}>
                      {friend.username}
                    </span>
                    <span style={friendSelectLevelStyle()}>
                      Nv. {friend.level}
                    </span>
                  </div>
                ))
            )}
          </div>

          <div style={inviteStatsStyle()}>
            <span>Selecionados: {selectedFriends.length}</span>
          </div>

          <div style={inviteButtonsStyle()}>
            <button
              onClick={sendGroupInvite}
              style={inviteSendStyle(
                selectedFriends.length > 0 && !isCreatingRoom,
              )}
              disabled={selectedFriends.length === 0 || isCreatingRoom}
            >
              {isCreatingRoom ? "⏳ Criando sala..." : "📤 Enviar Convites"}
            </button>
            <button onClick={closeInviteModal} style={inviteCancelStyle()}>
              ❌ Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // ============================================================
  // 🔥 COMPONENTE DE FEEDBACK NO CARD (CLICÁVEL)
  // ============================================================
  const CardFeedback = () => {
    if (!cardFeedback) return null;

    const handleClick = () => {
      if (feedbackIsClickable && feedbackClickAction) {
        feedbackClickAction();
      }
    };

    return (
      <motion.div
        style={{
          ...cardFeedbackStyle(cardFeedback.isError),
          cursor: feedbackIsClickable ? "pointer" : "default",
        }}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={handleClick}
        title={feedbackIsClickable ? "Clique para abrir o chat" : ""}
      >
        <span style={cardFeedbackIconStyle(cardFeedback.isError)}>
          {cardFeedback.isError ? "⚠️" : "💬"}
        </span>
        <span style={cardFeedbackTextStyle()}>{cardFeedback.message}</span>
        {feedbackIsClickable && (
          <span style={cardFeedbackClickHintStyle()}>👆</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCardFeedback(null);
            setFeedbackIsClickable(false);
            setFeedbackClickAction(null);
          }}
          style={cardFeedbackCloseStyle()}
        >
          ✕
        </button>
      </motion.div>
    );
  };

  // ============================================================
  // 🔥 COMPONENTE DE CONVITE FLUTUANTE
  // ============================================================
  const FloatingInvite = () => {
    if (!showFloatingInvite || !floatingInvite) return null;

    return (
      <motion.div
        style={floatingInviteOverlayStyle()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeFloatingInvite}
      >
        <motion.div
          style={floatingInviteCardStyle()}
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={floatingInviteHeaderStyle()}>
            <span style={floatingInviteIconStyle()}>🎯</span>
            <span style={floatingInviteTitleStyle()}>
              Convite para Partida!
            </span>
            <button
              onClick={closeFloatingInvite}
              style={floatingInviteCloseStyle()}
            >
              ✕
            </button>
          </div>

          <div style={floatingInviteBodyStyle()}>
            <p style={floatingInviteFromStyle()}>
              <strong>{floatingInvite.from}</strong> te convidou para uma
              partida de poker!
            </p>
            {floatingInvite.players && floatingInvite.players.length > 0 && (
              <p style={floatingInvitePlayersStyle()}>
                👥 Jogadores: {floatingInvite.players.join(", ")}
              </p>
            )}
          </div>

          <div style={floatingInviteActionsStyle()}>
            <motion.button
              onClick={() => acceptGroupInvite(floatingInvite.inviteId)}
              style={floatingInviteAcceptStyle()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✅ Aceitar
            </motion.button>
            <motion.button
              onClick={() => declineGroupInvite(floatingInvite.inviteId)}
              style={floatingInviteDeclineStyle()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ❌ Recusar
            </motion.button>
          </div>

          <div style={floatingInviteFooterStyle()}>
            <span style={floatingInviteHintStyle()}>
              Clique fora para fechar
            </span>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // ============================================================
  // 🔥 RENDER PRINCIPAL
  // ============================================================

  if (loading) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>👥 AMIGOS</h3>
        <p style={emptyStyle()}>Carregando...</p>
      </div>
    );
  }

  return (
    <>
      {/* 🔥 CONVITE FLUTUANTE */}
      <AnimatePresence mode="wait">
        <FloatingInvite />
      </AnimatePresence>

      {ChatPanel}
      <InviteModal />

      <div style={panelStyle()}>
        <div style={headerStyle()}>
          <div style={headerLeftStyle()}>
            <h3 style={titleStyle()}>👥 AMIGOS</h3>
            {onlineFriends.length > 0 && (
              <span style={onlineBadgeStyle()}>
                🟢 {onlineFriends.length} online
              </span>
            )}
            {!isConnected && (
              <span style={disconnectedBadgeStyle()}>⚫ Desconectado</span>
            )}
            {isWaitingForAccept && (
              <span style={waitingBadgeStyle()}>
                ⏳ Aguardando aceitação...
              </span>
            )}
          </div>
          <div style={headerRightStyle()}>
            <button
              onClick={() => setShowFriends(!showFriends)}
              style={toggleButtonStyle()}
            >
              {showFriends ? "▲" : "▼"} ({friends.length})
            </button>
          </div>
        </div>

        {/* 🔥 FEEDBACK NO CARD (CLICÁVEL PARA MENSAGENS) */}
        <AnimatePresence>
          <CardFeedback />
        </AnimatePresence>

        {showFriends && (
          <div style={contentStyle()}>
            <div style={addFriendStyle()}>
              <input
                type="text"
                value={newFriend}
                onChange={(e) => setNewFriend(e.target.value)}
                placeholder="Digite o nome do amigo"
                style={inputStyle()}
                onKeyPress={(e) => e.key === "Enter" && addFriend()}
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

            {error && <div style={errorStyle()}>{error}</div>}
            {success && <div style={successStyle()}>{success}</div>}

            {friends.length === 0 ? (
              <p style={emptyStyle()}>
                {username
                  ? "Nenhum amigo adicionado ainda. Digite um nome acima e clique em Adicionar."
                  : "Faça login para ver seus amigos."}
              </p>
            ) : (
              <div style={friendsListStyle()}>
                <div style={rankingHeaderStyle()}>
                  <span>🏆 Ranking entre amigos</span>
                  <span style={{ fontSize: "0.55rem", color: "#888" }}>
                    {onlineFriends.length} online
                  </span>
                </div>
                {sortedFriends.map((friend, index) => (
                  <div
                    key={`friend_${index}_${friend.username}`}
                    style={friendItemStyle(friend.isOnline)}
                  >
                    <div style={friendInfoStyle()}>
                      <span style={friendRankStyle(index)}>#{index + 1}</span>
                      <span style={friendNameStyle()}>
                        {friend.username || "Desconhecido"}
                      </span>
                      <span style={friendStatusStyle(friend.isOnline)}>
                        {friend.isOnline ? "🟢 Online" : "⚫ Offline"}
                      </span>
                      <span style={friendLevelStyle()}>
                        Nv. {friend.level || 1}
                      </span>
                      <span style={friendChipsStyle()}>
                        💰 {friend.chips || 0}
                      </span>
                    </div>
                    <div style={friendActionsStyle()}>
                      {friend.isOnline && (
                        <>
                          <button
                            onClick={() => openChat(friend.username)}
                            style={chatButtonStyle()}
                            title="Abrir chat"
                          >
                            💬
                            {unreadChats[friend.username] > 0 && (
                              <span style={unreadBadgeStyle()}>
                                {unreadChats[friend.username]}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              toggleFriendSelection(friend.username);
                              setShowInviteModal(true);
                            }}
                            style={inviteButtonStyle()}
                            title="Convidar para partida"
                          >
                            🎯
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => removeFriend(friend.username)}
                        style={removeButtonStyle()}
                        title="Remover amigo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {onlineFriends.length > 0 && (
              <button
                onClick={() => setShowInviteModal(true)}
                style={multiInviteButtonStyle()}
              >
                🎯 Convidar Múltiplos Amigos
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================

// 🔥 ESTILOS DO FEEDBACK NO CARD (CLICÁVEL)
function cardFeedbackStyle(isError) {
  return {
    background: isError ? "rgba(244,67,54,0.12)" : "rgba(255,215,0,0.12)",
    border: isError
      ? "1px solid rgba(244,67,54,0.3)"
      : "1px solid rgba(255,215,0,0.3)",
    borderRadius: "12px",
    padding: "10px 14px",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    transition: "all 0.2s ease",
    ":hover": {
      opacity: 0.9,
    },
  };
}

function cardFeedbackIconStyle(isError) {
  return {
    fontSize: "1.2rem",
    flexShrink: 0,
  };
}

function cardFeedbackTextStyle() {
  return {
    flex: 1,
    fontSize: "0.85rem",
    color: "var(--text-primary)",
    fontWeight: "500",
    wordBreak: "break-word",
  };
}

function cardFeedbackClickHintStyle() {
  return {
    fontSize: "0.9rem",
    color: "var(--text-muted)",
    opacity: 0.6,
    flexShrink: 0,
    animation: "pulse 1.5s ease-in-out infinite",
  };
}

function cardFeedbackCloseStyle() {
  return {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: "2px 6px",
    opacity: 0.5,
    transition: "opacity 0.3s ease",
    flexShrink: 0,
  };
}

// 🔥 ESTILOS DO CONVITE FLUTUANTE
function floatingInviteOverlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  };
}

function floatingInviteCardStyle() {
  return {
    background: "linear-gradient(145deg, #1a3a2a, #0a2a1a)",
    borderRadius: "24px",
    padding: "28px 32px",
    maxWidth: "420px",
    width: "100%",
    color: "#ffffff",
    border: "2px solid gold",
    boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(255,215,0,0.1)",
    position: "relative",
    overflow: "hidden",
  };
}

function floatingInviteHeaderStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,215,0,0.15)",
  };
}

function floatingInviteIconStyle() {
  return {
    fontSize: "2rem",
  };
}

function floatingInviteTitleStyle() {
  return {
    flex: 1,
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "gold",
  };
}

function floatingInviteCloseStyle() {
  return {
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
    fontSize: "1.2rem",
    padding: "4px 8px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
    flexShrink: 0,
  };
}

function floatingInviteBodyStyle() {
  return {
    marginBottom: "20px",
  };
}

function floatingInviteFromStyle() {
  return {
    fontSize: "1rem",
    lineHeight: "1.5",
    margin: "0 0 8px 0",
    color: "#eee",
  };
}

function floatingInvitePlayersStyle() {
  return {
    fontSize: "0.85rem",
    color: "#aaa",
    margin: "0",
  };
}

function floatingInviteActionsStyle() {
  return {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
  };
}

function floatingInviteAcceptStyle() {
  return {
    flex: 1,
    padding: "10px 20px",
    borderRadius: "30px",
    border: "none",
    background: "linear-gradient(145deg, #4caf50, #388e3c)",
    color: "white",
    fontWeight: "bold",
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(76,175,80,0.3)",
  };
}

function floatingInviteDeclineStyle() {
  return {
    flex: 1,
    padding: "10px 20px",
    borderRadius: "30px",
    border: "none",
    background: "linear-gradient(145deg, #f44336, #c62828)",
    color: "white",
    fontWeight: "bold",
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(244,67,54,0.3)",
  };
}

function floatingInviteFooterStyle() {
  return {
    textAlign: "center",
    paddingTop: "8px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  };
}

function floatingInviteHintStyle() {
  return {
    fontSize: "0.65rem",
    color: "#666",
  };
}

// ============================================================
// 🔥 ESTILOS DO PAINEL PRINCIPAL (MANTIDOS)
// ============================================================

function panelStyle() {
  return {
    background: "var(--bg-panel)",
    backdropFilter: "blur(4px)",
    borderRadius: 20,
    padding: 15,
    marginTop: 10,
    color: "var(--text-primary)",
    border: "1px solid var(--border-gold)",
    transition: "var(--transition-theme)",
    overflow: "hidden",
  };
}

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  };
}

function headerLeftStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  };
}

function headerRightStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: "0 0 10px",
    fontSize: "1rem",
  };
}

function onlineBadgeStyle() {
  return {
    fontSize: "0.6rem",
    color: "#4caf50",
    background: "rgba(76,175,80,0.15)",
    padding: "2px 10px",
    borderRadius: 12,
    border: "1px solid rgba(76,175,80,0.2)",
    whiteSpace: "nowrap",
  };
}

function disconnectedBadgeStyle() {
  return {
    fontSize: "0.6rem",
    color: "#f44336",
    background: "rgba(244,67,54,0.15)",
    padding: "2px 10px",
    borderRadius: 12,
    border: "1px solid rgba(244,67,54,0.2)",
    whiteSpace: "nowrap",
  };
}

function waitingBadgeStyle() {
  return {
    fontSize: "0.6rem",
    color: "#ff9800",
    background: "rgba(255,152,0,0.15)",
    padding: "2px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,152,0,0.2)",
    whiteSpace: "nowrap",
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
    border: "1px solid var(--border-input)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    outline: "none",
    transition: "var(--transition-theme)",
    minWidth: "60px",
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
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  };
}

function errorStyle() {
  return {
    color: "#f44336",
    fontSize: "0.8rem",
    textAlign: "center",
    padding: "5px",
    background: "rgba(244,67,54,0.1)",
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
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    padding: "10px 0",
  };
}

function friendsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "250px",
    overflowY: "auto",
    overflowX: "hidden",
  };
}

function rankingHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    padding: "4px 8px",
    borderBottom: "1px solid var(--border-light)",
    marginBottom: "4px",
  };
}

function friendItemStyle(isOnline) {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: isOnline ? "rgba(76,175,80,0.05)" : "rgba(255,255,255,0.02)",
    borderRadius: 10,
    border: isOnline
      ? "1px solid rgba(76,175,80,0.15)"
      : "1px solid var(--border-light)",
    transition: "var(--transition-theme)",
    flexWrap: "wrap",
    gap: "4px",
  };
}

function friendInfoStyle() {
  return {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  };
}

function friendRankStyle(index) {
  const colors = ["#ffd700", "#c0c0c0", "#cd7f32", "#888"];
  return {
    fontSize: "0.6rem",
    fontWeight: "bold",
    color: colors[index] || "#666",
    minWidth: "24px",
  };
}

function friendNameStyle() {
  return {
    fontWeight: "bold",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
  };
}

function friendStatusStyle(isOnline) {
  return {
    fontSize: "0.6rem",
    color: isOnline ? "#4caf50" : "#666",
  };
}

function friendLevelStyle() {
  return {
    color: "gold",
    fontSize: "0.65rem",
  };
}

function friendChipsStyle() {
  return {
    color: "#4caf50",
    fontSize: "0.65rem",
  };
}

function friendActionsStyle() {
  return {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  };
}

function inviteButtonStyle() {
  return {
    background: "rgba(76,175,80,0.15)",
    border: "1px solid rgba(76,175,80,0.2)",
    borderRadius: "50%",
    width: 28,
    height: 28,
    color: "#4caf50",
    cursor: "pointer",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
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
    transition: "all 0.3s ease",
  };
}

function chatButtonStyle() {
  return {
    background: "rgba(33,150,243,0.15)",
    border: "1px solid rgba(33,150,243,0.2)",
    borderRadius: "50%",
    width: 28,
    height: 28,
    color: "#2196f3",
    cursor: "pointer",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "all 0.3s ease",
  };
}

function unreadBadgeStyle() {
  return {
    position: "absolute",
    top: -4,
    right: -4,
    background: "#f44336",
    color: "white",
    fontSize: "0.5rem",
    borderRadius: "50%",
    padding: "1px 4px",
    minWidth: "16px",
    textAlign: "center",
  };
}

function multiInviteButtonStyle() {
  return {
    width: "100%",
    background: "rgba(76,175,80,0.15)",
    border: "1px solid rgba(76,175,80,0.3)",
    borderRadius: 15,
    padding: "8px",
    color: "#4caf50",
    fontSize: "0.8rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "8px",
  };
}

function chatOverlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    zIndex: 2000,
    padding: "20px",
  };
}

function chatPanelStyle() {
  return {
    width: "350px",
    maxWidth: "90vw",
    height: "450px",
    maxHeight: "80vh",
    background: "var(--bg-card)",
    borderRadius: 16,
    border: "2px solid var(--border-gold)",
    boxShadow: "0 8px 40px var(--shadow-dark)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };
}

function chatHeaderStyle() {
  return {
    padding: "12px 16px",
    background: "rgba(255,215,0,0.1)",
    borderBottom: "1px solid var(--border-light)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "gold",
    fontWeight: "bold",
    fontSize: "1rem",
  };
}

function chatHeaderRightStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };
}

function chatMessageCountStyle() {
  return {
    fontSize: "0.6rem",
    color: "#888",
  };
}

function closeChatStyle() {
  return {
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
    fontSize: "1.2rem",
    padding: "4px",
  };
}

function chatMessagesStyle() {
  return {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "350px",
  };
}

function emptyChatStyle() {
  return {
    textAlign: "center",
    color: "#666",
    padding: "30px 0",
    fontSize: "0.9rem",
  };
}

function chatMessageStyle(isOwn) {
  return {
    display: "flex",
    justifyContent: isOwn ? "flex-end" : "flex-start",
  };
}

function chatMessageBubbleStyle(isOwn) {
  return {
    maxWidth: "80%",
    padding: "8px 14px",
    borderRadius: 12,
    background: isOwn ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
    border: isOwn
      ? "1px solid rgba(255,215,0,0.2)"
      : "1px solid var(--border-light)",
    wordBreak: "break-word",
  };
}

function chatMessageTextStyle() {
  return {
    fontSize: "0.85rem",
    color: "var(--text-primary)",
  };
}

function chatMessageTimeStyle(isOwn) {
  return {
    fontSize: "0.5rem",
    color: "#666",
    marginTop: "4px",
    textAlign: isOwn ? "right" : "left",
  };
}

function chatInputFormStyle() {
  return {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid var(--border-light)",
    gap: "8px",
  };
}

function chatInputStyle() {
  return {
    flex: 1,
    padding: "8px 14px",
    borderRadius: 20,
    border: "1px solid var(--border-input)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    outline: "none",
  };
}

function chatSendButtonStyle() {
  return {
    padding: "8px 18px",
    borderRadius: 20,
    border: "none",
    background: "radial-gradient(#f7d97c,#d6a12e)",
    color: "#2e241f",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
  };
}

function inviteOverlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3000,
    padding: "20px",
  };
}

function inviteModalStyle() {
  return {
    background: "var(--bg-modal)",
    padding: "25px 30px",
    borderRadius: 25,
    maxWidth: "450px",
    width: "100%",
    color: "var(--text-primary)",
    border: "2px solid gold",
    boxShadow: "0 20px 60px var(--shadow-dark)",
    maxHeight: "90vh",
    overflowY: "auto",
  };
}

function inviteTitleStyle() {
  return {
    textAlign: "center",
    color: "gold",
    margin: "0 0 15px",
    fontSize: "1.4rem",
  };
}

function inviteTextStyle() {
  return {
    textAlign: "center",
    fontSize: "1rem",
    marginBottom: "20px",
    color: "var(--text-secondary)",
  };
}

function friendSelectionStyle() {
  return {
    maxHeight: "200px",
    overflowY: "auto",
    marginBottom: "15px",
    border: "1px solid var(--border-light)",
    borderRadius: 10,
    padding: "5px",
  };
}

function friendSelectItemStyle(selected) {
  return {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    background: selected ? "rgba(76,175,80,0.1)" : "transparent",
    border: selected
      ? "1px solid rgba(76,175,80,0.3)"
      : "1px solid transparent",
    transition: "all 0.3s ease",
  };
}

function friendSelectCheckStyle() {
  return {
    fontSize: "1.1rem",
  };
}

function friendSelectNameStyle() {
  return {
    flex: 1,
    fontWeight: "bold",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
  };
}

function friendSelectLevelStyle() {
  return {
    fontSize: "0.7rem",
    color: "gold",
  };
}

function emptySelectionStyle() {
  return {
    textAlign: "center",
    color: "var(--text-muted)",
    padding: "20px 0",
    fontSize: "0.9rem",
  };
}

function inviteStatsStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    marginBottom: "15px",
    padding: "4px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 8,
  };
}

function inviteButtonsStyle() {
  return {
    display: "flex",
    gap: "10px",
  };
}

function inviteSendStyle(enabled) {
  return {
    flex: 1,
    background: enabled ? "radial-gradient(#f7d97c,#d6a12e)" : "#444",
    border: "none",
    fontWeight: "bold",
    padding: "10px",
    borderRadius: 30,
    color: enabled ? "#2e241f" : "#888",
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.5,
    transition: "all 0.3s ease",
  };
}

function inviteCancelStyle() {
  return {
    flex: 1,
    background: "rgba(244,67,54,0.15)",
    border: "1px solid #f44336",
    borderRadius: 30,
    padding: "10px",
    color: "#f44336",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  };
}

function acceptButtonStyle() {
  return {
    background: "rgba(76,175,80,0.2)",
    border: "1px solid #4caf50",
    borderRadius: 12,
    padding: "4px 12px",
    color: "#4caf50",
    fontSize: "0.7rem",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  };
}

function declineButtonStyle() {
  return {
    background: "rgba(244,67,54,0.15)",
    border: "1px solid #f44336",
    borderRadius: 12,
    padding: "4px 12px",
    color: "#f44336",
    fontSize: "0.7rem",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  };
}

function joinGameButtonStyle() {
  return {
    background: "rgba(76,175,80,0.2)",
    border: "1px solid #4caf50",
    borderRadius: 12,
    padding: "6px 16px",
    color: "#4caf50",
    fontSize: "0.7rem",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  };
}

// lib/socket-client.js - CORRIGIDO
import { io } from "socket.io-client";

// 🔥 USAR A MESMA URL DO SOCKET-SERVER
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.listeners = new Map();
    this.pendingEvents = [];
    this.isInitializing = false;
  }

  getInstance() {
    if (!this.socket) {
      this.initialize();
    }
    return this.socket;
  }

  initialize() {
    if (this.socket || this.isInitializing) return;
    this.isInitializing = true;

    console.log(`🔌 SocketClient: Inicializando (${SOCKET_URL})...`);

    try {
      this.socket = io(SOCKET_URL, {
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true,
        reconnection: true,
        transports: ["websocket", "polling"],
        forceNew: false,
        path: "/socket.io/",
      });

      this.socket.on("connect", () => {
        console.log(`🟢 SocketClient: Conectado (${this.socket.id})`);
        this.connected = true;
        this.reconnectAttempts = 0;
        this.isInitializing = false;
        this.processPendingEvents();
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`🔴 SocketClient: Desconectado (${reason})`);
        this.connected = false;
      });

      this.socket.on("connect_error", (error) => {
        // 🔥 LOG AMIGÁVEL - SEM ERRO NO CONSOLE
        console.log(
          `⚠️ SocketClient: Tentando reconectar... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`,
        );
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log(
            `⚠️ SocketClient: Máximo de tentativas atingido. Tente recarregar a página.`,
          );
          if (this.socket) {
            this.socket.close();
          }
          this.socket = null;
          this.isInitializing = false;
        }
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(
          `🔄 SocketClient: Reconectado (tentativa ${attemptNumber})`,
        );
        this.connected = true;
        this.reconnectAttempts = 0;
        this.isInitializing = false;
        this.processPendingEvents();
      });

      this.socket.on("reconnect_error", (error) => {
        console.log(
          `⚠️ SocketClient: Erro na reconexão (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`,
        );
      });

      this.socket.on("reconnect_failed", () => {
        console.log(
          `❌ SocketClient: Falha na reconexão. Tente recarregar a página.`,
        );
        this.socket = null;
        this.isInitializing = false;
      });
    } catch (error) {
      console.log(`⚠️ SocketClient: Erro ao inicializar: ${error.message}`);
      this.socket = null;
      this.isInitializing = false;
    }
  }

  processPendingEvents() {
    if (this.pendingEvents.length === 0) return;

    console.log(
      `📤 Processando ${this.pendingEvents.length} eventos pendentes`,
    );
    const events = [...this.pendingEvents];
    this.pendingEvents = [];

    events.forEach(({ event, data }) => {
      if (this.connected && this.socket) {
        this.socket.emit(event, data);
      } else {
        this.pendingEvents.push({ event, data });
      }
    });
  }

  emit(event, data) {
    if (this.connected && this.socket) {
      this.socket.emit(event, data);
    } else {
      // Enfileirar para quando reconectar
      console.log(`📤 Evento "${event}" enfileirado (aguardando conexão)`);
      this.pendingEvents.push({ event, data });

      // Tentar reconectar se não estiver tentando
      if (!this.socket || !this.socket.connected) {
        this.isInitializing = false;
        this.initialize();
      }
    }
  }

  on(event, callback) {
    if (!this.socket) {
      this.initialize();
    }

    // Remover listener antigo se existir
    if (this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
    }

    this.listeners.set(event, callback);
    this.socket.on(event, callback);
  }

  off(event) {
    if (this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 SocketClient: Desconectando...");
      this.listeners.clear();
      this.pendingEvents = [];
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.isInitializing = false;
    }
  }

  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

// 🔥 EXPORTAR INSTÂNCIA ÚNICA
export const socketClient = new SocketClient();

// 🔥 EXPORTAR FUNÇÕES DE CONVENIÊNCIA
export const emit = (event, data) => socketClient.emit(event, data);
export const on = (event, callback) => socketClient.on(event, callback);
export const off = (event) => socketClient.off(event);
export const disconnect = () => socketClient.disconnect();
export const isConnected = () => socketClient.isConnected();

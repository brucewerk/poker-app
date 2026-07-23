// lib/socket-client.js - Singleton Socket.IO Client
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.pendingEvents = [];
  }

  getInstance() {
    if (!this.socket) {
      this.initialize();
    }
    return this.socket;
  }

  initialize() {
    if (this.socket) return;

    console.log("🔌 SocketClient: Inicializando...");

    this.socket = io(SOCKET_URL, {
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      reconnection: true,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log(`🟢 SocketClient: Conectado (${this.socket.id})`);
      this.connected = true;
      this.reconnectAttempts = 0;

      // Processar eventos pendentes
      this.processPendingEvents();
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`🔴 SocketClient: Desconectado (${reason})`);
      this.connected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ SocketClient: Erro de conexão:", error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("❌ SocketClient: Máximo de tentativas atingido");
        this.socket.close();
        this.socket = null;
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 SocketClient: Reconectado (tentativa ${attemptNumber})`);
      this.connected = true;
      this.reconnectAttempts = 0;
    });
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

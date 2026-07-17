// lib/sound.js
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.isLoaded = false;
    this.isInitialized = false;
    this.isMuted = false;
    this.pendingSounds = [];
    this.isPlaying = false;
  }

  // 🔥 INICIALIZAR FORÇADO
  initAudioContext() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (
          window.AudioContext || window.webkitAudioContext
        )();
        console.log("🔊 AudioContext criado");
      }

      // 🔥 FORÇAR RESUME
      if (this.audioContext.state === "suspended") {
        this.audioContext
          .resume()
          .then(() => {
            console.log("🔊 AudioContext resumed");
            this.isInitialized = true;
            // 🔥 TOCAR SONS PENDENTES
            this.processPendingSounds();
          })
          .catch((err) => {
            console.warn("⚠️ Erro ao resume AudioContext:", err);
          });
      } else if (this.audioContext.state === "running") {
        this.isInitialized = true;
        this.processPendingSounds();
      }
    } catch (error) {
      console.warn("⚠️ Erro ao inicializar AudioContext:", error);
    }
  }

  // 🔥 ALIAS
  init() {
    this.initAudioContext();
  }

  loadSounds() {
    if (this.isLoaded) return;
    this.isLoaded = true;
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem("sound-muted", muted ? "true" : "false");
  }

  getMuted() {
    const saved = localStorage.getItem("sound-muted");
    if (saved !== null) {
      this.isMuted = saved === "true";
    }
    return this.isMuted;
  }

  // 🔥 PROCESSAR SONS PENDENTES
  processPendingSounds() {
    if (this.pendingSounds.length > 0) {
      console.log(`🔊 Processando ${this.pendingSounds.length} sons pendentes`);
      const sounds = [...this.pendingSounds];
      this.pendingSounds = [];
      sounds.forEach((type) => {
        this._playSoundInternal(type);
      });
    }
  }

  // 🔥 TOCAR SOM (COM FILA DE ESPERA)
  playSound(type) {
    if (this.getMuted()) {
      return;
    }

    // 🔥 SE NÃO INICIALIZADO, ADICIONAR À FILA
    if (
      !this.isInitialized ||
      !this.audioContext ||
      this.audioContext.state !== "running"
    ) {
      console.log(
        `🔊 Som "${type}" enfileirado (estado: ${this.audioContext?.state || "null"})`,
      );
      this.pendingSounds.push(type);
      this.initAudioContext();
      return;
    }

    this._playSoundInternal(type);
  }

  // 🔥 INTERNO: TOCAR O SOM
  _playSoundInternal(type) {
    try {
      if (!this.audioContext || this.audioContext.state !== "running") {
        console.warn(
          `⚠️ AudioContext não está rodando, enfileirando "${type}"`,
        );
        this.pendingSounds.push(type);
        return;
      }

      // 🔥 DEFINIR FREQUÊNCIAS
      const soundConfigs = {
        win: { freq: 523.25, duration: 0.25, volume: 0.12 },
        lose: { freq: 293.66, duration: 0.25, volume: 0.12 },
        raise: { freq: 659.25, duration: 0.15, volume: 0.1 },
        fold: { freq: 440.0, duration: 0.15, volume: 0.1 },
        check: { freq: 392.0, duration: 0.15, volume: 0.1 },
        shuffle: { freq: 261.63, duration: 0.3, volume: 0.08 },
        deal: { freq: 349.23, duration: 0.12, volume: 0.08 },
        allin: { freq: 880.0, duration: 0.3, volume: 0.15 },
      };

      const config = soundConfigs[type] || {
        freq: 440,
        duration: 0.15,
        volume: 0.1,
      };

      // 🔥 CRIAR OSCILADOR
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = config.freq;
      oscillator.type = "sine";

      // 🔥 ENVELOPE DE VOLUME (EVITA CLICKS)
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);

      oscillator.start(now);
      oscillator.stop(now + config.duration);

      console.log(`🔊 Som "${type}" tocado (${config.freq}Hz)`);
    } catch (error) {
      // 🔥 SE FALHAR, REINICIAR O CONTEXTO
      console.warn(`⚠️ Erro ao tocar som "${type}":`, error);
      this.isInitialized = false;
      this.audioContext = null;
      this.pendingSounds.push(type);
      setTimeout(() => this.initAudioContext(), 100);
    }
  }

  // 🔥 TESTAR SOM
  testSound() {
    console.log("🔊 Testando som...");
    this.playSound("deal");
  }
}

export const soundManager = new SoundManager();

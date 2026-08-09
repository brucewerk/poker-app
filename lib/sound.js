// lib/sound.js - SISTEMA DE SOM PREMIUM (COM LOGS AMIGÁVEIS)
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.isLoaded = false;
    this.isInitialized = false;
    this.isMuted = false;
    this.volume = 0.8;
    this.pendingSounds = [];
    this.isPlaying = false;
    this.masterGain = null;
    this._isUserInteracted = false;
  }

  // 🔥 INICIALIZAR FORÇADO
  initAudioContext() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (
          window.AudioContext || window.webkitAudioContext
        )();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.audioContext.destination);
        // 🔥 LOG AMIGÁVEL
        console.info("🔊 Áudio inicializado");
      }

      if (this.audioContext.state === "suspended") {
        this.audioContext
          .resume()
          .then(() => {
            console.info("🔊 Áudio ativado");
            this.isInitialized = true;
            this.processPendingSounds();
          })
          .catch((err) => {
            // 🔥 LOG AMIGÁVEL EM VEZ DE WARNING
            console.info("⏳ Áudio aguardando interação do usuário");
          });
      } else if (this.audioContext.state === "running") {
        this.isInitialized = true;
        this.processPendingSounds();
      }
    } catch (error) {
      // 🔥 LOG AMIGÁVEL
      console.info("⏳ Áudio não disponível (aguardando interação)");
    }
  }

  init() {
    this.initAudioContext();
  }

  loadSounds() {
    if (this.isLoaded) return;
    this.isLoaded = true;
    console.info("🔊 Sons carregados");
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    safeSetItem("sound-volume", String(this.volume));
  }

  getVolume() {
    const saved = safeGetItem("sound-volume");
    if (saved !== null) {
      this.volume = parseFloat(saved);
    }
    return this.volume;
  }

  setMuted(muted) {
    this.isMuted = muted;
    safeSetItem("sound-muted", muted ? "true" : "false");
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume;
    }
    console.info(muted ? "🔇 Som desativado" : "🔊 Som ativado");
  }

  getMuted() {
    const saved = safeGetItem("sound-muted");
    if (saved !== null) {
      this.isMuted = saved === "true";
    }
    return this.isMuted;
  }

  processPendingSounds() {
    if (this.pendingSounds.length > 0) {
      console.info(
        `🔊 Processando ${this.pendingSounds.length} sons pendentes`,
      );
      const sounds = [...this.pendingSounds];
      this.pendingSounds = [];
      sounds.forEach(({ type, options }) => {
        this._playSoundInternal(type, options);
      });
    }
  }

  playSound(type, options = {}) {
    if (this.getMuted()) {
      return;
    }

    if (
      !this.isInitialized ||
      !this.audioContext ||
      this.audioContext.state !== "running"
    ) {
      // 🔥 LOG AMIGÁVEL - SEM WARNING
      this.pendingSounds.push({ type, options });
      this.initAudioContext();
      return;
    }

    this._playSoundInternal(type, options);
  }

  _playSoundInternal(type, options = {}) {
    try {
      if (!this.audioContext || this.audioContext.state !== "running") {
        this.pendingSounds.push({ type, options });
        return;
      }

      const soundConfigs = {
        win: {
          freq: 523.25,
          duration: 0.35,
          volume: 0.15,
          type: "sine",
          harmonics: [1.5, 2],
          harmonicVolumes: [0.3, 0.15],
        },
        lose: {
          freq: 293.66,
          duration: 0.4,
          volume: 0.12,
          type: "sawtooth",
          harmonics: [0.5, 0.3],
        },
        raise: {
          freq: 659.25,
          duration: 0.18,
          volume: 0.12,
          type: "sine",
          harmonics: [1.2],
          harmonicVolumes: [0.2],
        },
        fold: {
          freq: 440.0,
          duration: 0.2,
          volume: 0.1,
          type: "sine",
          harmonics: [0.7],
          harmonicVolumes: [0.15],
        },
        call: {
          freq: 392.0,
          duration: 0.15,
          volume: 0.1,
          type: "sine",
          harmonics: [1.3],
          harmonicVolumes: [0.15],
        },
        check: {
          freq: 392.0,
          duration: 0.12,
          volume: 0.08,
          type: "sine",
        },
        shuffle: {
          freq: 261.63,
          duration: 0.3,
          volume: 0.08,
          type: "sawtooth",
          harmonics: [0.6, 0.3],
        },
        deal: {
          freq: 349.23,
          duration: 0.12,
          volume: 0.08,
          type: "sine",
          harmonics: [1.5],
          harmonicVolumes: [0.15],
        },
        allin: {
          freq: 880.0,
          duration: 0.4,
          volume: 0.18,
          type: "square",
          harmonics: [1.3, 0.7],
        },
        celebration: {
          freq: 659.25,
          duration: 0.5,
          volume: 0.15,
          type: "sine",
          harmonics: [1.25, 1.5],
          harmonicVolumes: [0.25, 0.15],
        },
        cardFlip: {
          freq: 554.37,
          duration: 0.08,
          volume: 0.06,
          type: "sine",
        },
        chipStack: {
          freq: 261.63,
          duration: 0.2,
          volume: 0.07,
          type: "triangle",
          harmonics: [1.5],
          harmonicVolumes: [0.1],
        },
        timer: {
          freq: 880.0,
          duration: 0.05,
          volume: 0.05,
          type: "sine",
        },
        showdown: {
          freq: 440.0,
          duration: 0.3,
          volume: 0.1,
          type: "sine",
          harmonics: [1.5, 2],
          harmonicVolumes: [0.2, 0.1],
        },
        bigWin: {
          freq: 523.25,
          duration: 0.5,
          volume: 0.2,
          type: "sine",
          harmonics: [1.5, 2, 2.5],
          harmonicVolumes: [0.3, 0.2, 0.1],
        },
        levelUp: {
          freq: 659.25,
          duration: 0.4,
          volume: 0.15,
          type: "sine",
          harmonics: [1.3, 1.6],
          harmonicVolumes: [0.25, 0.15],
        },
      };

      const config = soundConfigs[type] || {
        freq: 440,
        duration: 0.15,
        volume: 0.1,
        type: "sine",
      };

      const volumeMultiplier = options.volume || 1;
      const finalVolume = config.volume * volumeMultiplier;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain || this.audioContext.destination);

      oscillator.frequency.value = options.freq || config.freq;
      oscillator.type = config.type || "sine";

      const harmonicNodes = [];
      if (config.harmonics && config.harmonics.length > 0) {
        config.harmonics.forEach((harmonic, index) => {
          const hOsc = this.audioContext.createOscillator();
          const hGain = this.audioContext.createGain();
          hOsc.connect(hGain);
          hGain.connect(gainNode);
          hOsc.frequency.value = (options.freq || config.freq) * harmonic;
          hOsc.type = config.type || "sine";
          const hVolume = config.harmonicVolumes?.[index] || 0.15;
          hGain.gain.value = hVolume * finalVolume * 0.5;
          hOsc.start(this.audioContext.currentTime);
          hOsc.stop(this.audioContext.currentTime + config.duration);
          harmonicNodes.push({ osc: hOsc, gain: hGain });
        });
      }

      const now = this.audioContext.currentTime;
      const attackTime = 0.005;
      const releaseTime = 0.02;

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(finalVolume, now + attackTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        now + config.duration - releaseTime,
      );
      gainNode.gain.linearRampToValueAtTime(0, now + config.duration);

      oscillator.start(now);
      oscillator.stop(now + config.duration);

      if (options.stereo && this.audioContext) {
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = (Math.random() - 0.5) * 0.3;
        gainNode.disconnect();
        gainNode.connect(panner);
        panner.connect(this.masterGain || this.audioContext.destination);
      }
    } catch (error) {
      // 🔥 LOG AMIGÁVEL - SEM ERRO
      this.pendingSounds.push({ type, options });
      setTimeout(() => this.initAudioContext(), 100);
    }
  }

  playWinSequence() {
    if (this.getMuted()) return;
    const notes = [523.25, 659.25, 784.0, 1046.5];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playSound("win", {
          volume: 0.12,
          stereo: true,
          freq: freq,
        });
      }, i * 150);
    });
  }

  playLoseSequence() {
    if (this.getMuted()) return;
    const notes = [440, 349.23, 293.66];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playSound("lose", {
          volume: 0.1,
          freq: freq,
        });
      }, i * 200);
    });
  }

  playLevelUpSequence() {
    if (this.getMuted()) return;
    const notes = [523.25, 659.25, 784.0];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playSound("levelUp", {
          volume: 0.12,
          freq: freq,
          stereo: true,
        });
      }, i * 120);
    });
  }

  testSound() {
    console.info("🔊 Testando som...");
    this.playSound("deal");
    setTimeout(() => this.playSound("raise"), 300);
    setTimeout(() => this.playSound("call"), 600);
  }
}

export const soundManager = new SoundManager();

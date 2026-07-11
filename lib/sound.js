// lib/sound.js
export class SoundManager {
  constructor() {
    this.enabled = true;
    this.sounds = {};
    this.loaded = false;
  }

  async loadSounds() {
    if (this.loaded) return;

    try {
      // Criar sons sintéticos usando Web Audio API
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();

      // Som de shuffle (baralho embaralhando)
      this.sounds.shuffle = this.createShuffleSound(audioContext);

      // Som de deal (distribuindo cartas)
      this.sounds.deal = this.createDealSound(audioContext);

      // Som de vitória
      this.sounds.win = this.createWinSound(audioContext);

      // Som de derrota
      this.sounds.lose = this.createLoseSound(audioContext);

      // Som de all-in
      this.sounds.allin = this.createAllInSound(audioContext);

      // Som de raise
      this.sounds.raise = this.createRaiseSound(audioContext);

      // Som de fold
      this.sounds.fold = this.createFoldSound(audioContext);

      // Som de check
      this.sounds.check = this.createCheckSound(audioContext);

      this.loaded = true;
    } catch (error) {
      console.error("Erro ao carregar sons:", error);
    }
  }

  createShuffleSound(ctx) {
    const duration = 0.5;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duration,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
    }
    return buffer;
  }

  createDealSound(ctx) {
    const duration = 0.1;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duration,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(i * 0.02) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }
    return buffer;
  }

  createWinSound(ctx) {
    const duration = 0.8;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duration,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] =
        Math.sin(2 * Math.PI * 523 * t) * Math.exp(-t * 2) * 0.5 +
        Math.sin(2 * Math.PI * 659 * t) * Math.exp(-t * 2) * 0.3;
    }
    return buffer;
  }

  createLoseSound(ctx) {
    const duration = 0.5;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duration,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 3) * 0.4;
    }
    return buffer;
  }

  createAllInSound(ctx) {
    const duration = 0.4;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duration,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] =
        Math.sin(2 * Math.PI * 800 * t) *
        Math.sin(2 * Math.PI * 4 * t) *
        Math.exp(-t * 5);
    }
    return buffer;
  }

  createRaiseSound(ctx) {
    const duration = 0.15;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duration,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(i * 0.05) * Math.exp(-i / (ctx.sampleRate * 0.03));
    }
    return buffer;
  }

  createFoldSound(ctx) {
    const duration = 0.2;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duration,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] =
        Math.sin(i * 0.01) *
        Math.sin(i * 0.02) *
        Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    return buffer;
  }

  createCheckSound(ctx) {
    const duration = 0.08;
    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate * duration,
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(i * 0.01) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }
    return buffer;
  }

  playSound(name) {
    if (!this.enabled || !this.loaded || !this.sounds[name]) return;

    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const source = audioContext.createBufferSource();
      source.buffer = this.sounds[name];
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      // Silenciosamente ignorar erros de áudio
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const soundManager = new SoundManager();

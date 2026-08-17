// Synthesizes game sound effects using the Web Audio API
export class AudioSystem {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.enabled = true; // Could add a toggle button later
  }

  playTone(freq, type, duration, vol = 0.5) {
    if (!this.enabled || !this.ctx) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, vol = 0.5) {
    if (!this.enabled || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const bufferSize = this.ctx.sampleRate * duration; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Add a lowpass filter for a "swish" sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playBounce() {
    this.playTone(150, 'sine', 0.2, 0.8);
  }

  playRimHit() {
    this.playTone(600, 'square', 0.1, 0.4);
    this.playTone(800, 'sine', 0.1, 0.3);
  }

  playSwish() {
    this.playNoise(0.5, 0.6);
  }

  playScore() {
    this.playTone(440, 'sine', 0.1, 0.3);
    setTimeout(() => this.playTone(660, 'sine', 0.2, 0.4), 100);
  }

  playGameOver() {
    this.playTone(300, 'sawtooth', 0.3, 0.5);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.4, 0.5), 200);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.6, 0.5), 400);
  }
}

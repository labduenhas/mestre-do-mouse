// Simple Audio Synthesizer to avoid external assets
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playSound = (type: 'pop' | 'success' | 'error' | 'win') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('game-audio-feedback', { detail: { type } }));
  }

  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'pop') {
      // Short high blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } 
    else if (type === 'success') {
      // Major chord arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, now + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);
        o.start(now + i * 0.05);
        o.stop(now + i * 0.05 + 0.4);
      });
    }
    else if (type === 'error') {
      // Soft buzzer
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
    else if (type === 'win') {
      // Victory Fanfare
      const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
      const times = [0, 0.15, 0.3, 0.45, 0.6, 0.75];
      const lengths = [0.1, 0.1, 0.1, 0.1, 0.1, 0.4];
      
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.value = freq;
        
        const start = now + times[i];
        g.gain.setValueAtTime(0.1, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + lengths[i]);
        
        o.start(start);
        o.stop(start + lengths[i] + 0.1);
      });
      
      // Applause noise effect
      const bufferSize = ctx.sampleRate * 2; // 2 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.5;
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    }

  } catch (e) {
    console.warn("Audio Context error", e);
  }
};
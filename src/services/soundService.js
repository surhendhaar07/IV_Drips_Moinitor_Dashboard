// Web Audio API Synthesizer for Hospital Monitor Alarms
// No external MP3 files required - works 100% reliably in any modern browser!

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.alarmInterval = null;
    this.isPlayingAlert = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stopAlarm();
    }
  }

  // Soft notification ping (e.g. status update, toast)
  playChime() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  }

  // Critical Hospital Empty Line Alert (High-pitch pulsing beeper)
  startAlarm() {
    if (this.isMuted || this.isPlayingAlert) return;
    this.isPlayingAlert = true;

    const playBeepTriple = () => {
      if (this.isMuted || !this.isPlayingAlert) return;
      try {
        this.init();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const freqs = [880, 880, 987]; // High alert pulse
        freqs.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          const startTime = now + idx * 0.12;
          const endTime = startTime + 0.08;

          gain.gain.setValueAtTime(0.09, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, endTime);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(startTime);
          osc.stop(endTime);
        });
      } catch (e) {
        console.warn('Audio alarm beep failed:', e);
      }
    };

    playBeepTriple();
    this.alarmInterval = setInterval(playBeepTriple, 2000);
  }

  stopAlarm() {
    this.isPlayingAlert = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }
}

export const soundService = new SoundService();

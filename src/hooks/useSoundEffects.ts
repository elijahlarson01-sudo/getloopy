import { useCallback, useRef } from "react";

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error("Error playing tone:", error);
    }
  }, [getAudioContext]);

  const playCountdownBeep = useCallback(() => {
    playTone(800, 0.15, "sine", 0.4);
  }, [playTone]);

  const playCountdownFinal = useCallback(() => {
    playTone(1200, 0.3, "sine", 0.5);
  }, [playTone]);

  const playCorrect = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Two-tone success sound
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.2);
    });
  }, [getAudioContext]);

  const playIncorrect = useCallback(() => {
    playTone(200, 0.3, "sawtooth", 0.2);
  }, [playTone]);

  const playChallengeReceived = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Attention-grabbing notification sound
    [440, 554.37, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.4, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });
  }, [getAudioContext]);

  const playVictory = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Victory fanfare
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.35, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.4);
    });
  }, [getAudioContext]);

  const playDefeat = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Sad descending tone
    [392, 349.23, 293.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.35);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.35);
    });
  }, [getAudioContext]);

  return {
    playCountdownBeep,
    playCountdownFinal,
    playCorrect,
    playIncorrect,
    playChallengeReceived,
    playVictory,
    playDefeat,
  };
};

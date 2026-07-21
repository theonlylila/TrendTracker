/**
 * A little "pop" for completing a task, synthesized with the Web Audio API
 * so there's no audio file to ship or load.
 */
let audioCtx: AudioContext | null = null;

export function playPop() {
  if (typeof window === "undefined") return;

  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return;

  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume();

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

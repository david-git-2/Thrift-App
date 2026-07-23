/**
 * Audio & Haptic Feedback Utilities for Barcode Scanning & Warehouse Workflows
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a high-frequency success chime/beep (880Hz -> 1760Hz short double tone)
 */
export function playScanSuccessAudio(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.warn("Audio play error:", err);
  }
}

/**
 * Play a low-frequency error/warning beep (220Hz dual pulse)
 */
export function playScanErrorAudio(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (err) {
    console.warn("Audio play error:", err);
  }
}

/**
 * Trigger haptic vibration feedback
 */
export function triggerScanHaptic(type: "success" | "error" = "success"): void {
  if (
    typeof window !== "undefined" &&
    "navigator" in window &&
    navigator.vibrate
  ) {
    if (type === "success") {
      navigator.vibrate(80);
    } else {
      navigator.vibrate([100, 50, 100]);
    }
  }
}

/**
 * Combined scan feedback trigger
 */
export function triggerScanFeedback(
  type: "success" | "error" = "success"
): void {
  if (type === "success") {
    playScanSuccessAudio();
    triggerScanHaptic("success");
  } else {
    playScanErrorAudio();
    triggerScanHaptic("error");
  }
}

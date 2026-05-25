let ctx = null;

function getContext() {
    if (typeof window === 'undefined') return null;
    if (ctx) return ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
}

export function beep({ freq = 880, durationMs = 90, gain = 0.08 } = {}) {
    const audio = getContext();
    if (!audio) return;

    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = gain;

    osc.connect(g);
    g.connect(audio.destination);
    osc.start();

    g.gain.exponentialRampToValueAtTime(0.00001, audio.currentTime + durationMs / 1000);
    osc.stop(audio.currentTime + durationMs / 1000);
}

export const beepSuccess = () => beep({ freq: 880, durationMs: 90 });
export const beepError = () => beep({ freq: 220, durationMs: 200, gain: 0.10 });

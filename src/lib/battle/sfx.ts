// ============================================================
// Battle SFX — Web Audio API sound generator
// All sounds are procedurally generated (no external files).
// Retro 90s arcade aesthetic — oscillators + noise + envelopes.
// ============================================================

type SfxType =
  | "aim_tick"       // fast blip during reticle movement
  | "aim_lock"       // satisfying click when target locked
  | "charge_start"   // low hum that builds
  | "charge_peak"    // high-pitched whine at max charge
  | "slam_launch"    // whoosh as tazo launches
  | "slam_impact"    // heavy crash on impact
  | "tazo_flip"      // metallic ting on flip
  | "tazo_secure"    // triumphant ding when secured
  | "score_pop"      // bubble pop for score
  | "damage_taken"   // low thud for damage
  | "victory_fanfare" // ascending meody
  | "defeat_sting"    // descending tone
  | "countdown_beep"  // 3-2-1 beep
  | "battle_start"   // fight bell
  | "ui_click"       // button press

let audioCtx: AudioContext | null = null

function ctx(): AudioContext | null {
  if (!audioCtx) {
    try {
      // Defer AudioContext creation until first user gesture
      const Ctor = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctor) return null
      audioCtx = new Ctor()
    } catch {
      return null
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// ============================================================
// Helpers
// ============================================================

function gain(
  c: AudioContext,
  value: number,
  target?: AudioNode,
): GainNode {
  const g = c.createGain()
  g.gain.value = value
  if (target) g.connect(target)
  return g
}

function osc(
  c: AudioContext,
  type: OscillatorType,
  freq: number,
  target: AudioNode,
): OscillatorNode {
  const o = c.createOscillator()
  o.type = type
  o.frequency.value = freq
  o.connect(target)
  return o
}

function noise(c: AudioContext, duration: number, target: AudioNode) {
  const len = c.sampleRate * duration
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1

  const src = c.createBufferSource()
  src.buffer = buf

  const bp = c.createBiquadFilter()
  bp.type = "bandpass"
  bp.frequency.value = 1200
  bp.Q.value = 0.8
  src.connect(bp).connect(target)
  return src
}

// ============================================================
// Sound definitions
// ============================================================

export function playSfx(type: SfxType, volume = 0.3) {
  try {
    const c = ctx()
    if (!c) return
    const master = gain(c, volume, c.destination)
    const now = c.currentTime

    switch (type) {
      // ── AIM ──────────────────────────────────────────
      case "aim_tick": {
        const o = osc(c, "square", 800, master)
        o.start(now)
        o.stop(now + 0.03)
        master.gain.setValueAtTime(0.15, now)
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
        break
      }
      case "aim_lock": {
        // Two quick pings
        [0, 0.06].forEach((delay) => {
          const o = osc(c, "triangle", 1200, master)
          const g = gain(c, 0, o)
          g.gain.setValueAtTime(0.25, now + delay)
          g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08)
          o.connect(g).connect(master)
          o.start(now + delay)
          o.stop(now + delay + 0.08)
        })
        break
      }

      // ── CHARGE ───────────────────────────────────────
      case "charge_start": {
        const o = osc(c, "sawtooth", 80, master)
        master.gain.setValueAtTime(0.04, now)
        o.start(now)
        // Will be stopped externally when charge ends
        ;(o as any).__sfxStop = () => {
          master.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05)
          o.stop(c.currentTime + 0.05)
        }
        return o // Return so caller can stop it
      }
      case "charge_peak": {
        const o = osc(c, "square", 400, master)
        master.gain.setValueAtTime(0.1, now)
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        o.start(now)
        o.stop(now + 0.15)
        break
      }

      // ── LAUNCH / IMPACT ──────────────────────────────
      case "slam_launch": {
        const n = noise(c, 0.15, master)
        const hp = c.createBiquadFilter()
        hp.type = "highpass"
        hp.frequency.value = 400
        n.connect(hp).connect(master)
        master.gain.setValueAtTime(0.2, now)
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        n.start(now)
        break
      }
      case "slam_impact": {
        // Low thud
        const o = osc(c, "sine", 60, master)
        master.gain.setValueAtTime(0.8, now)
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        o.frequency.setValueAtTime(60, now)
        o.frequency.exponentialRampToValueAtTime(20, now + 0.3)
        o.start(now)
        o.stop(now + 0.3)

        // Noise burst
        const n = noise(c, 0.15, master)
        const ng = gain(c, 0.4, master)
        n.connect(ng)
        n.start(now + 0.02)
        break
      }

      // ── TAZO FLIP ────────────────────────────────────
      case "tazo_flip": {
        const o = osc(c, "triangle", 1800, master)
        o.frequency.setValueAtTime(1800, now)
        o.frequency.exponentialRampToValueAtTime(600, now + 0.15)
        master.gain.setValueAtTime(0.2, now)
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        o.start(now)
        o.stop(now + 0.2)
        break
      }
      case "tazo_secure": {
        // Happy chord: C-E-G
        [523, 659, 784].forEach((f, i) => {
          const o = osc(c, "sine", f, master)
          const g = gain(c, 0.15, master)
          o.connect(g)
          o.start(now + i * 0.07)
          o.stop(now + i * 0.07 + 0.25)
          g.gain.setValueAtTime(0.15, now + i * 0.07)
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25)
        })
        break
      }

      // ── SCORE ───────────────────────────────────────
      case "score_pop": {
        const o = osc(c, "sine", 880, master)
        o.frequency.setValueAtTime(880, now)
        o.frequency.exponentialRampToValueAtTime(1320, now + 0.08)
        master.gain.setValueAtTime(0.25, now)
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        o.start(now)
        o.stop(now + 0.15)
        break
      }
      case "damage_taken": {
        const o = osc(c, "sine", 220, master)
        o.frequency.setValueAtTime(220, now)
        o.frequency.exponentialRampToValueAtTime(110, now + 0.2)
        master.gain.setValueAtTime(0.2, now)
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        o.start(now)
        o.stop(now + 0.3)
        break
      }

      // ── VICTORY / DEFEAT ─────────────────────────────
      case "victory_fanfare": {
        // C-E-G-C' ascending
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = osc(c, "square", f, master)
          const g = gain(c, 0.12, master)
          o.connect(g)
          o.start(now + i * 0.12)
          o.stop(now + i * 0.12 + 0.3)
        })
        break
      }
      case "defeat_sting": {
        [400, 350, 300].forEach((f, i) => {
          const o = osc(c, "sawtooth", f, master)
          const g = gain(c, 0.1, master)
          o.connect(g)
          o.start(now + i * 0.15)
          o.stop(now + i * 0.15 + 0.25)
        })
        break
      }

      // ── COUNTDOWN ────────────────────────────────────
      case "countdown_beep": {
        const o = osc(c, "square", 1000, master)
        master.gain.setValueAtTime(0.15, now)
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
        o.start(now)
        o.stop(now + 0.1)
        break
      }
      case "battle_start": {
        // Ring bell
        [0, 0.08, 0.16].forEach((d) => {
          const o = osc(c, "triangle", 1500, master)
          const g = gain(c, 0.15, master)
          o.connect(g)
          o.start(now + d)
          o.stop(now + d + 0.12)
        })
        break
      }

      // ── UI ───────────────────────────────────────────
      case "ui_click": {
        const o = osc(c, "square", 600, master)
        master.gain.setValueAtTime(0.08, now)
        master.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        o.start(now)
        o.stop(now + 0.04)
        break
      }
    }
  } catch {
    // AudioContext may not be available (SSR, etc.) — silent fail
  }
}

/** Stop a persistent sound (like charge hum) */
export function stopSfx(o: { __sfxStop?: () => void } | undefined) {
  o?.__sfxStop?.()
}

/** Check if audio is available */
export function isSfxAvailable(): boolean {
  return typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined"
}

/** Pre-warm the audio context (call on first user interaction) */
export function warmSfx() {
  try {
    const c = ctx()
    if (!c) return
    if (c.state === "suspended") c.resume()
  } catch { /* ok */ }
}

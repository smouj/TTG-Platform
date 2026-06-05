// ============================================================
// Trading Tazos Game — SFX Engine
// Lightweight procedural sound effects using Web Audio API.
// No external files, zero dependencies, ~2KB gzipped.
// ============================================================

type SFXName = 'click' | 'bag_open' | 'bag_tear' | 'reveal' | 'battle_hit'
  | 'battle_victory' | 'battle_defeat' | 'nav' | 'equip' | 'error'
  | 'tick' | 'woosh' | 'coin' | 'unlock'

interface SFXOptions {
  volume?: number   // 0-1, default 0.3
  pitch?: number    // frequency multiplier, default 1.0
}

let audioCtx: AudioContext | null = null
let muted = false

function getCtx(): AudioContext | null {
  if (muted) return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// ── public API ──

export function sfxMute(m: boolean) {
  muted = m
}

export function sfxToggle(): boolean {
  muted = !muted
  return muted
}

export function sfxIsMuted(): boolean {
  return muted
}

// Unlock audio on first user gesture (required by browsers)
export function sfxUnlock() {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }
}

let unlocked = false
export function sfxEnsureUnlocked() {
  if (unlocked) return
  unlocked = true
  sfxUnlock()
  // Also add one-shot unlock on first click/touch
  const unlock = () => {
    sfxUnlock()
    document.removeEventListener('click', unlock)
    document.removeEventListener('touchstart', unlock)
    document.removeEventListener('keydown', unlock)
  }
  document.addEventListener('click', unlock, { once: true })
  document.addEventListener('touchstart', unlock, { once: true })
  document.addEventListener('keydown', unlock, { once: true })
}

export function playSFX(name: SFXName, opts: SFXOptions = {}) {
  const ctx = getCtx()
  if (!ctx) return

  const vol = opts.volume ?? 0.3
  const pitch = opts.pitch ?? 1.0
  const now = ctx.currentTime

  switch (name) {
    case 'click': {
      // Short click — white noise burst
      const dur = 0.03
      const bufferSize = Math.floor(ctx.sampleRate * dur)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
      }
      const src = ctx.createBufferSource()
      src.buffer = buffer
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(vol * 0.8, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(2000 * pitch, now)
      src.connect(filter).connect(gain).connect(ctx.destination)
      src.start(now)
      src.stop(now + dur)
      break
    }

    case 'bag_open': {
      // Crinkly bag opening — layered noise with filter sweep
      const dur = 0.5
      const bufferSize = Math.floor(ctx.sampleRate * dur)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4) * (1 + Math.sin(t * 80) * 0.5)
      }
      const src = ctx.createBufferSource()
      src.buffer = buffer
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(vol * 0.7, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(800 * pitch, now)
      filter.frequency.exponentialRampToValueAtTime(4000 * pitch, now + dur * 0.6)
      filter.Q.setValueAtTime(2, now)
      src.connect(filter).connect(gain).connect(ctx.destination)
      src.start(now)
      src.stop(now + dur)
      break
    }

    case 'bag_tear': {
      // Paper tearing — sharp noise + low rumble
      const dur = 0.25
      // Sharp tear layer
      const buf1 = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
      const d1 = buf1.getChannelData(0)
      for (let i = 0; i < d1.length; i++) {
        d1[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d1.length * 0.2))
      }
      const src1 = ctx.createBufferSource()
      src1.buffer = buf1
      const filter1 = ctx.createBiquadFilter()
      filter1.type = 'highpass'
      filter1.frequency.setValueAtTime(3000 * pitch, now)
      const gain1 = ctx.createGain()
      gain1.gain.setValueAtTime(vol * 0.6, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + dur)
      src1.connect(filter1).connect(gain1).connect(ctx.destination)
      src1.start(now)
      // Low rumble
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(80 * pitch, now)
      osc.frequency.exponentialRampToValueAtTime(30, now + dur)
      const gain2 = ctx.createGain()
      gain2.gain.setValueAtTime(vol * 0.2, now)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + dur)
      osc.connect(gain2).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + dur)
      break
    }

    case 'reveal': {
      // Magical reveal — ascending chime
      const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const t = now + i * 0.08
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq * pitch, t)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(vol * 0.4, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
        // Add slight vibrato
        const vibrato = ctx.createOscillator()
        vibrato.frequency.setValueAtTime(5, t)
        const vibratoGain = ctx.createGain()
        vibratoGain.gain.setValueAtTime(3, t)
        vibrato.connect(vibratoGain).connect(osc.frequency)
        vibrato.start(t)
        vibrato.stop(t + 0.4)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.4)
      })
      break
    }

    case 'battle_hit': {
      // Impact — low thud + high crack
      // Low thud
      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(150 * pitch, now)
      osc1.frequency.exponentialRampToValueAtTime(30, now + 0.15)
      const gain1 = ctx.createGain()
      gain1.gain.setValueAtTime(vol * 0.5, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
      osc1.connect(gain1).connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.2)
      // High crack
      const dur = 0.08
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15))
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(5000, now)
      const gain2 = ctx.createGain()
      gain2.gain.setValueAtTime(vol * 0.4, now)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + dur)
      src.connect(filter).connect(gain2).connect(ctx.destination)
      src.start(now)
      break
    }

    case 'battle_victory': {
      // Triumphant ascending arpeggio
      const notes = [392, 523, 659, 784, 1047] // G4 C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const t = now + i * 0.1
        const osc = ctx.createOscillator()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq * pitch, t)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(vol * 0.25, t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(freq * 2, t)
        osc.connect(filter).connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.5)
      })
      break
    }

    case 'battle_defeat': {
      // Sad descending notes
      const notes = [392, 349, 330, 262] // G4 F4 E4 C4
      notes.forEach((freq, i) => {
        const t = now + i * 0.15
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq * pitch, t)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(vol * 0.2, t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(800, t)
        osc.connect(filter).connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.4)
      })
      break
    }

    case 'nav': {
      // Soft navigation swoosh — filtered noise
      const dur = 0.12
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI / dur) * 0.6
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1500 * pitch, now)
      filter.Q.setValueAtTime(1, now)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(vol * 0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
      src.connect(filter).connect(gain).connect(ctx.destination)
      src.start(now)
      break
    }

    case 'equip': {
      // Satisfying click-clack
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(600 * pitch, now)
      osc.frequency.setValueAtTime(800 * pitch, now + 0.04)
      osc.frequency.setValueAtTime(1000 * pitch, now + 0.06)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(vol * 0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2000, now)
      osc.connect(filter).connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.1)
      break
    }

    case 'error': {
      // Error buzz
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.setValueAtTime(200 * pitch, now)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(vol * 0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(400, now)
      osc.connect(filter).connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.25)
      break
    }

    case 'tick': {
      // Subtle UI tick
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200 * pitch, now)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(vol * 0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.05)
      break
    }

    case 'woosh': {
      // Longer swoosh — for transitions
      const dur = 0.35
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3) * Math.sin(t * 20)
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(400 * pitch, now)
      filter.frequency.exponentialRampToValueAtTime(2000 * pitch, now + dur)
      filter.Q.setValueAtTime(0.5, now)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(vol * 0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
      src.connect(filter).connect(gain).connect(ctx.destination)
      src.start(now)
      break
    }

    case 'coin': {
      // Coin collect — bright ping
      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(988 * pitch, now)
      osc1.frequency.setValueAtTime(1319 * pitch, now + 0.06)
      const gain1 = ctx.createGain()
      gain1.gain.setValueAtTime(vol * 0.3, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc1.connect(gain1).connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.3)
      // Glitter overlay
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(2093 * pitch, now + 0.05)
      const gain2 = ctx.createGain()
      gain2.gain.setValueAtTime(0, now)
      gain2.gain.linearRampToValueAtTime(vol * 0.15, now + 0.06)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc2.connect(gain2).connect(ctx.destination)
      osc2.start(now)
      osc2.stop(now + 0.25)
      break
    }

    case 'unlock': {
      // Achievement unlock fanfare
      const notes = [523, 659, 784, 1047, 784, 1047] // C E G C G C
      notes.forEach((freq, i) => {
        const t = now + i * 0.1
        const osc = ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq * pitch, t)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(vol * 0.3, t + 0.03)
        gain.gain.setValueAtTime(vol * 0.3, t + 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.5)
      })
      break
    }
  }
}

// ── React Hook ──

export function createSFX() {
  return {
    play: playSFX,
    mute: sfxMute,
    toggle: sfxToggle,
    isMuted: sfxIsMuted,
    unlock: sfxEnsureUnlocked,
  }
}

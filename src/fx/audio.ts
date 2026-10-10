// Sesler dosyasız, Web Audio ile üretilir: para şıngırtısı, balon, ortam (rüzgâr + kuş).
let ctx: AudioContext | null = null
let master: GainNode | null = null
let ambientOn = false
const KEY = 'bu-topraklar-ses'

export function muted() {
  try {
    return localStorage.getItem(KEY) === 'kapali'
  } catch {
    return false
  }
}
export function setMuted(m: boolean) {
  try {
    localStorage.setItem(KEY, m ? 'kapali' : 'acik')
  } catch {
    /* yok say */
  }
  if (master) master.gain.value = m ? 0 : 0.5
}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted() ? 0 : 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq: number, at: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const c = ac()
  if (!c || !master) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, c.currentTime + at)
  g.gain.linearRampToValueAtTime(vol, c.currentTime + at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur)
  o.connect(g).connect(master)
  o.start(c.currentTime + at)
  o.stop(c.currentTime + at + dur + 0.05)
}

/** Para geldi: iki parlak nota. Gider için daha pes. */
export function coin(income = true) {
  if (income) {
    tone(1318, 0, 0.25, 0.22, 'triangle')
    tone(1760, 0.07, 0.35, 0.18, 'triangle')
  } else {
    tone(660, 0, 0.2, 0.16, 'triangle')
    tone(494, 0.08, 0.3, 0.14, 'triangle')
  }
}

/** Konuşma balonu açıldı. */
export function pop() {
  tone(520, 0, 0.09, 0.12, 'sine')
  tone(780, 0.03, 0.08, 0.08, 'sine')
}

/** Ortam: yumuşak rüzgâr gürültüsü + ara ara kuş cıvıltısı. İlk dokunuştan sonra başlar. */
export function startAmbient() {
  const c = ac()
  if (!c || !master || ambientOn) return
  ambientOn = true
  const len = c.sampleRate * 2
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02 // kahverengi gürültü
    d[i] = last * 3.5
  }
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 500
  const g = c.createGain()
  g.gain.value = 0.05
  src.connect(f).connect(g).connect(master)
  src.start()
  const chirp = () => {
    if (!ambientOn) return
    const base = 2400 + Math.random() * 1400
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) tone(base + Math.random() * 400, i * 0.11, 0.08, 0.035, 'sine')
    setTimeout(chirp, 2500 + Math.random() * 5000)
  }
  setTimeout(chirp, 1500)
}

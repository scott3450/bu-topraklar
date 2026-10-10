// Görsel yön: Toprak. Video dili ve Atlas elendi.
// Vurgu rengi: İznik turkuazı; kiremit yalnız çatılarda.
// Arayüz: "Pazar tezgâhı": beyaz kartlar, türüne göre renkli başlık şeridi; turkuaz, hardal, mercan.

// Arazi boyası (mevsime göre değişir)
export type Land = { grass: string; dry: string; scrub: string; road: string; ground: string; bank: string; crop: string }

export type Palette = {
  land?: Land
  id: string
  name: string
  background: string
  ground: string
  groundSide: string
  terrace: string
  road: string
  field: string
  trunk: string
  olive: string
  pine: string
  wall: string
  roof: string
  hive: string
  hiveLid: string
  cow: string
  greenhouse: string
  tomatoLeaf: string
  tomato: string
  tarp: string
  crate: string
  accent: string
  ui: {
    card: string
    text: string
    muted: string
    chip: string
    chipText: string
    button: string
    buttonText: string
    font: string
    warm: string // olay, para, yıldız
    alert: string // kriz, eksik, yanlış
    good: string // doğru, güven
    radius: number
  }
}

export const palette: Palette = {
  id: 'toprak',
  name: 'Toprak',
  background: '#efe6d6',
  ground: '#e9dcc3',
  groundSide: '#c7a77c',
  terrace: '#dfcfae',
  road: '#cdb48d',
  field: '#d6d2a4',
  trunk: '#7a6248',
  olive: '#8c9a5b',
  pine: '#4f6b45',
  wall: '#f4ece0',
  roof: '#c4623f',
  hive: '#efd9a7',
  hiveLid: '#c4623f',
  cow: '#f2ede4',
  greenhouse: '#e8efe0',
  tomatoLeaf: '#6f8a4a',
  tomato: '#d2452f',
  tarp: '#4f7a6a',
  crate: '#b98a55',
  accent: '#14918f',
  ui: {
    card: 'rgba(255,255,255,0.97)',
    text: '#2e2a26',
    muted: '#6f655a',
    chip: '#eef6f1',
    chipText: '#17706e',
    button: '#14918f',
    buttonText: '#ffffff',
    font: 'system-ui, -apple-system, sans-serif',
    warm: '#f0a21b',
    alert: '#e5533d',
    good: '#3f9b4f',
    radius: 18,
  },
}

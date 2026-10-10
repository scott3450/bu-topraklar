// Ürün kataloğu: sahnede nasıl görünür, neden orada yetişir.
// "why" satırları genel bilgidir (≈); il bazlı kaynaklı rakamlar iller.ts → FACTS'te.

export type Look =
  | { type: 'orchard'; leaf: string; fruit?: string; size?: number; crown?: 'round' | 'wide' | 'olive' }
  | { type: 'field'; color: string }
  | { type: 'rows'; color: string; post?: boolean } // bağ, çay, gül, domates sıraları
  | { type: 'hazel' }
  | { type: 'greenhouse' }
  | { type: 'pasture' }
  | { type: 'hives' }

export type Urun = { id: string; name: string; look: Look; why: string }

export const URUNLER: Record<string, Urun> = {
  zeytin: { id: 'zeytin', name: 'Zeytin', look: { type: 'orchard', leaf: '#8c9a5b', crown: 'olive' }, why: 'Kışı ılık, yazı kurak kıyılar; sert dona dayanamaz.' },
  incir: { id: 'incir', name: 'İncir', look: { type: 'orchard', leaf: '#5f8a45', crown: 'wide', size: 1.1 }, why: 'Sıcak ve kuru yaz meyveyi dalında kurutur.' },
  narenciye: { id: 'narenciye', name: 'Mandalina ve portakal', look: { type: 'orchard', leaf: '#3f6e36', fruit: '#ef9a2a', size: 0.8 }, why: 'Don sevmez; kışı ılık kıyı ovalarında yetişir.' },
  seftali: { id: 'seftali', name: 'Şeftali', look: { type: 'orchard', leaf: '#7aa556', fruit: '#f08a5d', size: 0.8 }, why: 'Ilıman, sulanabilen ovalar; kış soğuğu da ister.' },
  kayisi: { id: 'kayisi', name: 'Kayısı', look: { type: 'orchard', leaf: '#7f9a58', fruit: '#e8913a', size: 0.85 }, why: 'Sıcak, kuru yaz; en büyük risk ilkbahar donu.' },
  elma: { id: 'elma', name: 'Elma', look: { type: 'orchard', leaf: '#6f9a4e', fruit: '#c8322b', size: 0.85 }, why: 'Kışın soğuk ister; serin yayla ve göl çevreleri.' },
  kiraz: { id: 'kiraz', name: 'Kiraz', look: { type: 'orchard', leaf: '#5f8a45', fruit: '#8b1e2b', size: 0.85 }, why: 'Soğuk kış, kurak yaz; yüksek bahçeler.' },
  nar: { id: 'nar', name: 'Nar', look: { type: 'orchard', leaf: '#6f8a4a', fruit: '#b5203a', size: 0.7 }, why: 'Sıcak kıyı ve iç ovalar; kuraklığa dayanıklı.' },
  fistik: { id: 'fistik', name: 'Antep fıstığı', look: { type: 'orchard', leaf: '#8c9a5b', fruit: '#c98a8a', size: 0.65, crown: 'olive' }, why: 'Kurak, taşlık arazi; sıcak yaz, soğuk kış.' },
  ceviz: { id: 'ceviz', name: 'Ceviz', look: { type: 'orchard', leaf: '#4f7a3e', size: 1.25 }, why: 'Derin topraklı, serin vadiler.' },
  kestane: { id: 'kestane', name: 'Kestane', look: { type: 'orchard', leaf: '#4f7a3e', size: 1.2, crown: 'wide' }, why: 'Nemli, serin dağ yamaçları.' },
  findik: { id: 'findik', name: 'Fındık', look: { type: 'hazel' }, why: 'Bol yağışlı, nemli kıyı; dik yamaçta da yetişir.' },
  cay: { id: 'cay', name: 'Çay', look: { type: 'rows', color: '#53903f' }, why: 'Çok yağış ve asitli toprak ister.' },
  uzum: { id: 'uzum', name: 'Üzüm', look: { type: 'rows', color: '#6f8a3e', post: true }, why: 'Sıcak, kuru yaz; kurutmalık sultani bağları.' },
  gul: { id: 'gul', name: 'Yağ gülü', look: { type: 'rows', color: '#d0566a' }, why: 'Serin yayla iklimi; gül yağı için.' },
  domates: { id: 'domates', name: 'Domates', look: { type: 'rows', color: '#c8452f' }, why: 'Sıcak yaz; kışın seralarda.' },
  muz: { id: 'muz', name: 'Muz', look: { type: 'greenhouse' }, why: 'En ılık kıyı şeridi; çoğu serada.' },
  sera: { id: 'sera', name: 'Sera sebzesi', look: { type: 'greenhouse' }, why: 'Kış güneşi bol kıyılar.' },
  bugday: { id: 'bugday', name: 'Buğday', look: { type: 'field', color: '#e0c46e' }, why: 'Az suyla yetişir; geniş düz ovada makineyle.' },
  aycicegi: { id: 'aycicegi', name: 'Ayçiçeği', look: { type: 'field', color: '#e8c23a' }, why: 'Derin, verimli toprak; Trakya ovaları.' },
  pamuk: { id: 'pamuk', name: 'Pamuk', look: { type: 'field', color: '#e9e4d4' }, why: 'Uzun, çok sıcak yaz ve sulama.' },
  pancar: { id: 'pancar', name: 'Şeker pancarı', look: { type: 'field', color: '#4f8a3e' }, why: 'Sulanan ova; şeker fabrikasına yakın.' },
  patates: { id: 'patates', name: 'Patates', look: { type: 'field', color: '#6a8f4a' }, why: 'Serin yayla, kumlu toprak.' },
  misir: { id: 'misir', name: 'Mısır', look: { type: 'field', color: '#7fae4e' }, why: 'Sıcak yaz ve bol su.' },
  celtik: { id: 'celtik', name: 'Çeltik', look: { type: 'field', color: '#9cc76a' }, why: 'Su altında yetişir; nehir ve delta ovaları.' },
  mercimek: { id: 'mercimek', name: 'Kırmızı mercimek', look: { type: 'field', color: '#c9b77e' }, why: 'Kışın ekilir; Güneydoğu yağışıyla yetişir.' },
  nohut: { id: 'nohut', name: 'Nohut', look: { type: 'field', color: '#cdbb84' }, why: 'Kuru tarım, kıraç topraklar.' },
  tutun: { id: 'tutun', name: 'Tütün', look: { type: 'field', color: '#7f9a4e' }, why: 'Kıraç yamaçlar, sıcak yaz.' },
  hashas: { id: 'hashas', name: 'Haşhaş', look: { type: 'field', color: '#e6d6dc' }, why: 'Devlet izniyle ekilir; ilaç sanayisi için.' },
  yerfistigi: { id: 'yerfistigi', name: 'Yer fıstığı', look: { type: 'field', color: '#8fae5a' }, why: 'Kumlu, sıcak ova toprağı.' },
  sebze: { id: 'sebze', name: 'Sebze', look: { type: 'rows', color: '#6f9a4e' }, why: 'Büyükşehre yakın, sulanan ovalar.' },
  mera: { id: 'mera', name: 'Hayvancılık', look: { type: 'pasture' }, why: 'Serin, otu bol yayla ve çayırlar.' },
  bal: { id: 'bal', name: 'Bal', look: { type: 'hives' }, why: 'Çiçekli yayla ve ormanlar.' },
}

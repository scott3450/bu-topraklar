// Yön göstersin diye: yılın üç hedefi ve Emine'nin her ay tek cümlelik önerisi.
import { START_CASH, MONTHS } from './config'
import * as E from './engine'

const tl = (n: number) => (n < 0 ? '−₺' : '₺') + Math.abs(Math.round(n)).toLocaleString('tr-TR')

export type Goal = { label: string; done: boolean }
export function goals(s: E.State): Goal[] {
  return [
    { label: 'İlk satışı yap', done: s.sold > 0 },
    { label: 'İkinci üyeyi kazan', done: s.members.length >= 2 },
    { label: `Yılı kasada ${tl(START_CASH)} üstünde bitir`, done: s.cash >= START_CASH && s.month >= 12 },
  ]
}

/** Yolda olan para: vadesi gelmemiş alacaklar, üyelere ödenecek kalanlar düşülmüş. */
export function incoming(s: E.State) {
  const net = s.receivables.reduce((a, r) => a + r.amount + (r.payout?.amount ?? 0), 0)
  const next = s.receivables.filter((r) => r.amount > 0).sort((a, b) => a.due - b.due)[0]
  return { net, next: next ? MONTHS[next.due % 12] : null }
}

/** Emine'nin önerisi: duruma göre tek cümle. */
export function tip(s: E.State): string {
  const next = E.endMonth(s).cash
  const inc = incoming(s)
  if (s.members.length < 2) return 'Köydeki işaretlere tıkla, üreticileri davet et. Her biri ne isterse söyler.'
  if (next < 80_000 && inc.net > 0) return `Kasa daralacak ama para yolda: ${inc.next} ayında gelecek. Gerekirse şimdi kredi al, para gelince öde.`
  if (next < 80_000) return 'Kasa daralıyor. Büyük harcamayı ertele ya da kredi al; eksiye düşmek güveni sarsar.'
  if (s.debt > 0 && s.cash > 450_000) return 'Kasa rahat: krediyi şimdi ödersen her ay faiz vermekten kurtulursun.'
  if (!s.invest.dolum && s.members.includes('ayse') && s.month <= 2) return 'Şişeleme hattıyla yağı markete daha pahalı satarsın; ama market 60 gün sonra öder.'
  if (!s.members.includes('fatma')) return 'Fatma Abla yemi topluca, ucuza almak istiyor. Ortak yem alımını açarsan katılır.'
  if (!s.invest.analiz && !s.members.includes('mehmet')) return 'Mehmet Amca balının analizli satılmasını istiyor; analiz anlaşması ucuz.'
  return 'Her satıştan hizmet payı kooperatife kalır; ürün çoğaldıkça kasa da büyür.'
}

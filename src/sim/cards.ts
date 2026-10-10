// Ay sonu öğrenme kartları: ne oldu, neden, gerçek hayatta adı. Her kart bir kez.

export type Card = { title: string; body: string; term: string }

export const CARDS: Record<string, Card> = {
  'araci-farki': {
    title: 'Aracı farkı',
    body: 'Ayşe Teyze yağın kilosunu 275 TL\'ye veriyor. Aynı yağın litresi markette 810–900 TL. Arada şişeleme, nakliye, toptancı, market payı ve vergi var. Kooperatifin işi, bu zincirin bir kısmını üreticiye geri kazandırmak.',
    term: 'değer zinciri, katma değer',
  },
  vade: {
    title: 'Kâr var, kasa boş',
    body: 'Markete sattığın yağın parası iki ay sonra gelecek, ama üyeye avans bugün çıktı. Kanun bu vadeyi sınırlıyor: tedarikçi tarımsal üretici ya da küçük işletmeyse büyük alıcı en geç 60 günde ödemek zorunda (TTK 1530). Yine de işletmeler çoğu zaman zarardan değil, nakitsiz kaldıkları için batar.',
    term: 'işletme sermayesi, alacak vadesi',
  },
  elus: {
    title: 'Ürün depoda, para cepte',
    body: 'Hasatta herkes aynı anda satınca tüccar fiyatı düşer. Lisanslı depoya konan buğday ELÜS denen elektronik senede dönüşür: bankaya göstersen değerinin dörtte üçü kadar kredi alırsın, ürünü fiyat yükselince satarsın. Kiranın çoğunu devlet öder.',
    term: 'lisanslı depo, ELÜS, hasat baskısı',
  },
  'toplu-alim': {
    title: 'Toplu alım',
    body: 'Yemi dört ayrı kişi değil, tek bir alıcı olarak alınca tedarikçi indirim yapar. Süt fiyatı aynı kalsa da Fatma Abla\'nın eline litre başına daha çok para geçiyor.',
    term: 'ölçek ekonomisi, pazarlık gücü',
  },
  'soguk-zincir': {
    title: 'Soğuk zincir',
    body: 'Sağılan süt hemen soğutulmazsa bakteri çoğalır; fabrika fiyat kırar ya da hiç almaz. Ortak tank kaliteyi korur, alıcı da prim öder. Ama tankın bu primle kendini ödemesi yıllar sürer.',
    term: 'geri dönüş süresi',
  },
  guven: {
    title: 'Güven parayla ölçülür',
    body: 'Piyasada sahte bal çok olduğu için alıcı her bala şüpheyle bakıp düşük fiyat veriyor. Analiz balın gerçek olduğunu belgeliyor: tüccar tenekeye 4.300–4.500 TL verirken, analizli balı alan kooperatif 5.300 TL ödüyor.',
    term: 'bilgi asimetrisi, kalite belgesi',
  },
  sozlesmeli: {
    title: 'Sözleşmeli üretim',
    body: 'Fiyat, hasattan önce fabrikayla sabitlendi: kilosu 4,25 TL. Halden düşük görünüyor, ama her kilonun satılacağı kesin. Hasan Dayı fiyat kumarından çıktı.',
    term: 'sözleşmeli üretim, fiyat riskinden korunma',
  },
  doygunluk: {
    title: 'Hal doldu',
    body: 'Aynı ay bölgedeki herkes domatesini hale getirdi. Arz talebi aştı ve fiyat çöktü. Bazı yıllar ürün tarlada kalır, çünkü toplama parasını bile çıkarmaz.',
    term: 'arz fazlası, fiyat oynaklığı',
  },
  'hal-kesintileri': {
    title: 'Haldeki kesintiler',
    body: 'Halde satılan her 100 TL\'lik domatesten komisyoncu en fazla 8 TL, hal rüsumu 1 TL, stopaj 2 TL keser. Toplama ve nakliye de üreticinin cebinden çıkar.',
    term: 'komisyon, hal rüsumu, müstahsil stopajı',
  },
  enflasyon: {
    title: 'Maliyet koşuyor, fiyat yürüyor',
    body: 'Üç ayda maliyetler %7\'den fazla arttı, tüccarın verdiği fiyat ise yalnız %3. Fiyatını geç güncelleyen, kâr ettiğini sanırken zarar eder.',
    term: 'enflasyon, fiyat yapışkanlığı',
  },
  faiz: {
    title: 'Kredi',
    body: 'Ticari kredi faizi yıllık %49 civarında (Eylül 2026). Aldığın her 250 bin TL için kasadan her ay yaklaşık 10 bin TL faiz çıkacak; bu yılda 120 bin TL\'yi aşar. Kredi sana zaman kazandırır, ama o zamanın getirisi faizden fazla olmalı.',
    term: 'kaldıraç, finansman maliyeti',
  },
}

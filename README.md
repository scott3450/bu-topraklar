# Bu Topraklar

Türkiye haritasında oynanan, öğretici bir tarım kooperatifi oyunu. Oyuncu bir kooperatif kurar,
küçük üreticileri bir araya getirir; daha çok, daha iyi, daha ucuza üretmeyi öğrenir. Oyun hem iş
kurmayı hem de Türkiye tarımını anlatır. Tarayıcıda çalışır.

*A teaching game about farming co-ops, played on the map of Türkiye. English below.*

## Çalıştırma

```sh
npm install
npm run dev      # geliştirme sunucusu, http://localhost:5173
npm run check    # tip kontrolü + testler + üretim derlemesi
npm run build    # dist/ klasörüne derler
```

`dist/` göreli yollarla derlenir; herhangi bir statik sunucuda, bir alt klasörde de çalışır.

## Yapı

| Klasör | İçindekiler |
| --- | --- |
| `src/sim/` | Simülasyon: ekonomi, aylar, olay kartları. Düz TypeScript, 3D'den bağımsız. |
| `src/chapter/` | Bölümler. `ch1`–`ch5` Aydın; `chMalatya`, `chRize` … il bölümleri. |
| `src/data/` | İller, ürünler, ürün aileleri, harita verisi. |
| `src/scene/` | 3D sahne (three + @react-three/fiber). |
| `src/ui/`, `src/defter/` | Kartlar, paneller, terim defteri. |
| `src/fx/` | Ses (kodla üretilir, ses dosyası yok) ve ayarlar. |
| `tests/` | İl verisi, simülasyon dengesi, bölüm akışları. |
| `tools/` | Harita verisini üreten Python betikleri. |

Simülasyon ile sahne aynı durumdan okur (zustand); oyun kuralı değişikliği `src/sim/`'de yapılır.

## Katkı

- **Rakamlar kaynaklı.** Her fiyat, verim ya da oran kodda yanında kaynağı ve tarihiyle durur
  (TÜİK, Tarım Bakanlığı, USK …). Kaynağı bulunamayan rakam "tahmini" diye işaretlenir.
- **Testler geçmeli.** `npm run check` yeşil olmadan değişiklik girmez. Ekonomiye dokununca
  `tests/denge.test.ts` oyun tarzlarının sıralamasını korur: planlı oyun, kriz yönetiminden; o da
  pasif oyundan iyi sonuç verir.
- **Yeni il bölümü:** `src/chapter/chMalatya.tsx` örnek alınır. Bölüm saf bir modelle hesaplar, en az
  iki kontrol ve önce bir tahmin ister; yıldız oyuncunun kararına göre verilir, şansa göre değil.
  `src/chapter/chapters.ts`'deki `OZEL` listesine eklenir; `tests/ozel.test.ts`'e il başına bir
  "bilinen sonuçlar" testi yazılır.
- **Yeni ürün ailesi:** veri `src/data/aileler.ts`, ekonomi `src/sim/engine.ts`, olay kartı
  `src/sim/events.ts`, panel `src/ui/SubePanel.tsx`, sonra test.
- **Az metin.** Oyuncu onsuz takılmayacaksa ekrana açıklama yazılmaz.

## Lisans

Kod [MIT](LICENSE). Harita verisi ayrı lisanslıdır: il sınırları geoBoundaries / OpenStreetMap,
**CC BY-SA 2.0**; komşu ülkeler Natural Earth, kamu malı. Ayrıntı: [data/KAYNAK.md](data/KAYNAK.md).

Bir [Orqova](https://orqova.com) projesi.

---

## English

**Bu Topraklar** ("these lands") is a browser game about farming in Türkiye. You set up a
cooperative, bring small growers together and learn how to produce more, better and cheaper. The
game is in Turkish.

**Run:** `npm install`, then `npm run dev`. `npm run check` runs type checks, tests and a production
build; `npm run build` writes a self-contained `dist/` with relative paths.

**Contributing:** every number in the game (prices, yields, rates) carries its source and date next to
it in the code; unsourced numbers are marked as estimates. Changes go in only with `npm run check`
passing. The simulation lives in `src/sim/` as plain TypeScript, separate from the 3D scene.

**License:** code under [MIT](LICENSE). Province boundaries come from geoBoundaries / OpenStreetMap
under **CC BY-SA 2.0**; neighbouring countries from Natural Earth (public domain).

# Veri kaynakları

- `tur-adm1.geojson`: geoBoundaries gbOpen TUR ADM1 (sadeleştirilmiş), commit 9469f09.
  Kaynak OpenStreetMap; lisans **CC BY-SA 2.0**. Yayınlanırsa atıf gerekir; değiştirilmiş harita
  verisi dağıtılırsa aynı lisansla. İndirildi: 2026-10-05.
  https://www.geoboundaries.org/api/current/gbOpen/TUR/ADM1/
- `src/data/provinces.json`: yukarıdakinden `tools/build_map.py` ile üretildi.
- `ne_10m_admin0.geojson`: Natural Earth 1:10m Admin 0 – Countries (kamu malı), nvkelso/natural-earth-vector
  master. İndirildi: 2026-10-05. `tools/build_neighbors.py` ile `src/data/neighbors.json` üretilir
  (Türkiye çevresine kırpılmış, sadeleştirilmiş; Türkiye hariç, BM ara bölgesi hariç).

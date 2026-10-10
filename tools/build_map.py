"""geoBoundaries TUR ADM1 (OSM, CC BY-SA 2.0) → src/data/provinces.json

Sadeleştirir (Douglas-Peucker), küçük adaları atar, düz koordinata çevirir
(eşdikdörtgen, 39°K'de enlem düzeltmesi), illeri 7 coğrafi bölgeye bağlar.
Çalıştır: python3 tools/build_map.py
"""
import json, math

SRC = 'data/tur-adm1.geojson'
OUT = 'src/data/provinces.json'
TOL = 0.012          # derece
MIN_AREA = 0.004     # derece², altındaki adalar atılır
LAT0, LON0 = 39.0, 35.2
SCALE = 1.0          # 1 birim ≈ 1 derece boylam

REGIONS = {
    'marmara': 'İstanbul Edirne Kırklareli Tekirdağ Çanakkale Balıkesir Bursa Bilecik Kocaeli Sakarya Yalova',
    'ege': 'İzmir Manisa Aydın Denizli Muğla Uşak Kütahya Afyonkarahisar',
    'akdeniz': 'Antalya Isparta Burdur Mersin Adana Osmaniye Hatay Kahramanmaraş',
    'icanadolu': 'Ankara Konya Karaman Aksaray Niğde Nevşehir Kırşehir Kırıkkale Kayseri Sivas Yozgat Çankırı Eskişehir',
    'karadeniz': 'Zonguldak Bartın Karabük Düzce Bolu Kastamonu Sinop Samsun Çorum Amasya Tokat Ordu Giresun Trabzon Rize Artvin Gümüşhane Bayburt',
    'doguanadolu': 'Erzurum Erzincan Kars Ardahan Iğdır Ağrı Van Muş Bitlis Bingöl Tunceli Elazığ Malatya Hakkâri',
    'guneydogu': 'Gaziantep Kilis Adıyaman Şanlıurfa Diyarbakır Mardin Batman Siirt Şırnak',
}
REGION_OF = {n: r for r, names in REGIONS.items() for n in names.split()}

def dp(pts, tol):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-12
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]
        d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return dp(pts[: idx + 1], tol)[:-1] + dp(pts[idx:], tol)

def area(r):
    return abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2

k = math.cos(math.radians(LAT0))
def proj(lon, lat):
    # x doğu, z güney (three.js'te -z kuzey)
    return [round((lon - LON0) * k * SCALE, 4), round(-(lat - LAT0) * SCALE, 4)]

if __name__ == '__main__':
    feats = json.load(open(SRC))['features']
    out, total = [], 0
    for f in feats:
        name = f['properties']['shapeName']
        g = f['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        shapes = []
        for poly in polys:
            outer = poly[0]  # il sınırlarında delik yok sayılır
            if area(outer) < MIN_AREA:
                continue
            # kapalı halkada uçlar çakışır; ikiye bölüp ayrı sadeleştir
            pts = outer[:-1]
            h = len(pts) // 2
            ring = dp(pts[: h + 1], TOL)[:-1] + dp(pts[h:] + [pts[0]], TOL)[:-1]
            if len(ring) >= 3:
                shapes.append([proj(*p) for p in ring])
                total += len(ring)
        assert name in REGION_OF, name
        out.append({'name': name, 'iso': f['properties']['shapeISO'], 'region': REGION_OF[name], 'shapes': shapes})

    json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(out), 'il,', total, 'nokta')

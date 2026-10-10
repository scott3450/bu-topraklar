"""Natural Earth 10m ülkeler (kamu malı) → src/data/neighbors.json

Türkiye çevresindeki ülkeleri bir kutuya kırpar, sadeleştirir, provinces.json ile aynı düz
koordinata çevirir. Türkiye dışarıda (iller geoBoundaries'ten). Çalıştır: python3 tools/build_neighbors.py
"""
import json, math, sys
sys.path.insert(0, 'tools')
from build_map import dp, area, LAT0, LON0, SCALE

SRC = 'data/ne_10m_admin0.geojson'
OUT = 'src/data/neighbors.json'
BOX = (10.0, 24.0, 60.0, 54.0)  # lon0, lat0, lon1, lat1 — kare ekranda da kenar görünmesin
TOL = 0.03
MIN_AREA = 0.02
k = math.cos(math.radians(LAT0))

def proj(lon, lat):
    return [round((lon - LON0) * k * SCALE, 3), round(-(lat - LAT0) * SCALE, 3)]

def clip(ring, box):
    x0, y0, x1, y1 = box
    def edge(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a, b))
                out.append(b)
            elif inside(a):
                out.append(inter(a, b))
        return out
    def ix(a, b, x): t = (x - a[0]) / (b[0] - a[0]); return [x, a[1] + t * (b[1] - a[1])]
    def iy(a, b, y): t = (y - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y]
    p = ring
    for inside, inter in [
        (lambda q: q[0] >= x0, lambda a, b: ix(a, b, x0)),
        (lambda q: q[0] <= x1, lambda a, b: ix(a, b, x1)),
        (lambda q: q[1] >= y0, lambda a, b: iy(a, b, y0)),
        (lambda q: q[1] <= y1, lambda a, b: iy(a, b, y1)),
    ]:
        if not p: break
        p = edge(p, inside, inter)
    return p

names = {'CYP': 'Kıbrıs', 'CYN': 'Kıbrıs'}
out = []
for f in json.load(open(SRC))['features']:
    pr = f['properties']
    if pr['ADM0_A3'] == 'TUR' or 'Buffer' in pr['NAME']:
        continue
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    shapes = []
    for poly in polys:
        ring = clip(poly[0][:-1], BOX)
        if len(ring) < 3 or area(ring) < MIN_AREA:
            continue
        h = len(ring) // 2
        r = dp(ring[: h + 1], TOL)[:-1] + dp(ring[h:] + [ring[0]], TOL)[:-1]
        if len(r) >= 3:
            shapes.append([proj(*q) for q in r])
    if not shapes:
        continue
    name = names.get(pr['ADM0_A3'], pr.get('NAME_TR') or pr['NAME'])
    lx, ly = pr.get('LABEL_X'), pr.get('LABEL_Y')
    inbox = lx is not None and BOX[0] + 1 < lx < BOX[2] - 1 and BOX[1] + 0.5 < ly < BOX[3] - 0.5
    out.append({'name': name, 'a3': pr['ADM0_A3'], 'shapes': shapes, 'label': proj(lx, ly) if inbox else None})

json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'ülke:', ', '.join(f"{c['name']}{'' if c['label'] else '*'}" for c in out))

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { EkranUyari } from './ui/EkranUyari'
import { useNarrow } from './ui/useNarrow'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { palette } from './theme/palettes'
import { seasonal } from './theme/season'
import { PaletteContext } from './scene/kit'
import { Valley } from './scene/Valley'
import { SEA, TurkeyMap, provinceCenter } from './scene/TurkeyMap'
import { Bounds, FitZoom, FlyTo } from './scene/Camera'
import { NorthButton, NorthKeeper } from './scene/North'
import { IlScene } from './scene/IlScene'
import { ilPlan } from './scene/ilgen'
import { IlHud } from './ui/IlHud'
import { CropCard, TopBar } from './ui/Hud'
import { Intro, introSeen } from './ui/Intro'
import { SubePanel } from './ui/SubePanel'
import { CoopPanel, EndMonthBar, GameBar, GrowthToast, ProducerPanel, ReportModal } from './ui/GameHud'
import { useGame } from './sim/store'
import { YearEnd } from './ui/YearEnd'
import { BolgeHedefi } from './ui/Final'
import { SoundToggle } from './fx/SoundToggle'
import { Ambience } from './fx/Ambience'
import { SettingsPanel } from './fx/SettingsPanel'
import { Defter } from './defter/Defter'
import { tier, useSettings } from './fx/settings'
import { ChapterHud } from './chapter/ChapterHud'
import { ChapterMenu } from './chapter/ChapterMenu'
import { ChapterRunner } from './chapter/Runner'
import { useChapter } from './chapter/engine'
import { chapterById } from './chapter/chapters'
import { growth, type ProducerId } from './sim/engine'
import type { Crop } from './data/crops'

type View = 'map' | 'ege' | 'explore'

// kamera yüksekliği sabit kalsın: yalnız sağa-sola dönülür (başlangıç pozisyonlarının eğimi)
const MAP_POLAR = Math.atan2(12, 16)
const SCENE_POLAR = Math.atan2(Math.hypot(80, 80), 72)

function Lights({ color = '#ffffff', intensity = 1.6, dusk = false, night = 0 }: { color?: string; intensity?: number; dusk?: boolean; night?: number }) {
  const T = tier(useSettings((s) => s.quality))
  const sun = useRef<THREE.DirectionalLight>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const base = useMemo(() => new THREE.Color(color), [color])
  const evening = useMemo(() => new THREE.Color('#ff9a5a'), [])
  const moon = useMemo(() => new THREE.Color('#7d93c9'), [])
  // ay geçerken alacakaranlık: ışık kısılıp turuncuya döner, sonra sabah olur
  useFrame((_, dt) => {
    const l = sun.current
    const a = amb.current
    if (!l || !a) return
    // gece (özel bölüm): ışık kısılır, ay ışığı mavisine döner
    const n = night
    l.intensity = THREE.MathUtils.damp(l.intensity, dusk ? intensity * 0.3 : intensity * (1 - 0.72 * n), 2.5, dt)
    a.intensity = THREE.MathUtils.damp(a.intensity, dusk ? 0.45 : 0.9 - 0.55 * n, 2.5, dt)
    l.color.lerp(dusk ? evening : n > 0.05 ? base.clone().lerp(moon, n) : base, 1 - Math.exp(-3 * dt))
  })
  return (
    <>
      <ambientLight ref={amb} intensity={0.9} />
      <directionalLight
        ref={sun}
        position={[8, 16, 6]}
        color={color}
        intensity={intensity}
        castShadow
        shadow-mapSize={[T.shadowMap, T.shadowMap]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
    </>
  )
}

/** İlk kare çizilince index.html'deki yükleniyor ekranını söndürür (yalnız bir kez). */
function IlkKare() {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    const el = document.getElementById('yukleniyor')
    if (!el) return
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 450)
  })
  return null
}

export default function App() {
  // ?il=Mersin ile doğrudan bir ilin sahnesi açılır
  const urlIl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('il') : null
  const [view, setView] = useState<View>(urlIl && urlIl !== 'Aydın' ? 'explore' : 'map')
  const narrow = useNarrow()
  const quality = useSettings((s) => s.quality)
  const calm = useSettings((s) => s.calm)
  const T = tier(quality)
  const [flying, setFlying] = useState<string | null>(null) // uçulan il
  const [ilName, setIlName] = useState<string>(urlIl && urlIl !== 'Aydın' ? urlIl : 'Aydın')
  const [free, setFree] = useState(false) // serbest yıl (eski tam oyun)
  const chapterId = useChapter((c) => c.chapter)
  const chStep = useChapter((c) => c.step)
  const leaveChapter = useChapter((c) => c.leave)
  const def = chapterId ? chapterById(chapterId) : null
  const doneChapters = useChapter((c) => c.done)
  const [intro, setIntro] = useState(() => !urlIl && !introSeen())
  const [veil, setVeil] = useState(false) // geçişte ekranı örten perde
  const [veilColor, setVeilColor] = useState(SEA)

  const arriveTo = (to: string) => {
    setFlying(null)
    setIlName(to)
    if (to === 'Aydın') {
      leaveChapter()
      setFree(false)
    }
    setView(to === 'Aydın' ? 'ege' : 'explore')
  }
  const arrive = () => {
    const to = flying ?? 'Aydın'
    setFlying(null)
    setIlName(to)
    if (to === 'Aydın') {
      leaveChapter() // önce bölüm seçme ekranı
      setFree(false)
    }
    setView(to === 'Aydın' ? 'ege' : 'explore')
    setTimeout(() => setVeil(false), 80)
  }
  const back = () => {
    if (def?.il) leaveChapter()
    setVeilColor(SEA)
    setVeil(true)
    setTimeout(() => {
      setView('map')
      setProducer(null)
      setTimeout(() => setVeil(false), 80)
    }, 260)
  }
  const [crop, setCrop] = useState<Crop | null>(null)
  const [producer, setProducer] = useState<ProducerId | null>(null)
  const members = useGame((g) => g.s.members)
  const gameState = useGame((g) => g.s)
  const freeGrowth = useMemo(() => growth(gameState), [gameState])
  const month = useGame((g) => g.s.month)
  const chapterPlaying = !!def && !free && !def.il
  const ilChapter = def?.il && view === 'explore' && def.il === ilName ? def : null
  const targetMonth = !free && def?.valleyMonth ? def.valleyMonth(chStep) : Math.min(month, 11)
  const [sceneMonth, setSceneMonth] = useState(targetMonth)
  const [dusk, setDusk] = useState(false)
  useEffect(() => {
    if (targetMonth === sceneMonth) return
    // bölümde aylar sık değişir: alacakaranlık oynatılmaz, mevsim doğrudan değişir
    if (calm || chapterPlaying) {
      setSceneMonth(targetMonth)
      return
    }
    setDusk(true)
    const a = setTimeout(() => setSceneMonth(targetMonth), 650)
    const b = setTimeout(() => setDusk(false), 900)
    return () => (clearTimeout(a), clearTimeout(b))
  }, [targetMonth, sceneMonth, calm, chapterPlaying])
  const season = seasonal(palette, sceneMonth)
  const explore = useMemo(() => (view === 'explore' ? ilPlan(ilName) : null), [view, ilName])
  const scenePal = view === 'map' ? palette : explore ? { ...palette, land: explore.land } : season
  const sceneBg = view === 'map' ? SEA : explore ? explore.background : season.background
  const flyBg = flying && flying !== 'Aydın' ? ilPlan(flying).background : season.background
  const showReport = useGame((g) => g.showReport)
  const isBranch = useGame((g) => g.s.subeler.some((b) => b.il === ilName))
  const over = useGame((g) => g.s.over)

  return (
    <div style={{ position: 'relative', height: '100%', background: sceneBg }}>
      <Canvas
        key={view}
        orthographic
        flat
        shadows={T.shadows}
        dpr={narrow ? [1, Math.min(1.5, T.dpr[1])] : T.dpr}
        onPointerMissed={() => (setCrop(null), setProducer(null))}
        camera={
          view === 'map'
            ? { position: [0, 16, 12] }
            : { position: [80, 72, 80], far: 2000 } // uzakta: geniş arazinin önü kırpılmasın
        }
      >
        <color attach="background" args={[sceneBg]} />
        {view === 'map' ? (
          <FitZoom width={narrow ? 15.5 : 16} height={9} from={calm ? 1 : 1.6} />
        ) : view === 'explore' ? (
          <FitZoom width={narrow ? 20 : 31} height={27} from={calm ? 1 : 0.62} />
        ) : (
          <FitZoom width={narrow ? 17 : 24} height={21} from={calm ? 1 : 0.62} />
        )}
        {!flying &&
          (view === 'map' ? (
            <Bounds x={[-9, 9]} z={[-5, 5.5]} zoomIn={5} />
          ) : view === 'explore' ? (
            <Bounds x={[-20, 20]} z={[-20, 20]} zoomIn={6} zoomOut={0.4} fixed />
          ) : (
            <Bounds x={[-20, 20]} z={[-22, 18]} zoomIn={6} zoomOut={0.4} fixed />
          ))}
        {view !== 'map' && <fog attach="fog" args={[sceneBg, 150, 205]} />}
        {view !== 'map' && T.ambience && <Ambience birds={!calm} clouds={T.clouds} />}
        {flying && <FlyTo to={provinceCenter(flying)} onFade={() => (setVeilColor(flyBg), setVeil(true))} onDone={arrive} />}
        {view === 'ege' ? (
          <Lights color={chapterPlaying ? '#fff1dc' : season.light} intensity={chapterPlaying ? Math.max(1.6, season.lightIntensity) : season.lightIntensity} dusk={dusk && !chapterPlaying} />
        ) : (
          <Lights color="#fff1dc" night={ilChapter?.night ? ilChapter.night(chStep) : 0} />
        )}
        <PaletteContext.Provider value={scenePal}>
          {view === 'map' ? (
            <TurkeyMap onPick={(r) => (setCrop(null), calm ? arriveTo(r) : setFlying(r))} selected={crop} onSelect={setCrop} done={doneChapters.length} doneList={doneChapters} />
          ) : explore ? (
            <group>
              <IlScene plan={explore} />
              {ilChapter && <ChapterRunner def={ilChapter} />}
            </group>
          ) : (
            <group position={[-0.5, 0, -2.2]}>
              <Valley
                month={sceneMonth}
                members={members}
                selected={producer}
                onPick={setProducer}
                chapter={!free}
                upgrades={free ? freeGrowth : doneChapters}
                playing={!!def && !free}
              />
              {def && !free && !def.il && <ChapterRunner def={def} />}
            </group>
          )}
        </PaletteContext.Provider>
        <OrbitControls
          makeDefault
          enableRotate
          rotateSpeed={0.6}
          minPolarAngle={view === 'map' ? MAP_POLAR : SCENE_POLAR}
          maxPolarAngle={view === 'map' ? MAP_POLAR : SCENE_POLAR}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        />
        <NorthKeeper />
        <IlkKare />
      </Canvas>

      {view === 'map' ? (
        <>
          <TopBar p={palette} />
          {!intro && <BolgeHedefi p={palette} />}
          {crop && <CropCard p={palette} crop={crop} onClose={() => setCrop(null)} />}
          {intro && <Intro p={palette} onDone={() => setIntro(false)} />}
        </>
      ) : explore && ilChapter ? (
        <ChapterHud p={palette} def={ilChapter} onMenu={leaveChapter} />
      ) : explore ? (
        <>
          <IlHud p={palette} name={explore.name} region={explore.region} climate={explore.climate} onBack={back} done={doneChapters} />
          <SubePanel p={palette} il={explore.name} />
          {isBranch && (
            <>
              <EndMonthBar p={palette} />
              {showReport && (over ? <YearEnd p={palette} onMap={back} /> : <ReportModal p={palette} />)}
            </>
          )}
        </>
      ) : !free && def && !def.il ? (
        <ChapterHud p={palette} def={def} onMenu={leaveChapter} />
      ) : !free ? (
        <ChapterMenu p={palette} onBack={back} onFree={() => setFree(true)} />
      ) : (
        <>
          <GameBar p={palette} onBack={back} />
          {producer && <ProducerPanel p={palette} id={producer} onClose={() => setProducer(null)} />}
          <CoopPanel p={palette} />
          <EndMonthBar p={palette} />
          <GrowthToast p={palette} />
          {showReport && (over ? <YearEnd p={palette} onMap={back} /> : <ReportModal p={palette} />)}
        </>
      )}

      <NorthButton p={palette} />
      <SoundToggle p={palette} />
      <SettingsPanel p={palette} />
      <Defter p={palette} />
      <EkranUyari p={palette} bg={SEA} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: veilColor,
          opacity: veil ? 1 : 0,
          transition: `opacity ${veil ? 260 : 520}ms ease`,
        }}
      />
    </div>
  )
}

// ============================================================
// Trading Tazos Game — BagOpener3D v7
//
// Premium bag opening experience.
// - Transparent background, just the 3D bag floating
// - Cut guide line on the bag surface
// - Real-time tear path following finger/mouse drag
// - Tazo rises from inside with bounce + particles
// ============================================================
"use client"

import { useRef, useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Line } from "@react-three/drei"
import * as THREE from "three"
import PotatoChipBag3D, {
  BAG_W_TOP, BAG_H, BAG_D,
} from "./3d/potato-chip-bag-3d"
import { pickBagVariant } from "@/lib/bag-variants"
import { playSFX } from "@/lib/audio/sfx-engine"

// Bag body center Y (computed from exported constants)
const TOP_CRIMP = 0.14, BOT_CRIMP = 0.12
const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2

// ══════════════════════════════════════════════════════════
// TAZO DISC — rises from inside bag with elastic bounce
// ══════════════════════════════════════════════════════════
function TazoDisc({ active, color, onRise, onComplete }: {
  active: boolean; color: string; onRise?: () => void; onComplete?: () => void
}) {
  const ref = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const activeSince = useRef(0)
  const riseDone = useRef(false)
  const completed = useRef(false)

  useFrame((_, delta) => {
    if (!active) { activeSince.current = 0; riseDone.current = false; completed.current = false; return }
    if (activeSince.current === 0) activeSince.current = Date.now()
    const elapsed = (Date.now() - activeSince.current) / 1000
    const delay = 0.38
    const rawT = Math.max(0, Math.min(1, (elapsed - delay) / 0.7))
    const eased = elasticOut(rawT)

    if (ref.current) {
      if (rawT > 0.001) {
        ref.current.visible = true
        ref.current.position.y = bodyY + eased * 0.7
        ref.current.position.z = -BAG_D * 0.02 + eased * 0.65
        const s = 0.08 + eased * 1.15
        ref.current.scale.setScalar(s)
        ref.current.rotation.y += delta * (0.6 + eased * 2.8)
        ref.current.rotation.z = Math.sin(Date.now() * 0.003) * 0.08
      } else { ref.current.visible = false }
    }
    if (glowRef.current) {
      if (ref.current?.visible) glowRef.current.position.copy(ref.current.position)
      glowRef.current.scale.setScalar((0.1 + eased * 1.1) * (1.4 + Math.sin(Date.now()*0.005)*0.4))
      if (!Array.isArray(glowRef.current.material)) {
        glowRef.current.material.opacity = 0.15 + eased * 0.5 + Math.sin(Date.now()*0.006)*0.08
      }
      glowRef.current.visible = eased > 0.03
    }
    if (rawT >= 0.55 && !riseDone.current) { riseDone.current = true; onRise?.() }
    if (eased >= 0.97 && !completed.current) { completed.current = true; setTimeout(() => onComplete?.(), 300) }
  })

  return (<group>
    <mesh ref={ref} rotation={[Math.PI/2,0,0]} visible={false}>
      <cylinderGeometry args={[0.14,0.14,0.04,48]} />
      <meshStandardMaterial color={color} roughness={0.08} metalness={0.85} emissive={color} emissiveIntensity={0.7} />
    </mesh>
    <mesh ref={glowRef} visible={false}>
      <ringGeometry args={[0.07,0.21,48]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  </group>)
}

function elasticOut(t: number): number { return t===0||t===1 ? t : Math.pow(2,-10*t)*Math.sin((t-0.075)*(2*Math.PI)/0.3)+1 }

// ══════════════════════════════════════════════════════════
// PARTICLES
// ══════════════════════════════════════════════════════════
function Particles({ active, color }: { active: boolean; color: string }) {
  const ref = useRef<THREE.Points>(null!)
  const started = useRef(false)
  const count = 72
  const velocities = useMemo(() => Array.from({length:count},()=>({
    vx:(Math.random()-0.5)*0.055, vy:0.025+Math.random()*0.07, vz:(Math.random()-0.5)*0.045
  })),[])
  useFrame(()=>{
    if(!ref.current) return
    const attr = ref.current.geometry.attributes.position, mat = ref.current.material
    if(active) {
      if(!started.current) { for(let i=0;i<count;i++){attr.array[i*3]=(Math.random()-0.5)*1.2;attr.array[i*3+1]=(Math.random()-0.5)*2.0;attr.array[i*3+2]=(Math.random()-0.5)*0.8}started.current=true }
      for(let i=0;i<count;i++){attr.array[i*3]+=velocities[i].vx;attr.array[i*3+1]+=velocities[i].vy;attr.array[i*3+2]+=velocities[i].vz}
      if(!Array.isArray(mat)) mat.opacity=Math.min(0.9,(mat.opacity||0)+0.03)
    } else { started.current=false; if(!Array.isArray(mat)) mat.opacity=Math.max(0,(mat.opacity||0)-0.05) }
    attr.needsUpdate=true
  })
  return (<points ref={ref}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array(count*3),3]} /></bufferGeometry>
    <pointsMaterial color={color} size={0.05} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
  </points>)
}

// ══════════════════════════════════════════════════════════
// CUT GUIDE — dashed line showing where to tear
// ══════════════════════════════════════════════════════════
function CutGuide({ color, visible }: { color: string; visible: boolean }) {
  if (!visible) return null
  const hw = BAG_W_TOP * 0.42
  const segs = 16
  const pts = useMemo(() => {
    const arr: THREE.Vector3[] = []
    for (let i = 0; i <= segs; i++) {
      arr.push(new THREE.Vector3(-hw + (2*hw*i)/segs, bodyY + 0.52, BAG_D/2 + 0.02))
    }
    return arr
  }, [])
  return (
    <group>
      {/* Dashed cut guide */}<Line points={pts} color={color} lineWidth={2} transparent opacity={0.6} dashed dashSize={0.06} gapSize={0.04} />
      {/* Scissors icon hint dots */}<mesh position={[-hw, bodyY+0.52, BAG_D/2+0.03]}>
        <sphereGeometry args={[0.025,12,12]} /><meshBasicMaterial color={color} />
      </mesh><mesh position={[hw, bodyY+0.52, BAG_D/2+0.03]}>
        <sphereGeometry args={[0.025,12,12]} /><meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

// ══════════════════════════════════════════════════════════
// TEAR INDICATOR — glowing path following the drag
// ══════════════════════════════════════════════════════════
function TearIndicator({ points, color }: { points: {x:number;y:number}[]; color:string }) {
  const pts3D = useMemo(() => {
    if (points.length < 2) return []
    return points.map(p => new THREE.Vector3(p.x, p.y, BAG_D/2 + 0.018))
  }, [points])
  if (pts3D.length < 2) return null
  return (
    <group>
      <Line points={pts3D} color={color} lineWidth={3.5} transparent opacity={0.9} depthTest={false} />
      <Line points={pts3D.map(p=>p.clone().add(new THREE.Vector3(0,0,0.003)))} color="#ffffff" lineWidth={1.5} transparent opacity={0.5} depthTest={false} />
      {pts3D.map((p,i) => i % 6 === 0 ? (<mesh key={i} position={p.clone().add(new THREE.Vector3(0,0,0.012))}><sphereGeometry args={[0.018,8,8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.8} /></mesh>) : null)}
    </group>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
export interface BagData { id: string; bagType?: string; preview?: { franchise?: { slug?: string } } | null }

export default function BagOpener3D({ bag, onOpen, onSkip }: { bag: BagData | null; onOpen: () => void; onSkip: () => void }) {
  const { frontUrl, backUrl, franchise } = useMemo(() => {
    const slug = bag?.preview?.franchise?.slug
    return pickBagVariant(slug)
  }, [bag])

  const [stage, setStage] = useState<"idle"|"tearing"|"opening"|"reveal">("idle")
  const [tearProgress, setTearProgress] = useState(0)
  const [flashActive, setFlashActive] = useState(false)
  const tearPaths = useRef<{x:number;y:number}[]>([])
  const tearing = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasH, setCanvasH] = useState(520)

  useEffect(() => { const u = () => { const w = containerRef.current?.clientWidth||500; setCanvasH(Math.min(600,Math.max(420,w*1.0))) }; u(); window.addEventListener("resize",u); return ()=>window.removeEventListener("resize",u) }, [])

  const franchiseColor = useMemo(() => { const c: Record<string,string>={minimon:"#FFCC00",cybermon:"#3B82F6",dracobell:"#F97316"}; return c[franchise]||"#FFCC00" }, [franchise])

  const handlePointerDown = useCallback(() => { if(stage==="opening"||stage==="reveal")return; tearing.current=true; tearPaths.current=[]; setStage("tearing"); setTearProgress(0); playSFX('bag_tear',{volume:0.35}) }, [stage])
  const handlePointerMove = useCallback((e:THREE.Event)=>{ if(!tearing.current||stage!=="tearing")return; const uv=(e as any).uv; if(!uv)return; const x=(uv.x-0.5)*BAG_W_TOP, y=(uv.y-0.5)*BAG_H; tearPaths.current.push({x,y}); const pts=tearPaths.current; if(pts.length>=4){ const xspan=Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x)); const yspan=Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y)); const p=Math.min(1,xspan*2.6+yspan*0.35); setTearProgress(p); if(p>=0.9){tearing.current=false;setTearProgress(1);playSFX('bag_open',{volume:0.6});setTimeout(()=>setStage("opening"),80)} } }, [stage])
  const handlePointerUp = useCallback(() => { tearing.current=false; if(tearPaths.current.length<4&&stage==="tearing"){setTearProgress(0);setStage("idle")} }, [stage])
  const handleSkip = useCallback(() => { tearing.current=false; setTearProgress(1); playSFX('bag_open',{volume:0.55}); setStage("opening") }, [])
  const handleTazoRise = useCallback(() => { setFlashActive(true); setTimeout(()=>setFlashActive(false),350) }, [])
  const handleTazoComplete = useCallback(() => { playSFX('reveal',{volume:0.55}); setStage("reveal"); setTimeout(()=>onOpen(),500) }, [onOpen])

  const isOpening = stage === "opening" || stage === "reveal"

  return (
    <div ref={containerRef} className="relative w-full select-none touch-none" style={{ height: canvasH }}>
      {/* Screen flash */}
      <div className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-200" style={{ opacity: flashActive?1:0, background: `radial-gradient(ellipse at 50% 50%, ${franchiseColor}40 0%, transparent 70%)` }} />

      <Canvas camera={{ position: [0,0.02,2.0], fov:38 }}
        gl={{ antialias:true, alpha:true, premultipliedAlpha:false }}
        style={{ background: "transparent" }}
        onCreated={({gl}) => { gl.setClearColor(0x000000,0); gl.setPixelRatio(Math.min(window.devicePixelRatio,2)) }}>
        <ambientLight intensity={0.75} />
        <spotLight position={[4,3.5,5]} intensity={3.5} angle={0.35} penumbra={0.4} color="#fffef5" />
        <spotLight position={[-3,2.5,-4]} intensity={2.0} angle={0.32} penumbra={0.5} color="#fffef5" />
        <pointLight position={[0,-1.5,3.5]} intensity={0.7} color={franchiseColor} />
        <pointLight position={[-2,0,2.5]} intensity={0.4} color="#ffccdd" />

        <Suspense fallback={null}>
          <PotatoChipBag3D frontUrl={frontUrl} backUrl={backUrl} scale={1.2}
            interactive={stage==="idle"||stage==="tearing"} opening={isOpening}
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
          <TazoDisc active={isOpening} color={franchiseColor} onRise={handleTazoRise} onComplete={handleTazoComplete} />
        </Suspense>

        <CutGuide color={franchiseColor} visible={stage==="idle"} />
        {stage==="tearing" && tearPaths.current.length>1 && (
          <TearIndicator points={tearPaths.current} color={franchiseColor} />
        )}
        <Particles active={isOpening} color={franchiseColor} />
      </Canvas>

      {/* ═══ UI OVERLAY ═══ */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-10 px-4">
        {stage === "idle" && (
          <div className="flex flex-col items-center gap-2">
            <div className="px-8 py-3 font-black text-sm uppercase tracking-[0.15em] border-[3px] cursor-pointer active:scale-95 transition-all duration-150 animate-pulse"
              style={{ backgroundColor: franchiseColor, color: "#1a1a1a", borderColor: "#1a1a1a", boxShadow: "4px 4px 0px #1a1a1a", animation: "none" }}>
              ✂ DRAG TO OPEN!
            </div>
            <span className="text-[9px] font-bold text-black/20 uppercase tracking-[0.2em]">slide finger across the top seal</span>
          </div>
        )}
        {stage === "tearing" && (
          <div className="flex items-center gap-3 w-full max-w-[340px]">
            <div className="flex-1"><div className="h-3 bg-black/10 border border-black/10 overflow-hidden rounded"><div className="h-full transition-all duration-75 rounded" style={{ width: `${Math.round(tearProgress*100)}%`, background: franchiseColor, boxShadow: `0 0 12px ${franchiseColor}60` }} /></div></div>
            <span className="text-xs font-black text-black/40 tabular-nums w-8 text-right">{Math.round(tearProgress*100)}%</span>
            <button onClick={handleSkip} className="px-3 py-1.5 bg-black/5 border border-black/10 text-black/40 text-[10px] font-black uppercase hover:bg-black/10 hover:text-black/60 rounded">Skip</button>
          </div>
        )}
        {stage === "opening" && (
          <div className="px-6 py-2.5 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]" style={{ backgroundColor: `${franchiseColor}f0` }}>
            <span className="font-black text-xs text-[#1a1a1a] uppercase tracking-[0.2em] animate-pulse">Opening…</span>
          </div>
        )}
        {stage === "reveal" && <div className="text-[9px] font-black text-black/10 uppercase tracking-[0.3em]" />}
      </div>
    </div>
  )
}

// ============================================================
// Trading Tazos Game — Battle Arena 3D v4 (Vertical Slam)
//
// Arena scene composer — imports focused sub-components:
//   ArenaFloor, ArenaPillars, ArenaReticle, StakedTazoMesh,
//   AirborneTazoMesh, ArenaCamera, ArenaImpactEffects
//
// CORRECT MECHANIC:
//   Staked tazos sit face-down on arena center.
//   Launcher tazo hangs in the AIR above the circle.
//   Falls vertically on release — impacts face-down tazos.
//   Impact solves flip, wobble, or miss.
//   Camera: top-down aiming → side charging → cinematic slam.
// ============================================================
"use client"

import { Suspense, useRef, useMemo, useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import * as THREE from "three"
import { BATTLE_COLORS } from "@/lib/battle/colors"
import type { Arena3DConfig, StakedTazo, AirborneTazo } from "@/lib/battle/game-loop"
import BattleDeckTube from "./battle-deck-tube"

// Arena sub-components
import { THEME_COLORS } from "../arena/ArenaTheme"
import { ArenaFloor } from "../arena/ArenaFloor"
import { ArenaPillars } from "../arena/ArenaPillars"
import { ArenaReticle } from "../arena/ArenaReticle"
import { StakedTazoMesh } from "../arena/StakedTazoMesh"
import { AirborneTazoMesh } from "../arena/AirborneTazoMesh"
import { ArenaCamera } from "../arena/ArenaCamera"
import { ImpactSpark, ImpactLight } from "../arena/ArenaImpactEffects"

// ─── Scene ───
interface SceneProps {
  config: Arena3DConfig
  stakedTazos: StakedTazo[]
  airborneTazo: AirborneTazo | null
  gamePhase: string
  showReticle: boolean
  reticleX: number
  reticleZ: number
  playerDeckCount?: number
  playerDeckTotal?: number
  playerDeckFranchise?: string
  playerDeckImages?: string[]
  opponentDeckCount?: number
  opponentDeckTotal?: number
  opponentDeckFranchise?: string
  opponentDeckImages?: string[]
  isDrawing?: boolean
  drawTrigger?: number
}

function Scene({
  config, stakedTazos, airborneTazo,
  gamePhase, showReticle, reticleX, reticleZ,
  playerDeckCount = 0, playerDeckTotal = 0,
  playerDeckFranchise = "minimon",
  playerDeckImages = [],
  opponentDeckCount = 0, opponentDeckTotal = 0,
  opponentDeckFranchise = "minimon",
  opponentDeckImages = [],
  isDrawing = false, drawTrigger = 0,
}: SceneProps) {
  const [impactCount, setImpactCount] = useState(0)
  const prevPhase = useRef(gamePhase)

  // Trigger spark on impact
  useEffect(() => {
    if (gamePhase === "physics_resolve" && prevPhase.current !== "impact") {
      setImpactCount(c => c + 1)
    }
    prevPhase.current = gamePhase
  }, [gamePhase])

  // Impact position: use the airborne tazo's target or center
  const impactPos = useMemo(() => {
    if (airborneTazo) {
      return [airborneTazo.position[0], 0.04, airborneTazo.position[2]] as [number, number, number]
    }
    return [0, 0.04, 0] as [number, number, number]
  }, [airborneTazo?.position])

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 14, 3]} intensity={0.7} />
      <directionalLight position={[-4, 8, -5]} intensity={0.15} />
      <spotLight position={[0, 12, 0]} angle={0.7} penumbra={0.6} intensity={2.5} color="#FFF5E0" />

      <ArenaFloor config={config} />
      <ArenaPillars config={config} />

      {/* Player Deck Tube (visible in arena) */}
      {playerDeckTotal > 0 && (
        <BattleDeckTube
          position={[config.radius * 1.05, 0, config.radius * 0.3]}
          franchise={playerDeckFranchise}
          remainingCount={playerDeckCount}
          totalCount={playerDeckTotal}
          isPlayer={true}
          isDrawing={isDrawing}
          drawTrigger={drawTrigger}
          tazoImageUrls={playerDeckImages}
        />
      )}

      {/* Opponent Deck Tube */}
      {opponentDeckTotal > 0 && (
        <BattleDeckTube
          position={[-config.radius * 1.05, 0, -config.radius * 0.3]}
          franchise={opponentDeckFranchise}
          remainingCount={opponentDeckCount}
          totalCount={opponentDeckTotal}
          isPlayer={false}
          isDrawing={isDrawing}
          drawTrigger={drawTrigger}
          tazoImageUrls={opponentDeckImages}
        />
      )}

      {/* Player/opponent direction markers */}
      <mesh position={[0, 0.03, config.radius * 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 0.5]} />
        <meshBasicMaterial color={BATTLE_COLORS.player} transparent opacity={0.25} side={2} />
      </mesh>
      <mesh position={[0, 0.03, -config.radius * 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 0.5]} />
        <meshBasicMaterial color={BATTLE_COLORS.opponent} transparent opacity={0.25} side={2} />
      </mesh>

      {/* Staked tazos */}
      {stakedTazos.map(st => (
        <StakedTazoMesh key={st.id} staked={st} />
      ))}

      {/* Airborne launcher */}
      {airborneTazo && (
        <AirborneTazoMesh
          airborne={airborneTazo}
          isPlayer={airborneTazo.owner === "player"}
          stakedPositions={stakedTazos.map((st) => st.position)}
        />
      )}

      {/* Reticle */}
      <ArenaReticle
        position={[reticleX, 0.06, reticleZ]}
        visible={showReticle}
        gamePhase={gamePhase}
      />

      <ArenaCamera gamePhase={gamePhase} />

      {/* Impact flash light */}
      <ImpactLight impactPhase={gamePhase} />

      {/* Impact spark burst */}
      <ImpactSpark trigger={impactCount} pos={impactPos} />
    </>
  )
}

// ─── Main Export ───
interface Props {
  config: Arena3DConfig
  stakedTazos: StakedTazo[]
  airborneTazo: AirborneTazo | null
  gamePhase: string
  showReticle?: boolean
  reticleX?: number
  reticleZ?: number
  children?: React.ReactNode
  playerDeckCount?: number
  playerDeckTotal?: number
  playerDeckFranchise?: string
  playerDeckImages?: string[]
  opponentDeckCount?: number
  opponentDeckTotal?: number
  opponentDeckFranchise?: string
  opponentDeckImages?: string[]
  isDrawing?: boolean
  drawTrigger?: number
}

export default function BattleArena3D({
  config, stakedTazos, airborneTazo, gamePhase,
  showReticle = false, reticleX = 0, reticleZ = 0,
  children, playerDeckCount, playerDeckTotal,
  playerDeckFranchise, playerDeckImages,
  opponentDeckCount, opponentDeckTotal,
  opponentDeckFranchise, opponentDeckImages,
  isDrawing, drawTrigger,
}: Props) {
  return (
    <div className="w-full h-full relative" style={{ background: THEME_COLORS[config?.theme || "default"]?.bgGradient || "radial-gradient(ellipse at center, #2a2a2a 0%, #1a1a1a 55%, #0a0a0a 100%)" }}>
      {/* Magazine-style decorative frame overlay */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "inset 0 0 120px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)",
      }} />
      {/* Corner page-curl accents */}
      <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none z-10 opacity-20"
        style={{ background: "linear-gradient(135deg, rgba(255,204,0,0.3) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none z-10 opacity-20"
        style={{ background: "linear-gradient(315deg, rgba(255,204,0,0.3) 0%, transparent 70%)" }} />
      <Canvas
        camera={{ position: [0, 9, 7], fov: 40, near: 0.5, far: 80 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        dpr={[1, 2]}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene
            playerDeckCount={playerDeckCount}
            playerDeckTotal={playerDeckTotal}
            playerDeckFranchise={playerDeckFranchise}
            playerDeckImages={playerDeckImages}
            opponentDeckCount={opponentDeckCount}
            opponentDeckTotal={opponentDeckTotal}
            opponentDeckFranchise={opponentDeckFranchise}
            opponentDeckImages={opponentDeckImages}
            isDrawing={isDrawing}
            drawTrigger={drawTrigger}
            config={config}
            stakedTazos={stakedTazos}
            airborneTazo={airborneTazo}
            gamePhase={gamePhase}
            showReticle={showReticle}
            reticleX={reticleX}
            reticleZ={reticleZ}
          />
        </Suspense>
      </Canvas>

      {children && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="pointer-events-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

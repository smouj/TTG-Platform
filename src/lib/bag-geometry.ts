// ============================================================
// bag-geometry.ts — Professional chip-bag geometry v3
//
// Orientation (critical fix from v2):
//   Front face = +Z (sinθ > 0) → faces viewer
//   Back face  = -Z (sinθ < 0) → faces away
//   Left seam  = -X (near θ=π) → left edge
//   Right seam = +X (near θ=0) → right edge
//
// Previously v2 used cosθ filtering which put the front on
// the RIGHT side and back on the LEFT — making the bag look
// "split in half" with a seam down the middle from the camera.
//
// Arc-length UV ensures uniform texture density across the face.
// Face extends slightly over side territory for anti-gap padding.
// ============================================================

import * as THREE from "three"

// ═══ Constants ═══
// Face threshold: sinθ above this value belongs to face.
// Side threshold: wider than face threshold for anti-gap overlap.
const FACE_THRESH = 0.07   // ~4° from Z-axis — face covers ~172° arc
const SIDE_THRESH = 0.18   // ~10° from X-axis — seam/side covers ~20° per side
const SUPER_N = 2.8        // superellipse exponent (lower = rounder)
const SEGS_AROUND = 72     // angular resolution
const SEGS_H = 24          // vertical resolution

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// ═══ Dimensions ═══
export interface BagDims {
  wTop: number      // body width at top
  wBot: number      // body width at bottom
  h: number         // body height
  d: number         // max bulge depth (Z-axis, facing viewer)
  sealH: number     // seal/crimp height
}
export const BAG_SMALL: BagDims = { wTop: 0.72, wBot: 0.64, h: 0.94, d: 0.18, sealH: 0.065 }
export const BAG_LARGE: BagDims = { wTop: 0.72, wBot: 0.64, h: 1.02, d: 0.19, sealH: 0.065 }

// ═══ Superellipse radial factor ═══
// r = 1 / (|cosθ|^n + |sinθ|^n)^(1/n)
function superR(cosA: number, sinA: number): number {
  return Math.pow(
    Math.pow(Math.abs(cosA), SUPER_N) + Math.pow(Math.abs(sinA), SUPER_N),
    -1 / SUPER_N,
  )
}

// ═══ Depth (bulge) factor for a given Y ═══
function depthFactor(y: number, h: number): number {
  return Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
}

// ═══ buildFaceGeo ═══
// front=true  → sinθ >  FACE_THRESH  (front face, +Z bulge)
// front=false → sinθ < -FACE_THRESH  (back face,  -Z bulge)
//
// Arc-length UV: u varies by 3D distance along the superellipse
// cross-section, giving uniform texture density across the face.
export function buildFaceGeo(
  front: boolean, dims: BagDims,
): THREE.BufferGeometry {
  const { wTop, wBot, h, d } = dims
  const vertexFilter = front
    ? (angle: number) => Math.sin(angle) > FACE_THRESH
    : (angle: number) => Math.sin(angle) < -FACE_THRESH

  const positions: number[] = []
  const uvs: number[] = []
  const oldToNew: number[][] = []

  for (let yi = 0; yi <= SEGS_H; yi++) {
    const t = yi / SEGS_H
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const halfD = d * depthFactor(y, h)

    // Step 1: collect filtered vertices for this row
    const rowVerts: { angle: number; cosA: number; sinA: number; r: number }[] = []
    for (let i = 0; i < SEGS_AROUND; i++) {
      const angle = (i / SEGS_AROUND) * Math.PI * 2
      if (vertexFilter(angle)) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        rowVerts.push({ angle, cosA, sinA, r: superR(cosA, sinA) })
      }
    }

    // Step 2: compute arc-length along the 3D curve
    const n = rowVerts.length
    const arcLens: number[] = new Array(n).fill(0)
    let totalArc = 0
    for (let i = 1; i < n; i++) {
      const prev = rowVerts[i - 1], curr = rowVerts[i]
      const dx = (curr.r * curr.cosA - prev.r * prev.cosA) * halfW
      const dz = (curr.r * curr.sinA - prev.r * prev.sinA) * halfD
      totalArc += Math.sqrt(dx * dx + dz * dz)
      arcLens[i] = totalArc
    }
    for (let i = 0; i < n; i++) arcLens[i] = totalArc > 0 ? arcLens[i] / totalArc : 0

    // Step 3: emit vertices with arc-length UVs
    // For front face, reverse U so u=0 at left edge, u=1 at right edge
    const row: number[] = []
    for (let i = 0; i < n; i++) {
      const v = rowVerts[i]
      const x = v.r * v.cosA * halfW
      const z = v.r * v.sinA * halfD
      positions.push(x, y, z)
      const u = front ? 1 - arcLens[i] : arcLens[i]
      uvs.push(Number(u.toFixed(6)), t)
      row.push(positions.length / 3 - 1)
    }
    oldToNew.push(row)
  }

  // Step 4: triangulate
  const indices: number[] = []
  for (let yi = 0; yi < SEGS_H; yi++) {
    const r0 = oldToNew[yi], r1 = oldToNew[yi + 1]
    const len = r0.length
    for (let i = 0; i < len - 1; i++) {
      const a = r0[i], b = r1[i], c = r0[i + 1], d = r1[i + 1]
      if (a >= 0 && b >= 0 && c >= 0 && d >= 0) {
        if (front) indices.push(a, b, c, b, d, c)
        else indices.push(a, c, b, b, c, d)
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ═══ buildSideGeo ═══
// Both left and right seams in one mesh (|sinθ| ≤ SIDE_THRESH).
// Left seam near θ=π (-X edge), right seam near θ=0 (+X edge).
// Solid color, wraps from front face to back face on each side.
export function buildSideGeo(dims: BagDims): THREE.BufferGeometry {
  const { wTop, wBot, h, d } = dims
  const positions: number[] = []
  const uvs: number[] = []
  const oldToNew: number[][] = []

  for (let yi = 0; yi <= SEGS_H; yi++) {
    const t = yi / SEGS_H
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const halfD = d * depthFactor(y, h)

    const row: number[] = []
    for (let i = 0; i < SEGS_AROUND; i++) {
      const angle = (i / SEGS_AROUND) * Math.PI * 2
      if (Math.abs(Math.sin(angle)) <= SIDE_THRESH) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const r = superR(cosA, sinA)
        positions.push(r * cosA * halfW, y, r * sinA * halfD)
        uvs.push(cosA > 0 ? 1 : 0, t)
        row.push(positions.length / 3 - 1)
      } else {
        row.push(-1)
      }
    }
    oldToNew.push(row)
  }

  // Triangulate — handles both disconnected arcs (left + right seam) safely
  // because boundary checks prevent bridging between them
  const indices: number[] = []
  for (let yi = 0; yi < SEGS_H; yi++) {
    const r0 = oldToNew[yi], r1 = oldToNew[yi + 1]
    for (let i = 0; i < SEGS_AROUND; i++) {
      const j = (i + 1) % SEGS_AROUND
      const a = r0[i], b = r1[i], c = r0[j], d = r1[j]
      if (a >= 0 && b >= 0 && c >= 0 && d >= 0) indices.push(a, b, c, b, d, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ═══ buildSealGeo — top/bottom crimp slab with serrated edge ═══
// Adds a subtle zigzag (crimp) pattern to the seal's outer edge,
// mimicking the distinctive serrated cut of real chip bags.
export function buildSealGeo(top: boolean, dims: BagDims, segsW = 40): THREE.BufferGeometry {
  const { wTop, wBot, h, sealH } = dims
  const yBody = top ? h / 2 : -h / 2
  const yOuter = top ? h / 2 + sealH : -h / 2 - sealH
  const halfW = top ? wTop / 2 : wBot / 2
  const dz = 0.012
  const segsV = 5
  const crimpTeeth = 14  // number of crimp zigzags across the seal
  const crimpAmp = 0.004 // subtle zigzag amplitude

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  // Front face (z=+dz)
  for (let yi = 0; yi <= segsV; yi++) {
    const t = yi / segsV
    const yBase = lerp(yBody, yOuter, t)
    // Serrate the top edge (yi=0 is body, yi=segsV is outer edge)
    const crimpFactor = yi / segsV  // 0 at body, 1 at outer edge
    for (let xi = 0; xi <= segsW; xi++) {
      const u = xi / segsW
      const x = lerp(-halfW, halfW, u)
      // Zigzag at the outer edge fades toward the body
      const crimp = Math.sin(u * Math.PI * 2 * crimpTeeth) * crimpAmp * crimpFactor
      positions.push(x, yBase + crimp, dz)
      uvs.push(u, t)
    }
  }
  const rowLen = segsW + 1
  const fc = (segsV + 1) * rowLen

  // Back face (z=-dz)
  for (let yi = 0; yi <= segsV; yi++) {
    const t = yi / segsV
    const yBase = lerp(yBody, yOuter, t)
    const crimpFactor = yi / segsV
    for (let xi = 0; xi <= segsW; xi++) {
      const u = xi / segsW
      const crimp = Math.sin(u * Math.PI * 2 * crimpTeeth) * crimpAmp * crimpFactor
      positions.push(lerp(-halfW, halfW, u), yBase + crimp, -dz)
      uvs.push(u, t)
    }
  }

  for (let yi = 0; yi < segsV; yi++)
    for (let xi = 0; xi < segsW; xi++) {
      const a = yi * rowLen + xi, b = a + 1, c = a + rowLen, d = c + 1
      indices.push(a, b, c, b, d, c)
    }
  for (let yi = 0; yi < segsV; yi++)
    for (let xi = 0; xi < segsW; xi++) {
      const a = fc + yi * rowLen + xi, b = a + 1, c = a + rowLen, d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  for (let xi = 0; xi < segsW; xi++) {
    const ft = segsV * rowLen + xi, bt = fc + segsV * rowLen + xi
    indices.push(ft, bt, ft + 1, ft + 1, bt, bt + 1)
  }
  for (let xi = 0; xi < segsW; xi++) {
    const fb = xi, bb = fc + xi
    indices.push(fb + 1, bb + 1, fb, fb + 1, bb + 1, bb)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ═══ buildBodyCapGeo — close the open ring volume ═══
export function buildBodyCapGeo(top: boolean, dims: BagDims): THREE.BufferGeometry {
  const { wTop, wBot, h, d } = dims
  const y = top ? h / 2 : -h / 2
  const halfW = top ? wTop / 2 : wBot / 2
  const halfD = d * depthFactor(y, h)

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  positions.push(0, y, 0); uvs.push(0.5, 0.5)

  for (let i = 0; i <= SEGS_AROUND; i++) {
    const angle = (i / SEGS_AROUND) * Math.PI * 2
    const cosA = Math.cos(angle), sinA = Math.sin(angle)
    const r = superR(cosA, sinA)
    positions.push(r * cosA * halfW, y, r * sinA * halfD)
    uvs.push(cosA * 0.5 + 0.5, sinA * 0.5 + 0.5)
  }

  if (top) { for (let i = 0; i < SEGS_AROUND; i++) indices.push(0, i + 1, i + 2) }
  else     { for (let i = 0; i < SEGS_AROUND; i++) indices.push(0, i + 2, i + 1) }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

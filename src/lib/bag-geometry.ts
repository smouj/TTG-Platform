// ============================================================
// bag-geometry.ts — Shared chip-bag geometry
//
// Ring-based superellipse cross-section body (continuous volume)
// + seal slabs on top/bottom (crimped ends)
// + top/bottom body caps (close the volume)
//
// Three material groups for body:
//   front  — textured face (cosθ >  COS_THRESH)
//   back   — textured face (cosθ < -COS_THRESH)
//   side   — solid seam  (|cosθ| ≤ COS_THRESH)
// Separate: seals (solid), caps (solid)
//
// Used by: BagCardMini3D (shop preview) & PotatoChipBag3D (opener)
// ============================================================

import * as THREE from "three"

// ═══ Dimensions ═══
export interface BagDims {
  wTop: number      // body width at top
  wBot: number      // body width at bottom
  h: number         // body height
  d: number         // max bulge depth
  sealH: number     // seal/crimp height
}
export const BAG_SMALL: BagDims = { wTop: 0.72, wBot: 0.64, h: 0.94, d: 0.16, sealH: 0.055 }
export const BAG_LARGE: BagDims = { wTop: 0.72, wBot: 0.64, h: 1.02, d: 0.17, sealH: 0.055 }

const COS_THRESH = 0.18  // ~80° half-arc → each textured face spans ~160°

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// ═══ Face geometry (front or back textured panel) ═══
// Superellipse ring filtered by cosθ threshold.
// UV u from x-position across the face, UV v from bottom → top.

export function buildFaceGeo(
  front: boolean, dims: BagDims,
  segsAround = 72, segsH = 20,
): THREE.BufferGeometry {
  const { wTop, wBot, h, d } = dims
  const vertexFilter = front
    ? (a: number) => Math.cos(a) > COS_THRESH
    : (a: number) => Math.cos(a) < -COS_THRESH

  const positions: number[] = []
  const uvs: number[] = []
  const oldToNew: number[][] = []

  for (let yi = 0; yi <= segsH; yi++) {
    const t = yi / segsH
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const hf = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
    const halfD = d * hf

    // Pass 1: find x-range of filtered vertices at this height
    let xMin = Infinity, xMax = -Infinity
    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      if (vertexFilter(angle)) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const n = 3.5
        const r = Math.pow(Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n), -1 / n)
        const x = r * cosA * halfW
        if (x < xMin) xMin = x; if (x > xMax) xMax = x
      }
    }
    const xRange = xMax - xMin || 1

    // Pass 2: build ring with UVs
    const row: number[] = []
    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      if (vertexFilter(angle)) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const n = 3.5
        const r = Math.pow(Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n), -1 / n)
        positions.push(r * cosA * halfW, y, r * sinA * halfD)
        uvs.push(Number(((r * cosA * halfW - xMin) / xRange).toFixed(6)), t)
        row.push(positions.length / 3 - 1)
      } else { row.push(-1) }
    }
    oldToNew.push(row)
  }

  const indices: number[] = []
  for (let yi = 0; yi < segsH; yi++) {
    const r0 = oldToNew[yi], r1 = oldToNew[yi + 1]
    for (let i = 0; i < segsAround; i++) {
      const j = (i + 1) % segsAround
      const a = r0[i], b = r1[i], c = r0[j], d = r1[j]
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

// ═══ Side geometry (solid seam connecting front→back) ═══
export function buildSideGeo(
  dims: BagDims, segsAround = 72, segsH = 20,
): THREE.BufferGeometry {
  const { wTop, wBot, h, d } = dims
  const positions: number[] = []
  const uvs: number[] = []
  const oldToNew: number[][] = []

  for (let yi = 0; yi <= segsH; yi++) {
    const t = yi / segsH
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const hf = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
    const halfD = d * hf

    const row: number[] = []
    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      if (Math.abs(Math.cos(angle)) <= COS_THRESH) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const n = 3.5
        const r = Math.pow(Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n), -1 / n)
        positions.push(r * cosA * halfW, y, r * sinA * halfD)
        uvs.push(sinA > 0 ? 0 : 1, t)
        row.push(positions.length / 3 - 1)
      } else { row.push(-1) }
    }
    oldToNew.push(row)
  }

  const indices: number[] = []
  for (let yi = 0; yi < segsH; yi++) {
    const r0 = oldToNew[yi], r1 = oldToNew[yi + 1]
    for (let i = 0; i < segsAround; i++) {
      const j = (i + 1) % segsAround
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

// ═══ Seal geometry (top/bottom crimp slab) ═══
// Thin flat strip extending above/below the body rim.
export function buildSealGeo(top: boolean, dims: BagDims, segsW = 40): THREE.BufferGeometry {
  const { wTop, wBot, h, sealH } = dims
  const yBody = top ? h / 2 : -h / 2
  const yOuter = top ? h / 2 + sealH : -h / 2 - sealH
  const halfW = top ? wTop / 2 : wBot / 2
  const dz = 0.008
  const segsV = 4

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  // Front face (z=+dz)
  for (let yi = 0; yi <= segsV; yi++) {
    const t = yi / segsV
    const y = lerp(yBody, yOuter, t)
    for (let xi = 0; xi <= segsW; xi++) {
      const u = xi / segsW
      positions.push(lerp(-halfW, halfW, u), y, dz)
      uvs.push(u, t)
    }
  }
  const rowLen = segsW + 1
  const fc = (segsV + 1) * rowLen

  // Back face (z=-dz)
  for (let yi = 0; yi <= segsV; yi++) {
    const t = yi / segsV
    const y = lerp(yBody, yOuter, t)
    for (let xi = 0; xi <= segsW; xi++) {
      positions.push(lerp(-halfW, halfW, xi / segsW), y, -dz)
      uvs.push(t, yi / segsV)
    }
  }

  // Front triangles
  for (let yi = 0; yi < segsV; yi++)
    for (let xi = 0; xi < segsW; xi++) {
      const a = yi * rowLen + xi, b = a + 1, c = a + rowLen, d = c + 1
      indices.push(a, b, c, b, d, c)
    }
  // Back triangles (reverse winding)
  for (let yi = 0; yi < segsV; yi++)
    for (let xi = 0; xi < segsW; xi++) {
      const a = fc + yi * rowLen + xi, b = a + 1, c = a + rowLen, d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  // Top rim cap
  for (let xi = 0; xi < segsW; xi++) {
    const ft = segsV * rowLen + xi, bt = fc + segsV * rowLen + xi
    indices.push(ft, bt, ft + 1, ft + 1, bt, bt + 1)
  }
  // Bottom rim cap (hidden inside body)
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

// ═══ Body cap (close the open top/bottom of the ring volume) ═══
export function buildBodyCapGeo(top: boolean, dims: BagDims, segsAround = 72): THREE.BufferGeometry {
  const { wTop, wBot, h, d } = dims
  const y = top ? h / 2 : -h / 2
  const halfW = top ? wTop / 2 : wBot / 2
  const depthFactor = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
  const halfD = d * depthFactor

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  positions.push(0, y, 0); uvs.push(0.5, 0.5)

  for (let i = 0; i <= segsAround; i++) {
    const angle = (i / segsAround) * Math.PI * 2
    const cosA = Math.cos(angle), sinA = Math.sin(angle)
    const n = 3.5
    const r = Math.pow(Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n), -1 / n)
    positions.push(r * cosA * halfW, y, r * sinA * halfD)
    uvs.push(cosA * 0.5 + 0.5, sinA * 0.5 + 0.5)
  }

  if (top) { for (let i = 0; i < segsAround; i++) indices.push(0, i + 1, i + 2) }
  else     { for (let i = 0; i < segsAround; i++) indices.push(0, i + 2, i + 1) }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

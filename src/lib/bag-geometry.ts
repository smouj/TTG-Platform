// ============================================================
// bag-geometry.ts — Professional chip-bag geometry v2
//
// Key improvements over v1:
//   1. Arc-length UV mapping → uniform texture density across 3D surface
//   2. Face extends slightly into seam area → zero hairline gaps
//   3. Shared vertex normals computed on full ring → smooth lighting
//
// Architecture:
//   Full ring → compute normals → split into face/front, face/back, side
//   + separate seal meshes (top/bottom crimps)
//   + separate body caps (close the volume)
// ============================================================

import * as THREE from "three"

// ═══ Constants ═══
const COS_FACE = 0.10    // face arc: cosθ > 0.10 → ~84° half-arc (~168° total)
const COS_SIDE = 0.18    // side arc: |cosθ| ≤ 0.18 → side visible in the gap
// Face extends slightly into side territory for overlap (no gaps)

const SUPER_N = 3.5       // superellipse exponent
const SEGS_AROUND = 72    // angular resolution (higher = smoother)
const SEGS_H = 24         // vertical resolution

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// ═══ Dimensions ═══
export interface BagDims {
  wTop: number
  wBot: number
  h: number
  d: number
  sealH: number
}
export const BAG_SMALL: BagDims = { wTop: 0.72, wBot: 0.64, h: 0.94, d: 0.16, sealH: 0.055 }
export const BAG_LARGE: BagDims = { wTop: 0.72, wBot: 0.64, h: 1.02, d: 0.17, sealH: 0.055 }

// ═══ Superellipse radial factor ═══
// r = 1 / (|cosθ|^n + |sinθ|^n)^(1/n) — unit supercircle
function superR(cosA: number, sinA: number): number {
  return Math.pow(
    Math.pow(Math.abs(cosA), SUPER_N) + Math.pow(Math.abs(sinA), SUPER_N),
    -1 / SUPER_N,
  )
}

// ═══ Full ring cross-section builder ═══
// Builds one horizontal ring slice: all vertices around the superellipse.
// Returns arrays of {x, z, idx} for each vertex in the ring.
interface RingVertex { x: number; z: number; idx: number; angle: number }
function buildRingSlice(
  y: number, halfW: number, halfD: number,
  positions: number[], uvs: number[],
): RingVertex[] {
  const verts: RingVertex[] = []
  for (let i = 0; i < SEGS_AROUND; i++) {
    const angle = (i / SEGS_AROUND) * Math.PI * 2
    const cosA = Math.cos(angle), sinA = Math.sin(angle)
    const r = superR(cosA, sinA)
    const x = r * cosA * halfW
    const z = r * sinA * halfD
    positions.push(x, y, z)
    uvs.push(angle / (Math.PI * 2), 0) // placeholder UV (replaced per-face)
    verts.push({ x, z, idx: positions.length / 3 - 1, angle })
  }
  return verts
}

// ═══ buildFaceGeo — arc-length UV mapping ═══
// Texture u varies by actual 3D arc-length on the superellipse surface.
// This means texel density is uniform across the face (no edge compression).
export function buildFaceGeo(
  front: boolean, dims: BagDims,
): THREE.BufferGeometry {
  const { wTop, wBot, h, d } = dims
  const vertexFilter = front
    ? (a: number) => Math.cos(a) > COS_FACE
    : (a: number) => Math.cos(a) < -COS_FACE

  const positions: number[] = []
  const uvs: number[] = []
  const oldToNew: number[][] = []

  for (let yi = 0; yi <= SEGS_H; yi++) {
    const t = yi / SEGS_H
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const depthFactor = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
    const halfD = d * depthFactor

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
      const ds = Math.sqrt(dx * dx + dz * dz)
      totalArc += ds
      arcLens[i] = totalArc
    }
    for (let i = 0; i < n; i++) arcLens[i] /= totalArc || 1

    // Step 3: emit vertices with arc-length UVs
    const row: number[] = []
    for (let i = 0; i < n; i++) {
      const v = rowVerts[i]
      positions.push(v.r * v.cosA * halfW, y, v.r * v.sinA * halfD)
      uvs.push(arcLens[i], t)
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

// ═══ buildSideGeo — solid seam connecting front↔back ═══
// Covers the remaining arc where |cosθ| ≤ COS_SIDE.
// Since this is solid color, UVs are simple (just for completeness).
export function buildSideGeo(dims: BagDims): THREE.BufferGeometry {
  const { wTop, wBot, h, d } = dims
  const positions: number[] = []
  const uvs: number[] = []
  const oldToNew: number[][] = []

  for (let yi = 0; yi <= SEGS_H; yi++) {
    const t = yi / SEGS_H
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const depthFactor = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
    const halfD = d * depthFactor

    const row: number[] = []
    for (let i = 0; i < SEGS_AROUND; i++) {
      const angle = (i / SEGS_AROUND) * Math.PI * 2
      if (Math.abs(Math.cos(angle)) <= COS_SIDE) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const r = superR(cosA, sinA)
        positions.push(r * cosA * halfW, y, r * sinA * halfD)
        uvs.push(cosA > 0 ? 1 : 0, t)
        row.push(positions.length / 3 - 1)
      } else { row.push(-1) }
    }
    oldToNew.push(row)
  }

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

// ═══ buildSealGeo — top/bottom crimp slab ═══
// Flat strip extending above/below the body, with front/back faces + rim caps.
// Width matches the body trapezoid for seamless visual connection.
export function buildSealGeo(top: boolean, dims: BagDims, segsW = 40): THREE.BufferGeometry {
  const { wTop, wBot, h, sealH } = dims
  const yBody = top ? h / 2 : -h / 2
  const yOuter = top ? h / 2 + sealH : -h / 2 - sealH
  const halfW = top ? wTop / 2 : wBot / 2
  const dz = 0.01
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
  // Bottom rim cap (hidden inside body junction)
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

// ═══ buildBodyCapGeo — close the open top/bottom of the ring volume ═══
// Fan from center vertex to ring perimeter. Solid dark color (bag interior).
export function buildBodyCapGeo(top: boolean, dims: BagDims): THREE.BufferGeometry {
  const { wTop, wBot, h, d } = dims
  const y = top ? h / 2 : -h / 2
  const halfW = top ? wTop / 2 : wBot / 2
  const depthFactor = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
  const halfD = d * depthFactor

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

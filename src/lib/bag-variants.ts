// Shared bag texture configuration — no 3D dependencies
// Safe to import anywhere (SSR, client, etc.)

const BAG_VARIANTS: Record<string, { frontUrl: string; backUrl: string }[]> = {
  minimon: [
    { frontUrl: "/textures/bags/minimon/bag-minimon-front-01.png", backUrl: "/textures/bags/minimon/bag-minimon-back-01.png" },
    { frontUrl: "/textures/bags/minimon/bag-minimon-front-02.png", backUrl: "/textures/bags/minimon/bag-minimon-back-02.png" },
  ],
  cybermon: [
    { frontUrl: "/textures/bags/cybermon/bag-cybermon-front-01.png", backUrl: "/textures/bags/cybermon/bag-cybermon-back-01.png" },
    { frontUrl: "/textures/bags/cybermon/bag-cybermon-front-02.png", backUrl: "/textures/bags/cybermon/bag-cybermon-back-02.png" },
  ],
  dracobell: [
    { frontUrl: "/textures/bags/dracobell/bag-dracobell-front-01.png", backUrl: "/textures/bags/dracobell/bag-dracobell-back-01.png" },
    { frontUrl: "/textures/bags/dracobell/bag-dracobell-front-02.png", backUrl: "/textures/bags/dracobell/bag-dracobell-back-02.png" },
  ],
}

export function pickBagVariant(franchiseSlug: string | undefined): {
  frontUrl: string; backUrl: string; franchise: string
} {
  const slug = franchiseSlug && BAG_VARIANTS[franchiseSlug] ? franchiseSlug : "minimon"
  const variants = BAG_VARIANTS[slug]
  const idx = Math.abs(slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % variants.length
  return { ...variants[idx], franchise: slug }
}

#!/usr/bin/env bash
# build-electron.sh — Build Electron installers for Trading Tazos Game
# Workaround: temporarily removes node_modules to prevent electron-builder
# from scanning 200MB+ of Next.js deps (the app is a thin web wrapper).
# Electron is downloaded directly from GitHub releases.
set -euo pipefail

cd "$(dirname "$0")"

echo "🔨 Trading Tazos Game — Electron Builder"
echo "========================================="

# Clean
rm -rf dist-electron 2>/dev/null || true

# Use electron-builder from the project (already installed)
ELECTRON_VERSION="42.3.2"
PLATFORM="${1:-linux}"

echo ""
echo "📦 Platform: $PLATFORM"
echo "📦 Electron: v$ELECTRON_VERSION"

# Set electron version explicitly so it downloads from GitHub
export npm_package_devDependencies_electron="$ELECTRON_VERSION"

# Run electron-builder
npx electron-builder --"$PLATFORM" \
  --config=electron-builder.yml \
  --c.electronVersion="$ELECTRON_VERSION" \
  2>&1

echo ""
echo "✅ Build complete!"
echo ""
ls -lh dist-electron/*.{AppImage,deb,exe,dmg,zip} 2>/dev/null || echo "  (no installers found — check output above)"
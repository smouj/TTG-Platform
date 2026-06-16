'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload,
  Scan,
  Crop,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  ImagePlus,
  Save,
  RotateCcw,
  Camera,
  ArrowRight,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Tazo, Franchise, Collection, TazoCondition, PhysicalType, Rarity } from '@/lib/game/types'
import {
  MINIMON_TYPES,
  CYBERMON_TYPES,
  DRACOBELL_TYPES,
  RARITY_CONFIG,
  CONDITION_CONFIG,
  PHYSICAL_TYPE_CONFIG,
} from '@/lib/game/types'

interface DetectedRegion {
  x: number
  y: number
  width: number
  height: number
  included: boolean
}

interface ExtractedTazo {
  id: string
  region: DetectedRegion
  imageUrl: string
  name: string
  franchiseId: string
  collectionId: string
  combatType: string
  rarity: Rarity
  condition: TazoCondition
  physicalType: PhysicalType
  skill: string
  skillDesc: string
}

type ScannerStep = 'upload' | 'detect' | 'extract'

export function ScannerView() {
  // State
  const [step, setStep] = useState<ScannerStep>('upload')
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [regions, setRegions] = useState<DetectedRegion[]>([])
  const [extractedTazos, setExtractedTazos] = useState<ExtractedTazo[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [savingIndividual, setSavingIndividual] = useState<string | null>(null)
  const [scanLineY, setScanLineY] = useState(0)
  const [isScanning, setIsScanning] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Fetch franchises on mount
  useEffect(() => {
    async function fetchFranchises() {
      try {
        const res = await fetch('/api/franchises')
        const data = await res.json()
        setFranchises(data.franchises || [])
      } catch (err) {
        console.error('Failed to fetch franchises:', err)
      }
    }
    fetchFranchises()
  }, [])

  // Scanning animation
  useEffect(() => {
    if (!isScanning) return
    const interval = setInterval(() => {
      setScanLineY((prev) => (prev >= 100 ? 0 : prev + 2))
    }, 50)
    return () => clearInterval(interval)
  }, [isScanning])

  // Draw detection overlay - MAGAZINE STYLE with thick black circles and green scan line
  useEffect(() => {
    if (!canvasRef.current || !uploadedImageUrl || step !== 'detect' || regions.length === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const maxWidth = 800
      const scale = img.width > maxWidth ? maxWidth / img.width : 1
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      regions.forEach((region) => {
        const rx = region.x * scale
        const ry = region.y * scale
        const rw = region.width * scale
        const rh = region.height * scale

        // Draw thick black circle around detected tazos
        const centerX = rx + rw / 2
        const centerY = ry + rh / 2
        const radius = Math.min(rw, rh) / 2

        if (region.included) {
          // Outer black ring - thick
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 5
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2)
          ctx.stroke()

          // Inner green ring
          ctx.strokeStyle = '#22c55e'
          ctx.lineWidth = 3
          ctx.shadowColor = '#22c55e'
          ctx.shadowBlur = 10
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.shadowBlur = 0

          // Draw thick crosshair
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(centerX - 10, centerY)
          ctx.lineTo(centerX + 10, centerY)
          ctx.moveTo(centerX, centerY - 10)
          ctx.lineTo(centerX, centerY + 10)
          ctx.stroke()

          // Green inner crosshair
          ctx.strokeStyle = '#22c55e'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(centerX - 8, centerY)
          ctx.lineTo(centerX + 8, centerY)
          ctx.moveTo(centerX, centerY - 8)
          ctx.lineTo(centerX, centerY + 8)
          ctx.stroke()
        } else {
          // Excluded - red with thick black outline
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 4
          ctx.shadowBlur = 0
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2)
          ctx.stroke()

          ctx.strokeStyle = '#ef4444'
          ctx.lineWidth = 2
          ctx.shadowColor = '#ef4444'
          ctx.shadowBlur = 6
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.shadowBlur = 0

          // X mark
          ctx.strokeStyle = '#ef4444'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(centerX - 8, centerY - 8)
          ctx.lineTo(centerX + 8, centerY + 8)
          ctx.moveTo(centerX + 8, centerY - 8)
          ctx.lineTo(centerX - 8, centerY + 8)
          ctx.stroke()
        }
      })

      // Draw scan line - GREEN instead of cyan
      if (isScanning) {
        const lineY = (scanLineY / 100) * canvas.height
        const gradient = ctx.createLinearGradient(0, lineY - 20, 0, lineY + 20)
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0)')
        gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.6)')
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, lineY - 20, canvas.width, 40)
      }
    }
    img.src = uploadedImageUrl
  }, [uploadedImageUrl, regions, step, scanLineY, isScanning])

  // Handle file upload
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/scanner/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.imageUrl) {
        setUploadedImageUrl(data.imageUrl)
        setImageDimensions({ width: data.width, height: data.height })
        setStep('detect')
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }, [])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  // Detect tazo regions
  const handleDetect = useCallback(async () => {
    if (!uploadedImageUrl) return
    setIsDetecting(true)
    setIsScanning(true)

    try {
      const res = await fetch('/api/scanner/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadedImageUrl }),
      })

      const data = await res.json()
      if (data.regions) {
        setRegions(
          data.regions.map((r: DetectedRegion) => ({
            ...r,
            included: true,
          }))
        )
      }
    } catch (err) {
      console.error('Detection error:', err)
    } finally {
      setTimeout(() => {
        setIsScanning(false)
        setIsDetecting(false)
      }, 1000)
    }
  }, [uploadedImageUrl])

  // Toggle region inclusion
  const toggleRegion = useCallback((index: number) => {
    setRegions((prev) =>
      prev.map((r, i) => (i === index ? { ...r, included: !r.included } : r))
    )
  }, [])

  // Extract selected regions
  const handleExtract = useCallback(async () => {
    const selectedRegions = regions.filter((r) => r.included)
    if (selectedRegions.length === 0) return
    setIsExtracting(true)

    try {
      const newTazos: ExtractedTazo[] = []

      for (const region of selectedRegions) {
        const previewUrl = uploadedImageUrl || ''

        newTazos.push({
          id: `extract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          region,
          imageUrl: previewUrl,
          name: '',
          franchiseId: franchises[0]?.id || '',
          collectionId: franchises[0]?.collections?.[0]?.id || '',
          combatType: '',
          rarity: 'common',
          condition: 'good',
          physicalType: 'cardboard',
          skill: '',
          skillDesc: '',
        })
      }

      setExtractedTazos(newTazos)
      setStep('extract')
    } catch (err) {
      console.error('Extraction error:', err)
    } finally {
      setIsExtracting(false)
    }
  }, [regions, uploadedImageUrl, franchises])

  // Update extracted tazo data
  const updateExtractedTazo = useCallback((id: string, field: string, value: string) => {
    setExtractedTazos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    )
  }, [])

  // Get collections for a franchise
  const getCollectionsForFranchise = useCallback(
    (franchiseId: string) => {
      const franchise = franchises.find((f) => f.id === franchiseId)
      return franchise?.collections || []
    },
    [franchises]
  )

  // Get combat types for a franchise
  const getCombatTypesForFranchise = useCallback(
    (franchiseId: string) => {
      const franchise = franchises.find((f) => f.id === franchiseId)
      if (!franchise) return []
      switch (franchise.slug) {
        case 'minimon':
          return [...MINIMON_TYPES]
        case 'cybermon':
          return [...CYBERMON_TYPES]
        case 'dracobell':
          return [...DRACOBELL_TYPES]
        default:
          return []
      }
    },
    [franchises]
  )

  // Save individual tazo
  const handleSaveIndividual = useCallback(
    async (tazo: ExtractedTazo) => {
      setSavingIndividual(tazo.id)
      try {
        const res = await fetch('/api/scanner/crop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: uploadedImageUrl,
            region: tazo.region,
            tazoData: {
              name: tazo.name || 'Unnamed Tazo',
              slug: `${tazo.name?.toLowerCase().replace(/\s+/g, '-') || 'tazo'}-${Date.now()}`,
              franchiseId: tazo.franchiseId,
              collectionId: tazo.collectionId,
              combatType: tazo.combatType || null,
              rarity: tazo.rarity,
              condition: tazo.condition,
              physicalType: tazo.physicalType,
              skill: tazo.skill || null,
              skillDesc: tazo.skillDesc || null,
              isOwned: true,
            },
          }),
        })

        const data = await res.json()
        if (data.tazo) {
          setExtractedTazos((prev) => prev.filter((t) => t.id !== tazo.id))
        }
      } catch (err) {
        console.error('Save error:', err)
      } finally {
        setSavingIndividual(null)
      }
    },
    [uploadedImageUrl]
  )

  // Reset scanner
  const handleReset = useCallback(() => {
    setStep('upload')
    setUploadedImageUrl(null)
    setImageDimensions(null)
    setRegions([])
    setExtractedTazos([])
    setIsScanning(false)
    setScanLineY(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // Save all tazos
  const handleSaveAll = useCallback(async () => {
    setIsSavingAll(true)
    try {
      for (const tazo of extractedTazos) {
        await fetch('/api/scanner/crop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: uploadedImageUrl,
            region: tazo.region,
            tazoData: {
              name: tazo.name || 'Unnamed Tazo',
              slug: `${tazo.name?.toLowerCase().replace(/\s+/g, '-') || 'tazo'}-${Date.now()}`,
              franchiseId: tazo.franchiseId,
              collectionId: tazo.collectionId,
              combatType: tazo.combatType || null,
              rarity: tazo.rarity,
              condition: tazo.condition,
              physicalType: tazo.physicalType,
              skill: tazo.skill || null,
              skillDesc: tazo.skillDesc || null,
              isOwned: true,
            },
          }),
        })
      }
      setExtractedTazos([])
      handleReset()
    } catch (err) {
      console.error('Save all error:', err)
    } finally {
      setIsSavingAll(false)
    }
  }, [extractedTazos, uploadedImageUrl, handleReset])

  const stepIndex = ['upload', 'detect', 'extract'].indexOf(step)

  return (
    <div className="space-y-5">
      {/* ===== MAGAZINE HEADER ===== */}
      <div className="relative">
        {/* Blue background strip */}
        <div className="mag-card-blue rounded-t-none border-b-4 border-black px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-3 border-black bg-yellow-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Camera className="h-5 w-5 text-black" />
              </div>
              <div>
                <h2 className="mag-stroke text-2xl font-black tracking-tight sm:text-3xl">
                  TAZO SCANNER
                </h2>
                <p className="text-sm font-bold text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                  <Zap className="w-4 h-4 inline text-[#FFCC00]" /> SCAN YOUR REAL TAZOS! <Zap className="w-4 h-4 inline text-[#FFCC00]" />
                </p>
              </div>
            </div>
            {step !== 'upload' && (
              <button
                onClick={handleReset}
                className="mag-btn flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                RESET
              </button>
            )}
          </div>
        </div>

        {/* Magazine step indicators - HOW IT WORKS */}
        <div className="mag-card rounded-t-none border-t-0">
          <div className="flex items-center justify-between px-2 py-2">
            <span className="mag-stroke-sm text-xs font-black">HOW IT WORKS:</span>
            <div className="flex items-center gap-1">
              {([
                { key: 'upload', label: 'UPLOAD', num: '1' },
                { key: 'detect', label: 'SCAN', num: '2' },
                { key: 'extract', label: 'SAVE', num: '3' },
              ] as const).map((s, i) => {
                const isActive = step === s.key
                const isDone = i < stepIndex
                return (
                  <div key={s.key} className="flex items-center gap-1">
                    <div
                      className={`flex items-center gap-1 border-2 px-2 py-1 text-xs font-black transition-all ${
                        isActive
                          ? 'border-black bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : isDone
                          ? 'border-black bg-green-400 text-black'
                          : 'border-zinc-300 bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black ${
                          isActive
                            ? 'bg-black text-yellow-400'
                            : isDone
                            ? 'bg-black text-green-400'
                            : 'bg-zinc-200 text-zinc-500'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                    {i < 2 && (
                      <ArrowRight
                        className={`h-3.5 w-3.5 ${
                          isDone ? 'text-green-500' : 'text-zinc-300'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===== UPLOAD STEP ===== */}
      {step === 'upload' && (
        <div className="space-y-4">
          {/* Upload area with magazine dots texture and yellow tint */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="mag-card-yellow mag-dots relative cursor-pointer overflow-hidden border-4 border-dashed border-black transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="relative z-10 flex flex-col items-center justify-center gap-4 p-8 sm:p-12">
              {/* Icon circle */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {isUploading ? (
                  <Loader2 className="h-9 w-9 animate-spin text-black" />
                ) : (
                  <ImagePlus className="h-9 w-9 text-black" />
                )}
              </div>

              {/* Bold drop text */}
              <div className="text-center">
                <p className="mag-stroke-sm text-xl font-black sm:text-2xl">
                  {isUploading ? 'UPLOADING...' : 'DROP YOUR TAZO PHOTO HERE!'}
                </p>
                <p className="mt-2 text-sm font-bold text-black/70">
                  or click to browse — PNG, JPG, WEBP accepted
                </p>
              </div>

              {/* Decorative magazine callout */}
              <div className="speech-bubble mt-2 px-4 py-2">
                <p className="text-xs font-black">
                  <Camera className="w-4 h-4 inline mr-1" /> Pro tip: Lay tazos flat on a contrasting surface for best results!
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* HOW IT WORKS - Step detail boxes */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { num: '1', title: 'UPLOAD', desc: 'Take a photo of your tazos', icon: Upload, color: 'bg-yellow-400' },
              { num: '2', title: 'SCAN', desc: 'AI detects each tazo', icon: Scan, color: 'bg-green-400' },
              { num: '3', title: 'SAVE', desc: 'Add to your collection!', icon: Save, color: 'bg-red-400' },
            ].map((item) => (
              <div key={item.num} className="mag-card flex flex-col items-center gap-2 p-3 text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-black ${item.color} text-sm font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                >
                  {item.num}
                </div>
                <item.icon className="h-5 w-5 text-black" />
                <p className="text-xs font-black">{item.title}</p>
                <p className="text-[10px] font-bold text-black/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== DETECT STEP ===== */}
      {step === 'detect' && uploadedImageUrl && (
        <div className="space-y-4">
          {/* Detection Overlay - White card with thick black border */}
          <div className="mag-card overflow-hidden p-0">
            {/* Detection header */}
            <div className="flex items-center justify-between border-b-4 border-black bg-black px-4 py-2">
              <div className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-green-400" />
                <span className="text-sm font-black text-white tracking-wide">
                  <Scan className="w-4 h-4 inline mr-1" /> DETECTION VIEW
                </span>
              </div>
              {imageDimensions && (
                <span className="exclusive-badge text-xs">
                  {imageDimensions.width} × {imageDimensions.height}
                </span>
              )}
            </div>

            {/* Canvas area */}
            <div className="bg-white p-3">
              <div className="relative overflow-hidden border-2 border-black">
                <canvas
                  ref={canvasRef}
                  className="mx-auto block max-h-[400px] w-auto"
                />
              </div>
            </div>
          </div>

          {/* Controls - Magazine button style */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDetect}
              disabled={isDetecting}
              className="mag-btn flex items-center gap-2 bg-green-400 px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  SCANNING...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4" />
                  SCAN FOR TAZOS!
                </>
              )}
            </button>

            {regions.length > 0 && (
              <button
                onClick={handleExtract}
                disabled={isExtracting || regions.filter((r) => r.included).length === 0}
                className="mag-btn flex items-center gap-2 bg-yellow-400 px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    EXTRACTING...
                  </>
                ) : (
                  <>
                    <Crop className="h-4 w-4" />
                    EXTRACT SELECTED ({regions.filter((r) => r.included).length})
                  </>
                )}
              </button>
            )}
          </div>

          {/* Region List - Magazine card grid */}
          {regions.length > 0 && (
            <div className="mag-card-red">
              <div className="flex items-center gap-2 border-b-2 border-black px-4 py-2">
                <Star className="h-4 w-4 text-white" />
                <span className="text-sm font-black text-white">
                  DETECTED REGIONS ({regions.length})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4">
                {regions.map((region, index) => (
                  <button
                    key={index}
                    onClick={() => toggleRegion(index)}
                    className={`flex items-center gap-2 border-3 p-2 text-left text-xs transition-all ${
                      region.included
                        ? 'border-black bg-green-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                        : 'border-gray-400 bg-zinc-100 opacity-60 hover:opacity-80'
                    }`}
                  >
                    {region.included ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-zinc-400" />
                    )}
                    <span className="font-black">
                      Region {index + 1}
                      <br />
                      <span className="font-bold text-black/50">
                        {region.width}×{region.height}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== EXTRACT STEP ===== */}
      {step === 'extract' && extractedTazos.length > 0 && (
        <div className="space-y-4">
          {/* Extract header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="mag-stroke-sm text-lg font-black">
                {extractedTazos.length} TAZO{extractedTazos.length !== 1 ? 'S' : ''} EXTRACTED!
              </span>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="mag-btn flex items-center gap-2 bg-green-400 px-4 py-2 text-sm disabled:opacity-50"
            >
              {isSavingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  SAVING ALL...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  SAVE ALL ({extractedTazos.length})
                </>
              )}
            </button>
          </div>

          {/* Extracted tazo cards */}
          <div className="grid gap-4">
            {extractedTazos.map((tazo, tazoIndex) => (
              <div key={tazo.id} className="mag-card overflow-hidden p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Tazo Preview - Magazine style */}
                  <div className="mag-stripes relative flex items-center justify-center p-6 sm:w-52">
                    <div className="relative">
                      <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <img
                          src={tazo.imageUrl}
                          alt="Extracted tazo"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {/* Rarity badge */}
                      <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-yellow-400 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {RARITY_CONFIG[tazo.rarity]?.label[0] || 'C'}
                      </div>
                      {/* Number badge */}
                      <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-red-500 text-[10px] font-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {tazoIndex + 1}
                      </div>
                    </div>
                  </div>

                  {/* Form - White background, thick black borders on inputs */}
                  <div className="flex-1 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-black uppercase tracking-wide">
                          Tazo Name
                        </label>
                        <input
                          placeholder="Enter tazo name..."
                          value={tazo.name}
                          onChange={(e) => updateExtractedTazo(tazo.id, 'name', e.target.value)}
                          className="h-9 w-full border-3 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-wide">
                          Franchise
                        </label>
                        <Select
                          value={tazo.franchiseId}
                          onValueChange={(val) => {
                            updateExtractedTazo(tazo.id, 'franchiseId', val)
                            const collections = getCollectionsForFranchise(val)
                            if (collections.length > 0) {
                              updateExtractedTazo(tazo.id, 'collectionId', collections[0].id)
                            }
                            updateExtractedTazo(tazo.id, 'combatType', '')
                          }}
                        >
                          <SelectTrigger className="h-9 border-3 border-black bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <SelectValue placeholder="Select series" />
                          </SelectTrigger>
                          <SelectContent className="border-3 border-black">
                            {franchises.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-wide">
                          Collection
                        </label>
                        <Select
                          value={tazo.collectionId}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'collectionId', val)}
                        >
                          <SelectTrigger className="h-9 border-3 border-black bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <SelectValue placeholder="Select collection" />
                          </SelectTrigger>
                          <SelectContent className="border-3 border-black">
                            {getCollectionsForFranchise(tazo.franchiseId).map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-wide">
                          Combat Type
                        </label>
                        <Select
                          value={tazo.combatType}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'combatType', val)}
                        >
                          <SelectTrigger className="h-9 border-3 border-black bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="border-3 border-black">
                            {getCombatTypesForFranchise(tazo.franchiseId).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-wide">
                          Rarity
                        </label>
                        <Select
                          value={tazo.rarity}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'rarity', val)}
                        >
                          <SelectTrigger className="h-9 border-3 border-black bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-3 border-black">
                            {Object.entries(RARITY_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                {cfg.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-wide">
                          Condition
                        </label>
                        <Select
                          value={tazo.condition}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'condition', val)}
                        >
                          <SelectTrigger className="h-9 border-3 border-black bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-3 border-black">
                            {Object.entries(CONDITION_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                {cfg.icon} {cfg.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-wide">
                          Physical Type
                        </label>
                        <Select
                          value={tazo.physicalType}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'physicalType', val)}
                        >
                          <SelectTrigger className="h-9 border-3 border-black bg-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-3 border-black">
                            {Object.entries(PHYSICAL_TYPE_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                {cfg.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Save button - mag-btn yellow style */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleSaveIndividual(tazo)}
                        disabled={savingIndividual === tazo.id}
                        className="mag-btn flex items-center gap-2 bg-yellow-400 px-5 py-2 text-sm disabled:opacity-50"
                      >
                        {savingIndividual === tazo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        SAVE!
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Empty state after all saved ===== */}
      {step === 'extract' && extractedTazos.length === 0 && (
        <div className="mag-card flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-black bg-green-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="h-8 w-8 text-black" />
          </div>
          <div>
            <p className="mag-stroke-sm text-xl font-black">ALL TAZOS SAVED!</p>
            <p className="mt-1 text-sm font-bold text-black/60">
              Your scanned tazos have been added to your collection.
            </p>
          </div>
          <button onClick={handleReset} className="mag-btn flex items-center gap-2 bg-yellow-400 px-5 py-2 text-sm">
            <Upload className="h-4 w-4" />
            SCAN MORE!
          </button>
        </div>
      )}
    </div>
  )
}

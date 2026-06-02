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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Tazo, Franchise, Collection, TazoCondition, PhysicalType, Rarity } from '@/lib/game/types'
import {
  POKEMON_TYPES,
  DIGIMON_TYPES,
  DBZ_TYPES,
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

  // Draw detection overlay
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

        if (region.included) {
          ctx.strokeStyle = '#00ffaa'
          ctx.lineWidth = 2
          ctx.shadowColor = '#00ffaa'
          ctx.shadowBlur = 8
        } else {
          ctx.strokeStyle = '#ff4444'
          ctx.lineWidth = 2
          ctx.shadowColor = '#ff4444'
          ctx.shadowBlur = 4
        }

        // Draw circle
        const centerX = rx + rw / 2
        const centerY = ry + rh / 2
        const radius = Math.min(rw, rh) / 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.stroke()

        // Draw crosshair
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.moveTo(centerX - 6, centerY)
        ctx.lineTo(centerX + 6, centerY)
        ctx.moveTo(centerX, centerY - 6)
        ctx.lineTo(centerX, centerY + 6)
        ctx.stroke()
      })

      // Draw scan line
      if (isScanning) {
        const lineY = (scanLineY / 100) * canvas.height
        const gradient = ctx.createLinearGradient(0, lineY - 20, 0, lineY + 20)
        gradient.addColorStop(0, 'rgba(0, 255, 170, 0)')
        gradient.addColorStop(0.5, 'rgba(0, 255, 170, 0.6)')
        gradient.addColorStop(1, 'rgba(0, 255, 170, 0)')
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
        // Create a preview by simulating the crop on canvas
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
        case 'pokemon':
          return [...POKEMON_TYPES]
        case 'digimon':
          return [...DIGIMON_TYPES]
        case 'dbz':
          return [...DBZ_TYPES]
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
  }, [extractedTazos, uploadedImageUrl])

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-emerald-400">Tazo Scanner</h2>
        </div>
        {step !== 'upload' && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2">
        {(['upload', 'detect', 'extract'] as ScannerStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                step === s
                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                  : i < ['upload', 'detect', 'extract'].indexOf(step)
                  ? 'bg-emerald-500/10 text-emerald-500/60'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="font-bold">{i + 1}</span>
              <span className="capitalize">{s}</span>
            </div>
            {i < 2 && (
              <div
                className={`h-px w-6 ${
                  i < ['upload', 'detect', 'extract'].indexOf(step)
                    ? 'bg-emerald-500/40'
                    : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* UPLOAD STEP */}
      {step === 'upload' && (
        <Card className="border-dashed border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent">
          <CardContent className="p-6">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-emerald-500/20 bg-background/50 p-8 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-emerald-400" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isUploading ? 'Uploading...' : 'Drop your tazo photo here'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  or click to browse - PNG, JPG, WEBP accepted
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
          </CardContent>
        </Card>
      )}

      {/* DETECT STEP */}
      {step === 'detect' && uploadedImageUrl && (
        <div className="space-y-4">
          {/* Detection Overlay */}
          <Card className="overflow-hidden border-emerald-500/20 bg-black">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm text-emerald-400">
                  <Scan className="h-4 w-4" />
                  Detection View
                </CardTitle>
                {imageDimensions && (
                  <Badge variant="outline" className="text-xs text-emerald-500/70">
                    {imageDimensions.width} x {imageDimensions.height}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative overflow-hidden rounded-lg">
                <canvas
                  ref={canvasRef}
                  className="mx-auto block max-h-[400px] w-auto"
                />
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleDetect}
              disabled={isDetecting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  Scan for Tazos
                </>
              )}
            </Button>

            {regions.length > 0 && (
              <Button
                onClick={handleExtract}
                disabled={isExtracting || regions.filter((r) => r.included).length === 0}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Crop className="mr-2 h-4 w-4" />
                    Extract Selected ({regions.filter((r) => r.included).length})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Region List */}
          {regions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Detected Regions ({regions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {regions.map((region, index) => (
                    <button
                      key={index}
                      onClick={() => toggleRegion(index)}
                      className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-all ${
                        region.included
                          ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15'
                          : 'border-border bg-muted/30 opacity-60 hover:opacity-80'
                      }`}
                    >
                      {region.included ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span>
                        Region {index + 1}
                        <br />
                        <span className="text-muted-foreground">
                          {region.width}x{region.height}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* EXTRACT STEP */}
      {step === 'extract' && extractedTazos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {extractedTazos.length} tazo{extractedTazos.length !== 1 ? 's' : ''} extracted
            </p>
            <Button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSavingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving All...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save All ({extractedTazos.length})
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4">
            {extractedTazos.map((tazo) => (
              <Card key={tazo.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Tazo Preview */}
                  <div className="flex items-center justify-center bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-emerald-500/5 p-6 sm:w-48">
                    <div className="relative">
                      <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-emerald-500/30 bg-muted shadow-lg shadow-emerald-500/10">
                        <img
                          src={tazo.imageUrl}
                          alt="Extracted tazo"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow">
                        {RARITY_CONFIG[tazo.rarity]?.label[0] || 'C'}
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="flex-1 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Name</Label>
                        <Input
                          placeholder="Enter tazo name..."
                          value={tazo.name}
                          onChange={(e) => updateExtractedTazo(tazo.id, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Franchise</Label>
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
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select franchise" />
                          </SelectTrigger>
                          <SelectContent>
                            {franchises.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Collection</Label>
                        <Select
                          value={tazo.collectionId}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'collectionId', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select collection" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCollectionsForFranchise(tazo.franchiseId).map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Combat Type</Label>
                        <Select
                          value={tazo.combatType}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'combatType', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCombatTypesForFranchise(tazo.franchiseId).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Rarity</Label>
                        <Select
                          value={tazo.rarity}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'rarity', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(RARITY_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                {cfg.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Condition</Label>
                        <Select
                          value={tazo.condition}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'condition', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CONDITION_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                {cfg.icon} {cfg.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Physical Type</Label>
                        <Select
                          value={tazo.physicalType}
                          onValueChange={(val) => updateExtractedTazo(tazo.id, 'physicalType', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PHYSICAL_TYPE_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                {cfg.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleSaveIndividual(tazo)}
                        disabled={savingIndividual === tazo.id}
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                      >
                        {savingIndividual === tazo.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="mr-1 h-3 w-3" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state after all saved */}
      {step === 'extract' && extractedTazos.length === 0 && (
        <Card className="border-emerald-500/20">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="font-medium text-emerald-400">All tazos saved!</p>
            <p className="text-sm text-muted-foreground">Your scanned tazos have been added to your collection.</p>
            <Button onClick={handleReset} variant="outline" className="border-emerald-500/30 text-emerald-600">
              <Upload className="mr-2 h-4 w-4" />
              Scan More
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sword,
  Shield,
  RotateCw,
  Weight,
  Target,
  Activity,
  Crosshair,
  Waves,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Franchise, TazoCondition, PhysicalType, Rarity } from '@/lib/game/types'
import {
  MINIMON_TYPES,
  CYBERMON_TYPES,
  DRACOBELL_TYPES,
  RARITY_CONFIG,
  CONDITION_CONFIG,
  PHYSICAL_TYPE_CONFIG,
} from '@/lib/game/types'

interface AddTazoDialogProps {
  onCreated?: (tazo: unknown) => void
}

const STAT_CONFIG = [
  { key: 'attack' as const, label: 'Attack', icon: Sword, color: 'text-red-500' },
  { key: 'defense' as const, label: 'Defense', icon: Shield, color: 'text-blue-500' },
  { key: 'resistance' as const, label: 'Resistance', icon: Activity, color: 'text-indigo-500' },
  { key: 'weight' as const, label: 'Weight', icon: Weight, color: 'text-amber-500' },
  { key: 'stability' as const, label: 'Stability', icon: Waves, color: 'text-teal-500' },
  { key: 'spin' as const, label: 'Spin', icon: RotateCw, color: 'text-green-500' },
  { key: 'control' as const, label: 'Control', icon: Target, color: 'text-cyan-500' },
  { key: 'bounce' as const, label: 'Bounce', icon: Zap, color: 'text-orange-500' },
  { key: 'precision' as const, label: 'Precision', icon: Crosshair, color: 'text-sky-500' },
]

const DEFAULT_FORM = {
  name: '',
  franchiseId: '',
  collectionId: '',
  number: '',
  condition: 'good' as TazoCondition,
  physicalType: 'cardboard' as PhysicalType,
  combatType: '',
  rarity: 'common' as Rarity,
  skill: '',
  skillDesc: '',
  attack: 50,
  defense: 50,
  resistance: 50,
  weight: 50,
  stability: 50,
  spin: 50,
  control: 50,
  bounce: 50,
  precision: 50,
  role: '',
  evolutionFrom: '',
  evolutionTo: '',
  transformStage: '',
  transformOf: '',
  isOwned: false,
}

export function AddTazoDialog({ onCreated }: AddTazoDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Fetch franchises when dialog opens
  useEffect(() => {
    if (!open) return
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
  }, [open])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM)
      setShowAdvanced(false)
    }
  }, [open])

  // Get collections for franchise
  const getCollectionsForFranchise = useCallback(
    (franchiseId: string) => {
      const franchise = franchises.find((f) => f.id === franchiseId)
      return franchise?.collections || []
    },
    [franchises]
  )

  // Get combat types for franchise
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

  // Get current franchise slug
  const currentFranchiseSlug = useCallback(() => {
    const franchise = franchises.find((f) => f.id === form.franchiseId)
    return franchise?.slug || ''
  }, [franchises, form.franchiseId])

  // Update form field
  const updateField = useCallback((field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Handle franchise change
  const handleFranchiseChange = useCallback(
    (val: string) => {
      const collections = getCollectionsForFranchise(val)
      setForm((prev) => ({
        ...prev,
        franchiseId: val,
        collectionId: collections[0]?.id || '',
        combatType: '',
      }))
    },
    [getCollectionsForFranchise]
  )

  // Create tazo
  const handleCreate = useCallback(async () => {
    if (!form.name.trim() || !form.franchiseId || !form.collectionId) return
    setIsSaving(true)
    try {
      const slug = `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
      const res = await fetch('/api/tazos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug,
          franchiseId: form.franchiseId,
          collectionId: form.collectionId,
          number: form.number || null,
          condition: form.condition,
          physicalType: form.physicalType,
          combatType: form.combatType || null,
          rarity: form.rarity,
          skill: form.skill || null,
          skillDesc: form.skillDesc || null,
          attack: form.attack,
          defense: form.defense,
          resistance: form.resistance,
          weight: form.weight,
          stability: form.stability,
          spin: form.spin,
          control: form.control,
          bounce: form.bounce,
          precision: form.precision,
          role: form.role || null,
          evolutionFrom: form.evolutionFrom || null,
          evolutionTo: form.evolutionTo || null,
          transformStage: form.transformStage || null,
          transformOf: form.transformOf || null,
          isOwned: form.isOwned,
        }),
      })
      const data = await res.json()
      if (data.tazo) {
        onCreated?.(data.tazo)
        setOpen(false)
      }
    } catch (err) {
      console.error('Create error:', err)
    } finally {
      setIsSaving(false)
    }
  }, [form, onCreated])

  const canSave = form.name.trim() && form.franchiseId && form.collectionId

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Tazo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Tazo</DialogTitle>
          <DialogDescription>
            Manually add a tazo to your collection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter tazo name..."
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Series *</Label>
                <Select value={form.franchiseId} onValueChange={handleFranchiseChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select series" />
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
                <Label className="text-xs">Collection *</Label>
                <Select
                  value={form.collectionId}
                  onValueChange={(val) => updateField('collectionId', val)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCollectionsForFranchise(form.franchiseId).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Printed Number</Label>
                <Input
                  value={form.number}
                  onChange={(e) => updateField('number', e.target.value)}
                  placeholder="#001"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Combat Type</Label>
                <Select
                  value={form.combatType}
                  onValueChange={(val) => updateField('combatType', val)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCombatTypesForFranchise(form.franchiseId).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Condition</Label>
                <Select
                  value={form.condition}
                  onValueChange={(val) => updateField('condition', val)}
                >
                  <SelectTrigger className="h-9 text-sm">
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
                  value={form.physicalType}
                  onValueChange={(val) => updateField('physicalType', val)}
                >
                  <SelectTrigger className="h-9 text-sm">
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

              <div className="space-y-1.5">
                <Label className="text-xs">Rarity</Label>
                <Select
                  value={form.rarity}
                  onValueChange={(val) => updateField('rarity', val)}
                >
                  <SelectTrigger className="h-9 text-sm">
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
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="space-y-3">
            <Label className="text-xs font-bold">Stats</Label>
            {STAT_CONFIG.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                    <Label className="text-xs">{label}</Label>
                  </div>
                  <span className="min-w-[2rem] text-right text-xs font-mono font-medium">
                    {form[key]}
                  </span>
                </div>
                <Slider
                  value={[form[key]]}
                  min={1}
                  max={99}
                  step={1}
                  onValueChange={([val]) => updateField(key, val)}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Skill */}
          <div className="space-y-3">
            <Label className="text-xs font-bold">Skill</Label>
            <div className="space-y-1.5">
              <Input
                value={form.skill}
                onChange={(e) => updateField('skill', e.target.value)}
                placeholder="Skill name"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Textarea
                value={form.skillDesc}
                onChange={(e) => updateField('skillDesc', e.target.value)}
                placeholder="Skill description..."
                className="min-h-[60px] text-sm"
              />
            </div>
          </div>

          <Separator />

          {/* Advanced: Evolution / Transform */}
          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-between"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Label className="text-xs font-bold">Evolution & Transform</Label>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showAdvanced && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Evolution From</Label>
                    <Input
                      value={form.evolutionFrom}
                      onChange={(e) => updateField('evolutionFrom', e.target.value)}
                      placeholder="Pre-evolution"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Evolution To</Label>
                    <Input
                      value={form.evolutionTo}
                      onChange={(e) => updateField('evolutionTo', e.target.value)}
                      placeholder="Next evolution"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                {currentFranchiseSlug() === 'dracobell' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Transform Stage</Label>
                      <Input
                        value={form.transformStage}
                        onChange={(e) => updateField('transformStage', e.target.value)}
                        placeholder="e.g., SSJ, SSJ2"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Transform Of</Label>
                      <Input
                        value={form.transformOf}
                        onChange={(e) => updateField('transformOf', e.target.value)}
                        placeholder="Base character"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Owned Toggle */}
          <div className="flex items-center justify-between border-2 border-ttg-black p-3">
            <div>
              <Label className="text-sm font-medium">Add to Collection</Label>
              <p className="text-xs text-muted-foreground">Mark this tazo as owned</p>
            </div>
            <Switch
              checked={form.isOwned}
              onCheckedChange={(val) => updateField('isOwned', val)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSaving || !canSave}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Tazo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

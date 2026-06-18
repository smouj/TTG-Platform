'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Save,
  Trash2,
  X,
  Loader2,
  Upload,
  ToggleLeft,
  Sword,
  Shield,
  RotateCw,
  Weight,
  Target,
  Activity,
  Crosshair,
  Waves,
  Zap,
  ChevronDown,
  ChevronUp,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Tazo, Franchise, Collection, TazoCondition, PhysicalType, Rarity } from '@/lib/game/types'
import {
  MINIMON_TYPES,
  CYBERMON_TYPES,
  DRACOBELL_TYPES,
  RARITY_CONFIG,
  CONDITION_CONFIG,
  PHYSICAL_TYPE_CONFIG,
} from '@/lib/game/types'

interface TazoEditorProps {
  tazo: Tazo
  onClose: () => void
  onSave: (updatedTazo: Tazo) => void
  onDelete: (id: string) => void
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

export function TazoEditor({ tazo, onClose, onSave, onDelete }: TazoEditorProps) {
  const [form, setForm] = useState({
    name: tazo.name,
    franchiseId: tazo.franchiseId,
    collectionId: tazo.collectionId,
    number: tazo.number || '',
    condition: tazo.condition as TazoCondition,
    physicalType: tazo.physicalType as PhysicalType,
    combatType: tazo.combatType || '',
    rarity: tazo.rarity as Rarity,
    skill: tazo.skill || '',
    skillDesc: tazo.skillDesc || '',
    attack: tazo.attack,
    defense: tazo.defense,
    resistance: tazo.resistance,
    weight: tazo.weight,
    stability: tazo.stability,
    spin: tazo.spin,
    control: tazo.control,
    bounce: tazo.bounce,
    precision: tazo.precision,
    role: tazo.role || '',
    evolutionFrom: tazo.evolutionFrom || '',
    evolutionTo: tazo.evolutionTo || '',
    transformStage: tazo.transformStage || '',
    transformOf: tazo.transformOf || '',
    isOwned: tazo.isOwned,
  })

  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingOwned, setIsTogglingOwned] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch franchises
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

  // Track changes
  useEffect(() => {
    const changed =
      form.name !== tazo.name ||
      form.franchiseId !== tazo.franchiseId ||
      form.collectionId !== tazo.collectionId ||
      form.number !== (tazo.number || '') ||
      form.condition !== tazo.condition ||
      form.physicalType !== tazo.physicalType ||
      form.combatType !== (tazo.combatType || '') ||
      form.rarity !== tazo.rarity ||
      form.skill !== (tazo.skill || '') ||
      form.skillDesc !== (tazo.skillDesc || '') ||
      form.attack !== tazo.attack ||
      form.defense !== tazo.defense ||
      form.resistance !== tazo.resistance ||
      form.weight !== tazo.weight ||
      form.stability !== tazo.stability ||
      form.spin !== tazo.spin ||
      form.control !== tazo.control ||
      form.bounce !== tazo.bounce ||
      form.precision !== tazo.precision ||
      form.role !== (tazo.role || '') ||
      form.evolutionFrom !== (tazo.evolutionFrom || '') ||
      form.evolutionTo !== (tazo.evolutionTo || '') ||
      form.transformStage !== (tazo.transformStage || '') ||
      form.transformOf !== (tazo.transformOf || '') ||
      form.isOwned !== tazo.isOwned
    setHasChanges(changed)
  }, [form, tazo])

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

  // Save changes
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/tazos/${tazo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
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
        onSave(data.tazo)
        setHasChanges(false)
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }, [tazo.id, form, onSave])

  // Delete tazo
  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/tazos/${tazo.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(tazo.id)
        onClose()
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setIsDeleting(false)
    }
  }, [tazo.id, onDelete, onClose])

  // Toggle owned
  const handleToggleOwned = useCallback(async () => {
    setIsTogglingOwned(true)
    try {
      const res = await fetch(`/api/tazos/${tazo.id}/toggle-owned`, { method: 'PUT' })
      const data = await res.json()
      if (data.tazo) {
        setForm((prev) => ({ ...prev, isOwned: data.tazo.isOwned }))
        onSave(data.tazo)
      }
    } catch (err) {
      console.error('Toggle error:', err)
    } finally {
      setIsTogglingOwned(false)
    }
  }, [tazo.id, onSave])

  const rarityConfig = RARITY_CONFIG[form.rarity]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Edit Tazo</h2>
          {hasChanges && (
            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
              Unsaved changes
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tazo Preview */}
        <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-muted/50 to-transparent px-4 py-6">
          <div className="relative">
            <div
              className={`h-32 w-32 overflow-hidden rounded-full border-4 shadow-[4px_4px_0px_var(--ttg-black)] ${
                form.condition === 'holo'
                  ? 'border-cyan-400/50 shadow-cyan-400/20'
                  : form.condition === 'metallic'
                  ? 'border-slate-400/50 shadow-slate-400/20'
                  : form.condition === 'mint'
                  ? 'border-emerald-400/50 shadow-emerald-400/20'
                  : 'border-border'
              }`}
            >
              {tazo.imageUrl ? (
                <img
                  src={tazo.imageUrl ?? undefined}
                  alt={form.name ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Rarity badge */}
            <div
              className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow ${
                form.rarity === 'legendary'
                  ? 'bg-amber-500'
                  : form.rarity === 'ultra'
                  ? 'bg-purple-500'
                  : form.rarity === 'rare'
                  ? 'bg-blue-500'
                  : form.rarity === 'uncommon'
                  ? 'bg-green-500'
                  : 'bg-zinc-400'
              }`}
            >
              {rarityConfig?.label[0] || 'C'}
            </div>
          </div>

          {/* Condition effect indicator */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs ${CONDITION_CONFIG[form.condition]?.color || ''}`}
            >
              {CONDITION_CONFIG[form.condition]?.icon} {CONDITION_CONFIG[form.condition]?.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {CONDITION_CONFIG[form.condition]?.effect}
            </span>
          </div>

          {/* Owned toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isOwned}
              onCheckedChange={() => handleToggleOwned()}
              disabled={isTogglingOwned}
            />
            <Label className="text-sm">
              {isTogglingOwned ? 'Updating...' : form.isOwned ? 'Owned' : 'Not Owned'}
            </Label>
          </div>
        </div>

        <div className="space-y-4 px-4 pb-4">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={form.name ?? ""}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Tazo name"
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Series</Label>
                  <Select value={form.franchiseId} onValueChange={handleFranchiseChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
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
                    value={form.collectionId}
                    onValueChange={(val) => updateField('collectionId', val)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
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
                    value={form.number ?? ""}
                    onChange={(e) => updateField('number', e.target.value)}
                    placeholder="#001"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Combat Type</Label>
                  <Select
                    value={form.combatType}
                    onValueChange={(val) => updateField('combatType', val)}
                  >
                    <SelectTrigger className="h-8 text-sm">
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
                    value={form.physicalType}
                    onValueChange={(val) => updateField('physicalType', val)}
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

                <div className="space-y-1.5">
                  <Label className="text-xs">Rarity</Label>
                  <Select
                    value={form.rarity}
                    onValueChange={(val) => updateField('rarity', val)}
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
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>

          {/* Skill */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Skill</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Skill Name</Label>
                <Input
                  value={form.skill}
                  onChange={(e) => updateField('skill', e.target.value)}
                  placeholder="Enter skill name..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Skill Description</Label>
                <Textarea
                  value={form.skillDesc}
                  onChange={(e) => updateField('skillDesc', e.target.value)}
                  placeholder="Describe the skill effect..."
                  className="min-h-[60px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Advanced: Evolution / Transform */}
          <Card>
            <CardHeader
              className="cursor-pointer pb-2"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Evolution & Transform
                </CardTitle>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-3">
                {/* Evolution fields - for Minimon & Cybermon */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Evolution From</Label>
                    <Input
                      value={form.evolutionFrom}
                      onChange={(e) => updateField('evolutionFrom', e.target.value)}
                      placeholder="Pre-evolution name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Evolution To</Label>
                    <Input
                      value={form.evolutionTo}
                      onChange={(e) => updateField('evolutionTo', e.target.value)}
                      placeholder="Next evolution name"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Transform fields - for Dracobell */}
                {currentFranchiseSlug() === 'dracobell' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Transform Stage</Label>
                      <Input
                        value={form.transformStage}
                        onChange={(e) => updateField('transformStage', e.target.value)}
                        placeholder="e.g., SSJ, SSJ2"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Transform Of</Label>
                      <Input
                        value={form.transformOf}
                        onChange={(e) => updateField('transformOf', e.target.value)}
                        placeholder="Base character name"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 border-t px-4 py-3">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>

        <Button
          onClick={handleToggleOwned}
          disabled={isTogglingOwned}
          variant="outline"
          size="icon"
          className={form.isOwned ? 'border-emerald-500/30 text-emerald-600' : ''}
        >
          <ToggleLeft className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="border-red-500/30 text-red-600 hover:bg-red-500/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tazo</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{form.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

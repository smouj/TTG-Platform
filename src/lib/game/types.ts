// Game types for Tazos Legends Arena

export interface Tazo {
  id: string;
  name: string;
  slug: string;
  franchiseId: string;
  collectionId: string;
  printedNumber: string | null;
  condition: TazoCondition;
  physicalType: PhysicalType;
  combatType: string | null;
  rarity: Rarity;
  imageUrl: string | null;
  skill: string | null;
  skillDesc: string | null;
  evolutionFrom: string | null;
  evolutionTo: string | null;
  transformStage: string | null;
  transformOf: string | null;
  attack: number;
  defense: number;
  spin: number;
  weight: number;
  aura: number;
  control: number;
  isOwned: boolean;
  battleWins: number;
  battleLosses: number;
  franchise?: Franchise;
  collection?: Collection;
  createdAt: string;
  updatedAt: string;
}

export interface Franchise {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
  description: string | null;
  mechanic: string | null;
  collections?: Collection[];
  tazos?: Tazo[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  franchiseId: string;
  franchise?: Franchise;
  year: number | null;
  totalTazos: number;
  description: string | null;
  tazos?: Tazo[];
}

export interface BattleResult {
  winner: 'player' | 'opponent' | 'draw';
  victoryType: 'knockout' | 'ring-out' | 'spin-out' | 'combo' | null;
  rounds: number;
  battleLog: BattleEvent[];
  playerTazos: BattleTazo[];
  opponentTazos: BattleTazo[];
}

export interface BattleEvent {
  round: number;
  type: 'collision' | 'spin_decay' | 'ring_out' | 'knockout' | 'type_advantage' | 'evolution' | 'transform' | 'skill' | 'combo';
  description: string;
  actorId?: string;
  targetId?: string;
  damage?: number;
}

export interface BattleTazo extends Tazo {
  currentHp: number;
  maxHp: number;
  currentSpin: number;
  maxSpin: number;
  kiCharge?: number;
  isEvolved?: boolean;
  isTransformed?: boolean;
}

export type TazoCondition = 'mint' | 'good' | 'used' | 'worn' | 'holo' | 'metallic';
export type PhysicalType = 'cardboard' | 'plastic' | 'metal' | 'holo';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'ultra' | 'legendary';

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bgColor: string; borderColor: string }> = {
  common: { label: 'Common', color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' },
  uncommon: { label: 'Uncommon', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
  rare: { label: 'Rare', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  ultra: { label: 'Ultra', color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
  legendary: { label: 'Legendary', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-400' },
};

export const CONDITION_CONFIG: Record<TazoCondition, { label: string; color: string; icon: string; effect: string }> = {
  mint: { label: 'Mint', color: 'text-emerald-600', icon: '✨', effect: '+20% collection value' },
  good: { label: 'Good', color: 'text-green-600', icon: '👍', effect: 'Normal stats' },
  used: { label: 'Used', color: 'text-yellow-600', icon: '🔄', effect: '-10% control' },
  worn: { label: 'Worn', color: 'text-orange-600', icon: '⚔️', effect: '-20% spin, +15% veteran bonus' },
  holo: { label: 'Holographic', color: 'text-cyan-600', icon: '🌈', effect: '+30% aura' },
  metallic: { label: 'Metallic', color: 'text-slate-600', icon: '🛡️', effect: '+25% weight' },
};

export const PHYSICAL_TYPE_CONFIG: Record<PhysicalType, { label: string; color: string }> = {
  cardboard: { label: 'Cardboard', color: 'text-amber-700' },
  plastic: { label: 'Plastic', color: 'text-blue-600' },
  metal: { label: 'Metal', color: 'text-slate-600' },
  holo: { label: 'Holo', color: 'text-cyan-500' },
};

export const FRANCHISE_SLUGS = {
  pokemon: 'pokemon',
  digimon: 'digimon',
  dbz: 'dbz',
} as const;

export const POKEMON_TYPES = ['fire', 'water', 'grass', 'electric', 'psychic', 'ghost', 'dragon', 'normal'] as const;
export const DIGIMON_TYPES = ['vaccine', 'virus', 'data'] as const;
export const DBZ_TYPES = ['saiyan', 'namekian', 'android', 'majin', 'frieza'] as const;

export type GameView = 'album' | 'battle' | 'scanner' | 'stats';

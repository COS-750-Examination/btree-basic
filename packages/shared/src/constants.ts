export const OBJECTIVES = [
  { id: 'O1', label: 'Identify the rules of a B-tree of order m', bloom: 'Remember' },
  { id: 'O2', label: 'Decide whether a tree is a valid B-tree', bloom: 'Understand' },
  { id: 'O3', label: 'Search a B-tree for a key', bloom: 'Apply' },
  { id: 'O4', label: 'Insert a key into a leaf with space', bloom: 'Apply' },
  { id: 'O5', label: 'Split an overflowing node', bloom: 'Apply' },
  { id: 'O6', label: 'Trace a split that reaches the root', bloom: 'Analyse' },
  { id: 'O7', label: 'Explain why B-trees stay short and fast', bloom: 'Understand' },
  { id: 'O8', label: 'Delete a key and repair an underflow', bloom: 'Apply' },
] as const;

export type ObjectiveId = (typeof OBJECTIVES)[number]['id'];
export const OBJECTIVE_IDS = OBJECTIVES.map((o) => o.id) as [ObjectiveId, ...ObjectiveId[]];

export const MODULES = [
  {
    id: 1,
    slug: 'why-b-trees',
    title: 'Why do we need B-trees?',
    format: 'Video + reading',
    minutes: 4,
  },
  {
    id: 2,
    slug: 'search-trees-recap',
    title: 'Search trees recap',
    format: 'Added after the warm-up',
    minutes: 5,
  },
  {
    id: 3,
    slug: 'binary-to-multiway',
    title: 'From binary to multiway',
    format: 'Animation + reading',
    minutes: 5,
  },
  {
    id: 4,
    slug: 'b-tree-rules',
    title: 'The B-tree rules',
    format: 'Reading + check yourself',
    minutes: 6,
  },
  {
    id: 5,
    slug: 'searching',
    title: 'Searching a B-tree',
    format: 'Visualiser + practice',
    minutes: 6,
  },
  {
    id: 6,
    slug: 'inserting-and-splitting',
    title: 'Inserting and splitting',
    format: 'The main algorithm',
    minutes: 8,
  },
  {
    id: 7,
    slug: 'deleting',
    title: 'Deleting a key',
    format: 'Visualiser + reading',
    minutes: 8,
  },
  {
    id: 8,
    slug: 'why-it-stays-short',
    title: 'Why it stays short',
    format: 'B-tree vs BST',
    minutes: 4,
  },
  {
    id: 9,
    slug: 'real-world',
    title: 'B-trees in the real world',
    format: 'Databases and file systems',
    minutes: 3,
  },
  {
    id: 10,
    slug: 'ready-check',
    title: 'Ready-for-lecture check',
    format: '8-question quiz with hints',
    minutes: 8,
  },
] as const;

export type ModuleId = (typeof MODULES)[number]['id'];

export const LEAF_REWARDS = {
  lesson: 30,
  firstTry: 10,
  withHint: 5,
  hintRead: 5,
  streak: 15,
  readyCheck: 60,
} as const;

export type LeafReason = keyof typeof LEAF_REWARDS | 'purchase';

export const GROWTH_STAGES = [
  { id: 'seed', label: 'Seed', minModules: 0 },
  { id: 'sprout', label: 'Sprout', minModules: 1 },
  { id: 'shrub', label: 'Shrub', minModules: 3 },
  { id: 'sapling', label: 'Sapling', minModules: 5 },
  { id: 'young-tree', label: 'Young tree', minModules: 7 },
  { id: 'full-tree', label: 'Full tree', minModules: 10 },
] as const;

export type GrowthStageId = (typeof GROWTH_STAGES)[number]['id'];
export const GROWTH_STAGE_IDS = GROWTH_STAGES.map((s) => s.id) as [
  GrowthStageId,
  ...GrowthStageId[],
];

export const CONFIDENCE_LEVELS = ['guessing', 'fairly-sure', 'certain'] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const READY_THRESHOLD = 0.8;
export const REMEDIATION_THRESHOLD = 0.6;

export const DAY_TIMEZONE = 'Africa/Johannesburg';

export const STREAK_BONUS_DAYS = 3;

export const RUN_GAP_MINUTES = 30;

export const READY_CHECK_ITEM_IDS = [
  'r-o1',
  'r-o2',
  'r-o3',
  'r-o4',
  'r-o5',
  'r-o6',
  'r-o7',
  'r-o8',
] as const;

export const READY_CHECK_PASS = Math.ceil(READY_THRESHOLD * READY_CHECK_ITEM_IDS.length);

export const DECORATIONS = [
  { id: 'apples', name: 'Apples', cost: 40, minStage: 'sapling' },
  { id: 'blossoms', name: 'Blossoms', cost: 40, minStage: 'sapling' },
  { id: 'bunting', name: 'Bunting', cost: 50, minStage: 'sapling' },
  { id: 'songbird', name: 'Songbird', cost: 60, minStage: 'sapling' },
  { id: 'butterflies', name: 'Butterflies', cost: 60, minStage: 'sprout' },
  { id: 'lanterns', name: 'Lanterns', cost: 70, minStage: 'sapling' },
  { id: 'fairy-lights', name: 'Fairy lights', cost: 80, minStage: 'sapling' },
  { id: 'bird-box', name: 'Bird box', cost: 90, minStage: 'sapling' },
  { id: 'tree-swing', name: 'Tree swing', cost: 120, minStage: 'young-tree' },
] as const satisfies readonly { id: string; name: string; cost: number; minStage: GrowthStageId }[];

export type DecorationId = (typeof DECORATIONS)[number]['id'];

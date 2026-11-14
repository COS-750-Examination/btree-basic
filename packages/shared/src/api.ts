import { z } from 'zod';
import {
  BADGE_IDS,
  CONFIDENCE_LEVELS,
  GROWTH_STAGE_IDS,
  MODULES,
  OBJECTIVE_IDS,
} from './constants';

export const RegisterBody = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
  displayName: z.string().trim().min(1).max(40),
});
export type RegisterBody = z.infer<typeof RegisterBody>;

export const LoginBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const PublicUser = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  plantedAt: z.string(),
});
export type PublicUser = z.infer<typeof PublicUser>;

export const ObjectiveIdSchema = z.enum(OBJECTIVE_IDS);
export const ConfidenceSchema = z.enum(CONFIDENCE_LEVELS);
export const GrowthStageSchema = z.enum(GROWTH_STAGE_IDS);

export const ModuleProgress = z.object({
  moduleId: z.number().int().min(1).max(MODULES.length),
  part: z.number().int().min(1).default(1),
  completed: z.boolean(),
});
export type ModuleProgress = z.infer<typeof ModuleProgress>;

export const ProgressPutBody = z.object({ modules: z.array(ModuleProgress).max(20) });
export type ProgressPutBody = z.infer<typeof ProgressPutBody>;

export const QuizAttemptBody = z.object({
  itemId: z.string().min(1).max(100),
  objective: ObjectiveIdSchema,
  correct: z.boolean(),
  firstAttempt: z.boolean(),
  hintsUsed: z.number().int().min(0).max(3),
  confidence: ConfidenceSchema.optional(),
  misconception: z.string().max(60).optional(),
});
export type QuizAttemptBody = z.infer<typeof QuizAttemptBody>;

export const ObjectiveMastery = z.object({
  objective: ObjectiveIdSchema,
  score: z.number().min(0).max(1),
  counted: z.number().int().min(0),
  status: z.enum(['mastered', 'getting-there', 'not-started']),
});
export type ObjectiveMastery = z.infer<typeof ObjectiveMastery>;

export const ReadinessSummary = z.object({
  overall: z.number().min(0).max(1),
  ready: z.boolean(),
  objectives: z.array(ObjectiveMastery),
  modulesDone: z.number().int().min(0),
  stage: GrowthStageSchema,
  leaves: z.number().int(),
});
export type ReadinessSummary = z.infer<typeof ReadinessSummary>;

export const HintBody = z.object({
  itemId: z.string().min(1).max(100),
  hint: z.number().int().min(1).max(3),
});
export type HintBody = z.infer<typeof HintBody>;

export const LeafBonus = z.object({
  reason: z.enum(['streak', 'readyCheck']),
  amount: z.number().int(),
});
export type LeafBonus = z.infer<typeof LeafBonus>;

export const AttemptResult = ObjectiveMastery.extend({ bonuses: z.array(LeafBonus) });
export type AttemptResult = z.infer<typeof AttemptResult>;

export const StreakSummary = z.object({ days: z.number().int().min(0) });
export type StreakSummary = z.infer<typeof StreakSummary>;

export const BadgeIdSchema = z.enum(BADGE_IDS);

export const Badge = z.object({
  id: BadgeIdSchema,
  label: z.string(),
  description: z.string(),
  awardedAt: z.string().nullable(),
});
export type Badge = z.infer<typeof Badge>;

export const WarmupBody = z.object({
  answers: z
    .array(
      z.object({ itemId: z.string(), correct: z.boolean(), skipped: z.boolean().default(false) }),
    )
    .max(10),
});
export type WarmupBody = z.infer<typeof WarmupBody>;

export const LeafTransaction = z.object({
  id: z.string(),
  amount: z.number().int(),
  reason: z.string(),
  createdAt: z.string(),
});
export type LeafTransaction = z.infer<typeof LeafTransaction>;

export const Decoration = z.object({
  id: z.string(),
  name: z.string(),
  cost: z.number().int().min(0),
  owned: z.boolean(),
});
export type Decoration = z.infer<typeof Decoration>;

export const LectureQuestionBody = z.object({ text: z.string().trim().min(1).max(280) });
export type LectureQuestionBody = z.infer<typeof LectureQuestionBody>;

export const LectureQuestion = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string(),
});
export type LectureQuestion = z.infer<typeof LectureQuestion>;

export const FriendRequestBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});
export type FriendRequestBody = z.infer<typeof FriendRequestBody>;

export const FriendSummary = z.object({
  id: z.string(),
  displayName: z.string(),
  stage: GrowthStageSchema,
  modulesDone: z.number().int(),
  since: z.string(),
});
export type FriendSummary = z.infer<typeof FriendSummary>;

export const FriendGrove = FriendSummary.extend({
  plantedAt: z.string(),
  streakDays: z.number().int(),
  decorations: z.array(z.string()),
  completedModules: z.array(z.number().int()),
  currentModule: z.number().int().nullable(),
});
export type FriendGrove = z.infer<typeof FriendGrove>;

export const IncomingFriendRequest = z.object({ id: z.string(), fromName: z.string() });
export type IncomingFriendRequest = z.infer<typeof IncomingFriendRequest>;

export const OutgoingFriendRequest = z.object({
  id: z.string(),
  email: z.string(),
  sentAt: z.string(),
});
export type OutgoingFriendRequest = z.infer<typeof OutgoingFriendRequest>;

export const FriendsList = z.object({
  friends: z.array(FriendSummary),
  incoming: z.array(IncomingFriendRequest),
  outgoing: z.array(OutgoingFriendRequest),
});
export type FriendsList = z.infer<typeof FriendsList>;

export const CheerBody = z.object({
  message: z.string().trim().max(140).optional(),
  moduleId: z.number().int().min(1).max(MODULES.length).optional(),
});
export type CheerBody = z.infer<typeof CheerBody>;

export const Cheer = z.object({
  id: z.string(),
  fromName: z.string(),
  toName: z.string(),
  message: z.string().nullable(),
  moduleId: z.number().int().nullable(),
  createdAt: z.string(),
});
export type Cheer = z.infer<typeof Cheer>;

export const ApiError = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiError>;

import type { ObjectiveMastery, ReadinessSummary } from './api';
import { GROWTH_STAGES, OBJECTIVES, READY_THRESHOLD } from './constants';
import type { GrowthStageId, ObjectiveId } from './constants';

export interface AttemptLike {
  objective: ObjectiveId;
  correct: boolean;
  firstAttempt: boolean;
  hintsUsed: number;
}

/** Mastery needs at least this many counted answers before an objective can be "mastered". */
export const MIN_COUNTED_FOR_MASTERY = 3;

/** Only first-attempt answers given without hints count toward mastery (ID doc, Assessment Strategy). */
export const countsTowardMastery = (a: AttemptLike): boolean => a.firstAttempt && a.hintsUsed === 0;

export function objectiveMastery(attempts: AttemptLike[]): ObjectiveMastery[] {
  return OBJECTIVES.map(({ id }) => {
    const counted = attempts.filter((a) => a.objective === id && countsTowardMastery(a));
    const score = counted.length ? counted.filter((a) => a.correct).length / counted.length : 0;
    const status: ObjectiveMastery['status'] =
      counted.length === 0
        ? 'not-started'
        : score >= READY_THRESHOLD && counted.length >= MIN_COUNTED_FOR_MASTERY
          ? 'mastered'
          : 'getting-there';
    return { objective: id, score, counted: counted.length, status };
  });
}

export function stageFor(modulesDone: number): GrowthStageId {
  let stage: GrowthStageId = 'seed';
  for (const s of GROWTH_STAGES) if (modulesDone >= s.minModules) stage = s.id;
  return stage;
}

export function readiness(
  attempts: AttemptLike[],
  modulesDone: number,
  leaves: number,
): ReadinessSummary {
  const objectives = objectiveMastery(attempts);
  const overall = objectives.reduce((sum, o) => sum + o.score, 0) / objectives.length;
  return {
    overall,
    ready: overall >= READY_THRESHOLD,
    objectives,
    modulesDone,
    stage: stageFor(modulesDone),
    leaves,
  };
}

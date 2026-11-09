import type { Confidence, QuizItem } from '@btree/shared';
import { useCallback, useState } from 'react';
import { useProgressStore } from '../../stores/progressStore';
import type { Answer } from './QuestionCard';

/**
 * Attempt/hint bookkeeping for one question (Assessment Strategy):
 * a wrong answer unlocks the next hint; only a first-try, no-hint answer counts toward mastery.
 */
export function useQuestion(item: QuizItem, { record = true }: { record?: boolean } = {}) {
  const { recordAttempt, readHint } = useProgressStore();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [tries, setTries] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [hintUnlocked, setHintUnlocked] = useState(true);
  const [confidence, setConfidence] = useState<Confidence | undefined>();
  const [key, setKey] = useState(0);

  const submit = useCallback(
    (_choice: string, result: Answer) => {
      setAnswer(result);
      if (record) {
        recordAttempt({
          itemId: item.id,
          objective: item.objective,
          correct: result.correct,
          firstAttempt: tries === 0,
          hintsUsed: hintsShown,
          confidence,
          misconception: result.misconception,
        });
      }
      setTries((t) => t + 1);
      if (!result.correct) setHintUnlocked(true);
    },
    [record, recordAttempt, item, tries, hintsShown, confidence],
  );

  const revealHint = useCallback(() => {
    setHintsShown((h) => Math.min(h + 1, item.hints.length));
    // Hint 3 (worked example) unlocks only after another try.
    setHintUnlocked(hintsShown + 1 < 2);
    if (record) readHint();
  }, [item.hints.length, hintsShown, record, readHint]);

  const tryAgain = useCallback(() => {
    setAnswer(null);
    setKey((k) => k + 1); // remounts the card to clear its selection
  }, []);

  return {
    answer,
    tries,
    hintsShown,
    canRevealHint: hintUnlocked && hintsShown < item.hints.length,
    confidence,
    setConfidence,
    submit,
    revealHint,
    tryAgain,
    cardKey: `${item.id}-${key}`,
    solved: Boolean(answer?.correct),
  };
}

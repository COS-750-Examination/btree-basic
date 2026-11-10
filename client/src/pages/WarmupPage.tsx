import { useState } from 'react';
import { useNavigate } from 'react-router';
import { QuestionCard, type Answer } from '../components/quiz/QuestionCard';
import { Button, ButtonLink, Card, CardTitle, ProgressSegments } from '../components/ui';
import { warmup } from '../lib/content';
import { useProgressStore } from '../stores/progressStore';

/** Screen 02: diagnostic warm-up on prerequisites. Not graded; decides whether module 2 is added. */
export function WarmupPage() {
  const navigate = useNavigate();
  const finishWarmup = useProgressStore((s) => s.finishWarmup);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ itemId: string; correct: boolean; skipped: boolean }[]>(
    [],
  );
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [done, setDone] = useState(false);
  const items = warmup.items;
  const item = items[index]!;

  const advance = (correct: boolean, skipped: boolean) => {
    const next = [...results, { itemId: item.id, correct, skipped }];
    setResults(next);
    setAnswer(null);
    if (index + 1 < items.length) setIndex(index + 1);
    else {
      const score = next.filter((r) => r.correct).length;
      finishWarmup(score, items.length, next);
      setDone(true);
    }
  };

  if (done) {
    const score = results.filter((r) => r.correct).length;
    const recap = score < Math.ceil(items.length * 0.6);
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="text-display-l">Your seed is planted!</h1>
        <p className="text-ink-muted mt-3">
          You got {score} of {items.length}.{' '}
          {recap
            ? "We've added a short search-trees recap (module 2) to your path."
            : 'Your tree basics look solid, so the recap is optional.'}
        </p>
        <ButtonLink to="/lessons" className="mt-6">
          Go to your lessons
        </ButtonLink>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-heading">
          Warm-up · Question {index + 1} of {items.length}
        </h1>
        <ProgressSegments
          className="min-w-48 flex-1"
          total={items.length}
          done={index}
          current={index}
          label="Warm-up progress"
        />
        <Button variant="outline" onClick={() => navigate('/lessons')}>
          Exit warm-up
        </Button>
      </div>
      <p className="text-ink-muted text-small mt-3">{warmup.intro}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <span className="bg-highlight text-on-highlight text-small mb-3 inline-block rounded-sm px-2 py-1 font-bold">
            Prerequisite · {item.objective === 'O7' ? 'Big-O' : 'Search trees'}
          </span>
          <QuestionCard
            key={item.id}
            item={item}
            answer={answer}
            onSubmit={(_c, a) => setAnswer(a)}
            locked={Boolean(answer)}
          />
        </Card>
        <div className="space-y-4">
          <Card tone="accent">
            <CardTitle>Why a warm-up?</CardTitle>
            <p className="text-small">
              Five quick questions check search trees, tree words (root, leaf, height) and a little
              Big-O. If tree basics are new to you, we&apos;ll add a short recap to your path.
            </p>
          </Card>
          <Card>
            <CardTitle>Your seed</CardTitle>
            <p className="text-ink-muted text-small">
              Finish the warm-up to plant it. It sprouts after module 1 and grows as you master each
              module.
            </p>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <Button variant="outline" onClick={() => advance(false, true)}>
          I don&apos;t know yet, skip
        </Button>
        <Button onClick={() => advance(Boolean(answer?.correct), false)} disabled={!answer}>
          {index + 1 < items.length ? 'Next question' : 'Finish'}
        </Button>
      </div>
    </div>
  );
}

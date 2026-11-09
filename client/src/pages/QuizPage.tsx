import { MODULES, REMEDIATION_THRESHOLD, type QuizFile, type QuizItem } from '@btree/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { HintLadder } from '../components/quiz/HintLadder';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { useQuestion } from '../components/quiz/useQuestion';
import {
  Button,
  ButtonLink,
  Card,
  CardTitle,
  LeafIcon,
  PageHeader,
  ProgressSegments,
} from '../components/ui';
import { quizFor, quizzes } from '../lib/content';

/** Screen 07: module quick check with tiered hints and misconception-specific feedback (FR6, FR8). */
export function QuizPage() {
  const param = Number(useParams().moduleId);
  const quiz = quizFor(param) ?? quizzes[0];
  if (!quiz) {
    return (
      <Card>
        <p>
          No quizzes yet. Add one in <code>client/src/content/quizzes</code>.
        </p>
      </Card>
    );
  }
  return <Quiz key={quiz.moduleId} quiz={quiz} />;
}

function Quiz({ quiz }: { quiz: QuizFile }) {
  const [index, setIndex] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const item = quiz.items[index]!;
  const module = MODULES.find((m) => m.id === quiz.moduleId);

  const next = (countedCorrect: boolean) => {
    if (countedCorrect) setFirstTryCorrect((n) => n + 1);
    if (index + 1 < quiz.items.length) setIndex(index + 1);
    else setFinished(true);
  };

  if (finished) {
    const score = firstTryCorrect / quiz.items.length;
    const needsHelp = score < REMEDIATION_THRESHOLD;
    return (
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl">{needsHelp ? 'Good effort, let’s firm this up' : 'Nice work!'}</h1>
        <p className="text-muted mt-3">
          {firstTryCorrect} of {quiz.items.length} right on the first try without hints.
        </p>
        {needsHelp ? (
          <div className="mt-5 space-y-3">
            <p>Here is some extra support before the lecture:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to={`/lessons/${quiz.moduleId}`}>Re-watch the worked example</ButtonLink>
              <ButtonLink to="/practice/split-it-yourself" variant="outline">
                Practise with new keys
              </ButtonLink>
            </div>
          </div>
        ) : (
          <ButtonLink to="/ready" className="mt-5">
            See how ready you are
          </ButtonLink>
        )}
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        tag={`Module ${quiz.moduleId} check`}
        title="Quick check"
        actions={
          <p className="text-muted text-sm">
            No time limit. Wrong answers unlock hints, not penalties.
          </p>
        }
      />
      <QuizQuestion
        key={item.id}
        item={item}
        index={index}
        total={quiz.items.length}
        moduleId={quiz.moduleId}
        moduleLabel={`${module?.title.toLowerCase()} (${module?.minutes} min)`}
        onNext={next}
      />
    </div>
  );
}

/** One question; keyed by item id so attempt and hint state resets between questions. */
function QuizQuestion({
  item,
  index,
  total,
  moduleId,
  moduleLabel,
  onNext,
}: {
  item: QuizItem;
  index: number;
  total: number;
  moduleId: number;
  moduleLabel: string;
  onNext: (countedCorrect: boolean) => void;
}) {
  const q = useQuestion(item);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <span className="shrink-0 text-sm font-bold">
            Question {index + 1} of {total}
          </span>
          <ProgressSegments
            className="flex-1"
            total={total}
            done={index}
            current={index}
            label="Quiz progress"
          />
        </div>
        <QuestionCard
          key={q.cardKey}
          item={item}
          answer={q.answer}
          onSubmit={q.submit}
          locked={Boolean(q.answer)}
          confidence={q.confidence}
          onConfidence={q.setConfidence}
        />
        <div className="mt-6 flex justify-end gap-3">
          {q.answer && !q.solved && (
            <Button variant="outline" onClick={q.tryAgain}>
              Try again
            </Button>
          )}
          <Button
            onClick={() => onNext(q.tries === 1 && q.solved && q.hintsShown === 0)}
            disabled={!q.answer}
          >
            {index + 1 < total ? 'Next question' : 'Finish'}
          </Button>
        </div>
      </Card>
      <aside className="space-y-4">
        <HintLadder
          hints={item.hints}
          shown={q.hintsShown}
          canReveal={q.canRevealHint}
          onReveal={q.revealHint}
          onTryAgain={q.answer && !q.solved ? q.tryAgain : undefined}
        />
        <Card>
          <CardTitle>Need more?</CardTitle>
          <Link to={`/lessons/${moduleId}`} className="flex gap-2 font-bold hover:underline">
            <LeafIcon className="h-4 w-4 shrink-0" />
            Mini-lesson: {moduleLabel}
          </Link>
        </Card>
      </aside>
    </div>
  );
}

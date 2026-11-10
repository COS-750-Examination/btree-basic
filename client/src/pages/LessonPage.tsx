import { fromSpec, insert, remove, search } from '@btree/engine';
import { MODULES, type QuizItem } from '@btree/shared';
import { Headphones, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import { Link, useParams, useSearchParams } from 'react-router';
import { HintLadder } from '../components/quiz/HintLadder';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { useQuestion } from '../components/quiz/useQuestion';
import { TracePlayer } from '../components/visualiser/TracePlayer';
import { Breadcrumbs, Button, ButtonLink, Card, LeafIcon, Tag, cn } from '../components/ui';
import { lessonFor, lessonMarkdown, presets, quizFor } from '../lib/content';
import { plainText, speak, speechSupported, stopSpeaking } from '../lib/speech';
import { moduleStatus, useProgressStore } from '../stores/progressStore';
import { NotFoundPage } from './NotFoundPage';

/** Worked example shown on the "Watch" tab for each module/part. Edit freely. */
const WATCH_PRESET: Record<string, string> = {
  '3': 'search-path',
  '4': 'leaf-overflows',
  '5': 'search-path',
  '6:overflow': 'leaf-overflows',
  '6:split': 'leaf-overflows',
  '6:cascade': 'root-splits',
  '7': 'order-5',
};

type Mode = 'read' | 'watch' | 'listen';

/** Screen 04: one lesson part with Read / Watch / Listen (VARK) and a "Check yourself" question. */
export function LessonPage() {
  const moduleId = Number(useParams().moduleId);
  const [params, setParams] = useSearchParams();
  const lesson = lessonFor(moduleId);
  const meta = MODULES.find((m) => m.id === moduleId);
  const store = useProgressStore();
  const [mode, setMode] = useState<Mode>('read');
  const [speaking, setSpeaking] = useState(false);

  const partIndex =
    Math.min(
      Math.max(Number(params.get('part') ?? store.modules[moduleId]?.part ?? 1), 1),
      lesson?.parts.length ?? 1,
    ) - 1;
  const part = lesson?.parts[partIndex];
  const md = part ? lessonMarkdown(part.file) : '';

  const presetId = WATCH_PRESET[`${moduleId}:${part?.id}`] ?? WATCH_PRESET[String(moduleId)];
  const trace = useMemo(() => {
    const p = presets.find((x) => x.id === presetId);
    if (!p) return null;
    const fn = p.operation === 'search' ? search : p.operation === 'insert' ? insert : remove;
    return fn(fromSpec(p.order, p.tree), p.key);
  }, [presetId]);

  useEffect(() => {
    if (lesson) store.setPart(moduleId, partIndex + 1);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, partIndex]);

  if (!lesson || !meta || !part) return <NotFoundPage />;
  if (moduleStatus(moduleId, store) === 'locked') {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="text-heading">This module is still locked</h1>
        <p className="text-ink-muted mt-2">
          Finish the modules before it first. Each one builds on the last.
        </p>
        <ButtonLink to="/lessons" className="mt-4">
          Back to lessons
        </ButtonLink>
      </Card>
    );
  }

  const isLast = partIndex === lesson.parts.length - 1;
  const quiz = quizFor(moduleId);
  const checkItem = part.id === 'check' || isLast ? quiz?.items[0] : undefined;
  const goPart = (i: number) => {
    setMode('read');
    setSpeaking(false);
    setParams({ part: String(i + 1) });
  };

  const toggleListen = () => {
    if (speaking) stopSpeaking();
    else speak(`${lesson.headline}. ${plainText(md)}`);
    setSpeaking(!speaking);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        <Card>
          <p className="text-ink-muted text-small font-bold">Module {moduleId}</p>
          <h2 className="text-body mb-3">{meta.title}</h2>
          <ol className="space-y-1">
            {lesson.parts.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => goPart(i)}
                  aria-current={i === partIndex ? 'step' : undefined}
                  className={cn(
                    'text-small flex w-full items-center gap-3 rounded-md px-2 py-2 text-left',
                    i === partIndex && 'bg-sky-100 font-bold',
                  )}
                >
                  {i < partIndex ? (
                    <LeafIcon className="h-4 w-4 shrink-0" />
                  ) : (
                    <span
                      className={cn(
                        'border-ink rounded-pill h-4 w-4 shrink-0 border-2',
                        i === partIndex && 'bg-highlight',
                      )}
                      aria-hidden
                    />
                  )}
                  {p.title}
                </button>
              </li>
            ))}
          </ol>
        </Card>
        <Tag>+30 leaves when you finish this module</Tag>
      </aside>

      <article>
        <Breadcrumbs
          items={[
            { label: 'Lessons', to: '/lessons' },
            { label: `Module ${moduleId}` },
            { label: `Part ${partIndex + 1} of ${lesson.parts.length}` },
          ]}
        />
        <h1 className="text-display-l sm:text-display-l">{lesson.headline}</h1>

        <div role="tablist" aria-label="How to study this part" className="mt-4 flex gap-2">
          {(['read', 'watch', 'listen'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              disabled={(m === 'watch' && !trace) || (m === 'listen' && !speechSupported())}
              onClick={() => setMode(m)}
              className={cn(
                'shadow-paper-stack-sm text-small rounded-sm px-3 py-1 font-bold capitalize disabled:opacity-40',
                mode === m ? 'bg-highlight text-on-highlight' : 'bg-paper',
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <Card className="mt-4" role="tabpanel">
          {mode === 'watch' && trace ? (
            <TracePlayer trace={trace} />
          ) : (
            <>
              {mode === 'listen' && (
                <Button variant="accent" onClick={toggleListen} className="mb-4">
                  {speaking ? <Square className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                  {speaking ? 'Stop' : 'Listen to this part'}
                </Button>
              )}
              <div className="prose-lesson [&_td]:border-ink/20 space-y-3 text-[17px] leading-relaxed [&_blockquote]:rounded-lg [&_blockquote]:bg-sky-100 [&_blockquote]:p-4 [&_code]:font-mono [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:font-extrabold [&_table]:w-full [&_td]:border-b [&_td]:py-1 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6">
                <Markdown>{md}</Markdown>
              </div>
            </>
          )}
        </Card>

        {checkItem && <CheckYourself item={checkItem} />}

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => goPart(partIndex - 1)}
            disabled={partIndex === 0}
          >
            Previous
          </Button>
          {isLast ? (
            <ButtonLink
              to={quiz ? `/quiz/${moduleId}` : '/lessons'}
              onClick={() => store.completeModule(moduleId)}
            >
              {quiz ? 'Finish and take the quick check' : 'Finish module'}
            </ButtonLink>
          ) : (
            <Button onClick={() => goPart(partIndex + 1)}>Next part</Button>
          )}
        </div>
        <p className="text-ink-muted text-small mt-4">
          Want to try it yourself?{' '}
          <Link to="/visualiser" className="font-bold underline">
            Open the visualiser
          </Link>
          .
        </p>
      </article>
    </div>
  );
}

function CheckYourself({ item }: { item: QuizItem }) {
  const q = useQuestion(item);
  return (
    <section aria-labelledby="check-yourself" className="mt-6 grid gap-4 xl:grid-cols-[1fr_300px]">
      <Card>
        <p id="check-yourself" className="text-ink-muted text-small mb-2 font-bold">
          Check yourself
        </p>
        <QuestionCard
          key={q.cardKey}
          item={item}
          answer={q.answer}
          onSubmit={q.submit}
          locked={Boolean(q.answer)}
        />
        {q.answer && !q.solved && (
          <Button variant="outline" size="sm" className="mt-4" onClick={q.tryAgain}>
            Try again
          </Button>
        )}
      </Card>
      <HintLadder
        hints={item.hints}
        shown={q.hintsShown}
        canReveal={q.canRevealHint}
        onReveal={q.revealHint}
        onTryAgain={q.answer && !q.solved ? q.tryAgain : undefined}
      />
    </section>
  );
}

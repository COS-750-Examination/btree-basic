import {
  GROWTH_STAGES,
  MODULES,
  OBJECTIVES,
  ReadinessSummary,
  READY_THRESHOLD,
  type ObjectiveId,
} from '@btree/shared';
import { useQuery } from '@tanstack/react-query';
import { HelpCircle, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { api } from '../api/client';
import { useMe } from '../api/hooks';
import {
  Button,
  ButtonLink,
  Card,
  CardTitle,
  LeafIcon,
  PageHeader,
  ProgressBar,
  StatusBadge,
} from '../components/ui';
import { useLocalReadiness, useProgressStore } from '../stores/progressStore';

/** Where to revisit when an objective is not yet mastered. */
const REVISIT: Record<ObjectiveId, { to: string; label: string; module: number }> = {
  O1: { to: '/lessons/4', label: 'Module 4: the B-tree rules', module: 4 },
  O2: { to: '/practice/valid-or-not', label: 'Practice: valid or not?', module: 4 },
  O3: {
    to: '/practice/predict-search-path',
    label: 'Practice: predict the search path',
    module: 5,
  },
  O4: { to: '/practice/where-does-it-go', label: 'Practice: where does it go?', module: 6 },
  O5: { to: '/practice/split-it-yourself', label: 'Practice: split it yourself', module: 6 },
  O6: { to: '/lessons/6?part=3', label: 'Module 6: when the root splits', module: 6 },
  O7: { to: '/lessons/8', label: 'Module 8: why it stays short', module: 8 },
  O8: { to: '/lessons/7', label: 'Module 7: deleting a key', module: 7 },
};

/** Screen 08: overall readiness, a breakdown per objective, what to revisit, and questions for the lecture. */
export function ReadyPage() {
  const me = useMe();
  const local = useLocalReadiness();
  const server = useQuery({
    queryKey: ['readiness'],
    queryFn: () => api.get('/readiness', ReadinessSummary),
    enabled: Boolean(me.data),
  });
  const r = server.data ?? local;
  const pct = Math.round(r.overall * 100);
  const stage = GROWTH_STAGES.find((s) => s.id === r.stage)?.label;
  const toRevisit = r.objectives.filter((o) => o.status !== 'mastered');
  const summary = r.ready
    ? 'You are ready. Bring your questions to the lecture and go deeper there.'
    : pct >= 50
      ? 'Nearly there. A little more practice on the objectives below will get you ready.'
      : 'A good start. Work through the objectives below before the lecture.';

  return (
    <div>
      <PageHeader
        title="Ready for lecture?"
        subtitle="What you know about B-trees going into your COS212 lecture."
        actions={
          <Button variant="outline" className="no-print" onClick={() => window.print()}>
            Save as PDF
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="flex flex-wrap items-center gap-6">
            <div>
              <p className="font-display text-leaf text-display-xl">{pct}%</p>
              <p className="font-bold">ready</p>
            </div>
            <div className="min-w-60 flex-1">
              <p className="text-body">{summary}</p>
              <ProgressBar className="mt-3" value={r.overall} label="Overall readiness" />
              <p className="text-label mt-3 flex flex-wrap gap-4 font-bold">
                <span>{stage}</span>
                <span className="flex items-center gap-1">
                  <LeafIcon className="h-4 w-4" />
                  {r.leaves} leaves
                </span>
                <span>
                  {r.modulesDone} of {MODULES.length} modules done
                </span>
                <span className="text-ink-muted">Ready at {READY_THRESHOLD * 100}%</span>
              </p>
            </div>
          </Card>

          <Card>
            <CardTitle>By learning objective</CardTitle>
            <p className="text-ink-muted text-small mb-4">
              Mastery comes from practice and quiz answers on the first try without hints, not from
              time spent.
            </p>
            <ol className="space-y-4">
              {r.objectives.map((o, i) => {
                const meta = OBJECTIVES.find((x) => x.id === o.objective)!;
                return (
                  <li
                    key={o.objective}
                    className="grid grid-cols-[24px_1fr] items-center gap-x-3 gap-y-1 sm:grid-cols-[24px_1fr_160px_48px_110px]"
                  >
                    <span className="font-display">{i + 1}</span>
                    <span>{meta.label}</span>
                    <ProgressBar
                      className="col-start-2 sm:col-start-auto"
                      value={o.score}
                      tone={o.status === 'mastered' ? 'primary' : 'warn'}
                      label={`${meta.label} mastery`}
                    />
                    <span className="text-small col-start-2 font-bold sm:col-start-auto">
                      {Math.round(o.score * 100)}%
                    </span>
                    <span className="col-start-2 sm:col-start-auto">
                      <StatusBadge status={o.status} />
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardTitle>Revisit before the lecture</CardTitle>
            {toRevisit.length === 0 ? (
              <p className="text-small">Everything is mastered. 🎉</p>
            ) : (
              <ul className="text-label space-y-2 font-bold">
                {toRevisit.slice(0, 4).map((o) => (
                  <li key={o.objective}>
                    <Link to={REVISIT[o.objective].to} className="flex gap-2 hover:underline">
                      <LeafIcon className="h-4 w-4 shrink-0" />
                      {REVISIT[o.objective].label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {toRevisit[0] && (
              <ButtonLink
                to={`/lessons/${REVISIT[toRevisit[0].objective].module}`}
                className="no-print mt-4"
              >
                Start module {REVISIT[toRevisit[0].objective].module}
              </ButtonLink>
            )}
          </Card>
          <LectureQuestions />
          {!r.ready && (
            <Card tone="accent" className="text-label flex gap-2 font-bold">
              <LeafIcon className="h-5 w-5 shrink-0" />
              Finish the remaining modules and pass the check to grow your {stage} into a full tree.
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function LectureQuestions() {
  const { lectureQuestions, addLectureQuestion, removeLectureQuestion } = useProgressStore();
  const [text, setText] = useState('');
  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addLectureQuestion(text.trim());
    setText('');
  };
  return (
    <Card>
      <CardTitle>Questions for the lecture</CardTitle>
      <p className="text-ink-muted text-small mb-3">
        Notes you flagged while learning. Bring them to class.
      </p>
      <ul className="space-y-2">
        {lectureQuestions.map((q) => (
          <li key={q.id} className="text-small flex items-start gap-2 rounded-md bg-sky-100 p-3">
            <HelpCircle className="text-leaf mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{q.text}</span>
            <button
              type="button"
              onClick={() => removeLectureQuestion(q.id)}
              aria-label={`Remove question: ${q.text}`}
              className="no-print text-ink-muted"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="no-print mt-3 flex gap-2">
        <label className="sr-only" htmlFor="lecture-q">
          Add a question
        </label>
        <input
          id="lecture-q"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={280}
          placeholder="Add a question…"
          className="border-ink bg-paper min-w-0 flex-1 rounded-lg border-2 px-3 py-2"
        />
        <Button type="submit" variant="outline" size="sm">
          Add
        </Button>
      </form>
    </Card>
  );
}

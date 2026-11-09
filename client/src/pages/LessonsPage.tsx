import { GROWTH_STAGES, MODULES } from '@btree/shared';
import { Link } from 'react-router';
import { GroveTree } from '../components/grove/GroveTree';
import {
  ButtonLink,
  Card,
  CardTitle,
  LeafIcon,
  PageHeader,
  ProgressSegments,
  cn,
} from '../components/ui';
import {
  isRequired,
  moduleStatus,
  useLocalReadiness,
  useProgressStore,
} from '../stores/progressStore';

const OPEN_ANYTIME = [
  { to: '/visualiser', label: 'B-tree visualiser' },
  { to: '/practice', label: 'Practice activities' },
  { to: '/lessons/4', label: 'Glossary and cheat sheet' },
  { to: '/practice/split-it-yourself', label: 'Common mistakes' },
];

/** Screen 03: lessons hub. Students always see where they are and what comes next. */
export function LessonsPage() {
  const s = useProgressStore();
  const r = useLocalReadiness();
  const stage = GROWTH_STAGES.find((g) => g.id === r.stage)!;
  const next = MODULES.find((m) => moduleStatus(m.id, s) === 'current');

  return (
    <div>
      <PageHeader title="Your lessons" subtitle="9 short modules · each one grows your tree" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <ol className="space-y-3">
          {MODULES.map((m) => {
            const status = moduleStatus(m.id, s);
            const optional = !isRequired(m.id, s.needsRecap);
            const part = s.modules[m.id]?.part;
            return (
              <li key={m.id}>
                <Link
                  to={status === 'locked' ? '#' : `/lessons/${m.id}`}
                  aria-disabled={status === 'locked'}
                  onClick={(e) => status === 'locked' && e.preventDefault()}
                  className={cn(
                    'flex items-center gap-4 rounded-xl px-4 py-3 transition-transform',
                    status === 'locked' &&
                      'border-line/60 text-muted cursor-not-allowed border-2 border-dashed',
                    status === 'current' && 'bg-accent text-on-accent shadow-accent',
                    (status === 'done' || status === 'available') &&
                      'bg-surface shadow-offset hover:-translate-y-0.5',
                  )}
                >
                  {status === 'done' ? (
                    <LeafIcon className="h-6 w-6 shrink-0" title="Completed" />
                  ) : (
                    <span
                      className={cn(
                        'font-display grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm',
                        status === 'current'
                          ? 'bg-surface text-ink border-transparent'
                          : 'border-current',
                      )}
                    >
                      {m.id}
                    </span>
                  )}
                  <span className="flex-1">
                    <span className="font-display block">
                      {m.id} · {m.title}
                    </span>
                    <span className="block text-xs">
                      {status === 'current' && part ? `Part ${part} · ` : ''}
                      {m.format} · {m.minutes} min{optional ? ' · optional' : ''}
                    </span>
                  </span>
                  <span className="text-xs font-bold">
                    {status === 'locked' ? (
                      'Locked'
                    ) : status === 'current' ? (
                      <span className="bg-primary font-display text-on-primary shadow-button rounded-lg px-4 py-2">
                        Continue
                      </span>
                    ) : (
                      '+30 leaves'
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <aside className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-16">
                <GroveTree stage={r.stage} />
              </div>
              <div>
                <CardTitle className="mb-0">{stage.label}</CardTitle>
                <p className="font-bold">{Math.round(r.overall * 100)}% ready for lecture</p>
              </div>
            </div>
            <ProgressSegments
              className="mt-3"
              total={6}
              done={GROWTH_STAGES.indexOf(stage)}
              current={GROWTH_STAGES.indexOf(stage)}
              label="Growth stage"
            />
            <p className="text-muted mt-2 text-xs">{r.modulesDone} of 9 modules mastered</p>
          </Card>
          {next && (
            <Card tone="accent">
              <CardTitle>Up next</CardTitle>
              <p className="text-sm">
                Module {next.id}: {next.title}.
              </p>
              <ButtonLink to={`/lessons/${next.id}`} className="mt-3">
                Continue module {next.id}
              </ButtonLink>
            </Card>
          )}
          <Card>
            <CardTitle>Open anytime</CardTitle>
            <ul className="space-y-3">
              {OPEN_ANYTIME.map((o) => (
                <li key={o.to}>
                  <Link to={o.to} className="flex items-center gap-3 font-bold hover:underline">
                    <LeafIcon className="h-4 w-4" />
                    {o.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

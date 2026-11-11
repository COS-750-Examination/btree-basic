import { DECORATIONS, GROWTH_STAGES, MODULES } from '@btree/shared';
import { Link, useParams } from 'react-router';
import { useCheers, useFriendGrove, useMe, useSendCheer } from '../api/hooks';
import { DecoIcon } from '../components/grove/DecoIcon';
import { GroveTree } from '../components/grove/GroveTree';
import { SceneBackdrop } from '../components/grove/SceneBackdrop';
import {
  Avatar,
  Breadcrumbs,
  Button,
  ButtonLink,
  Card,
  CardTitle,
  LeafIcon,
  Tag,
  cn,
} from '../components/ui';

const dateFmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' });

/** Screen 10: visit a friend's grove. Visit-only: no rankings, and scores stay private. */
export function FriendGrovePage() {
  const { friendId } = useParams();
  const me = useMe();
  const grove = useFriendGrove(friendId, Boolean(me.data));
  const cheers = useCheers(Boolean(me.data));
  const sendCheer = useSendCheer(friendId ?? '');

  if (!me.isLoading && !me.data) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p>Sign in to visit friends&apos; groves.</p>
        <ButtonLink to="/login" className="mt-4">
          Sign in
        </ButtonLink>
      </Card>
    );
  }
  if (grove.isLoading || !grove.data) {
    return <p role="status">{grove.isError ? 'Could not load this grove.' : 'Loading grove…'}</p>;
  }

  const f = grove.data;
  const stage = GROWTH_STAGES.find((s) => s.id === f.stage)?.label ?? '';
  const first = f.displayName.split(' ')[0];
  const theirCheers = (cheers.data ?? [])
    .filter((c) => c.toName === f.displayName || c.fromName === f.displayName)
    .slice(0, 5);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'My grove', to: '/grove' },
          { label: 'Friends', to: '/grove' },
          { label: f.displayName },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={f.displayName} size="lg" className="text-on-highlight bg-[var(--blossom)]" />
        <div className="flex-1">
          <h1 className="text-display-l">{first}&apos;s grove</h1>
          <p className="text-ink-muted">
            {stage}
            {f.currentModule ? ` · working on Module ${f.currentModule}` : ''} · friends since{' '}
            {dateFmt.format(new Date(f.since))}
          </p>
        </div>
        <ButtonLink to="/grove" variant="outline">
          ← My grove
        </ButtonLink>
        <Button
          onClick={() => sendCheer.mutate(f.currentModule ?? undefined)}
          disabled={sendCheer.isPending}
        >
          {sendCheer.isSuccess ? 'Cheer sent!' : 'Send a cheer'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <SceneBackdrop
            className="aspect-[832/480]"
            art={
              <>
                <GroveTree stage={f.stage} decorations={f.decorations} />
                <Tag tone="surface" className="absolute top-[87.5%] left-[3%]">
                  Planted {dateFmt.format(new Date(f.plantedAt))}
                </Tag>
              </>
            }
          />
          <Card>
            <div className="mb-3 flex justify-between">
              <CardTitle className="mb-0">Course progress</CardTitle>
              <span className="font-bold">{f.modulesDone} of 9 modules</span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {MODULES.map((m) => {
                const done = f.completedModules.includes(m.id);
                return (
                  <li
                    key={m.id}
                    className={cn(
                      'text-small flex items-center gap-2 rounded-md px-2 py-1',
                      m.id === f.currentModule && 'bg-sky-100 font-bold',
                      !done && 'text-ink-muted',
                    )}
                  >
                    {done ? (
                      <LeafIcon className="h-4 w-4" />
                    ) : (
                      <span className="rounded-pill h-4 w-4 border-2 border-current" aria-hidden />
                    )}
                    {m.id} · {m.title}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="grid grid-cols-3 text-center">
            {[
              [`${f.modulesDone}/9`, 'modules'],
              [f.streakDays, 'day streak'],
              [f.decorations.length, 'decorations'],
            ].map(([n, l]) => (
              <div key={String(l)}>
                <p className="font-display text-leaf text-heading">{n}</p>
                <p className="text-ink-muted text-small">{l}</p>
              </div>
            ))}
          </Card>
          <Card>
            <CardTitle>In {first}&apos;s tree</CardTitle>
            {f.decorations.length ? (
              <ul className="flex flex-wrap gap-2">
                {DECORATIONS.filter((d) => f.decorations.includes(d.id)).map((d) => (
                  <li
                    key={d.id}
                    className="rounded-pill text-small flex items-center gap-1.5 bg-sky-100 py-1 pr-3 pl-1.5 font-bold"
                  >
                    <DecoIcon id={d.id} className="h-5 w-5" />
                    {d.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted text-small">No decorations yet.</p>
            )}
            <p className="text-ink-muted text-small mt-3">
              Like what you see? The same items are in your{' '}
              <Link to="/grove" className="underline">
                craft drawer
              </Link>
              .
            </p>
          </Card>
          <Card>
            <CardTitle>Cheers</CardTitle>
            {theirCheers.length ? (
              <ul className="text-small space-y-2">
                {theirCheers.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <Avatar name={c.fromName} />
                    {c.fromName === f.displayName ? `${first} cheered you` : 'You sent a cheer'}
                    {c.moduleId ? ` on Module ${c.moduleId}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted text-small">No cheers yet. Be the first!</p>
            )}
          </Card>
          <Card tone="accent" className="text-small flex gap-2 font-bold">
            <LeafIcon className="h-4 w-4 shrink-0" />
            You can see {first}&apos;s tree and finished modules. Quiz answers, scores and hints
            stay private.
          </Card>
        </aside>
      </div>
    </div>
  );
}

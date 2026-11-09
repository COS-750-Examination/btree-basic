import { DECORATIONS, GROWTH_STAGES, LEAF_REWARDS } from '@btree/shared';
import { toPng } from 'html-to-image';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useFriends, useMe } from '../api/hooks';
import { GroveTree } from '../components/grove/GroveTree';
import { GrowthStrip } from '../components/grove/GrowthStrip';
import { SceneBackdrop } from '../components/grove/SceneBackdrop';
import {
  Avatar,
  Button,
  ButtonLink,
  Card,
  CardTitle,
  LeafIcon,
  PageHeader,
  ProgressBar,
  Tag,
} from '../components/ui';
import { useLocalReadiness, useProgressStore } from '../stores/progressStore';

const EARN = [
  ['Finish a lesson', LEAF_REWARDS.lesson],
  ['Right on the first try', LEAF_REWARDS.firstTry],
  ['Got there with a hint', LEAF_REWARDS.withHint],
  ['3-day practice streak', LEAF_REWARDS.streak],
  ['Ready-for-lecture check', LEAF_REWARDS.readyCheck],
] as const;

/** Screen 09: the student's grove. Growth comes from mastery; leaves buy decorations. */
export function GrovePage() {
  const r = useLocalReadiness();
  const { ownedDecorations, buyDecoration, leaves } = useProgressStore();
  const me = useMe();
  const friends = useFriends(Boolean(me.data));
  const sceneRef = useRef<HTMLDivElement>(null);
  const [decorating, setDecorating] = useState(false);
  const stage = GROWTH_STAGES.find((s) => s.id === r.stage)!;
  const nextStage = GROWTH_STAGES[GROWTH_STAGES.indexOf(stage) + 1];

  const snap = async () => {
    if (!sceneRef.current) return;
    const url = await toPng(sceneRef.current, { pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-b-tree-grove.png';
    a.click();
  };

  return (
    <div>
      <PageHeader
        tag="My grove"
        title={`Your tree is a ${stage.label.toLowerCase()}!`}
        subtitle="Each module you master adds a new layer. Leaves buy the decorations."
        actions={
          <>
            <Button variant="outline" onClick={() => void snap()}>
              Snap a photo
            </Button>
            <Button onClick={() => setDecorating((d) => !d)} aria-expanded={decorating}>
              Decorate
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div ref={sceneRef}>
            <SceneBackdrop className="min-h-80">
              <div className="px-6 pt-8 pb-4">
                <GroveTree stage={r.stage} decorations={ownedDecorations} />
              </div>
            </SceneBackdrop>
          </div>

          {decorating && (
            <Card>
              <CardTitle>Craft drawer</CardTitle>
              <p className="text-muted mb-3 text-sm">You have {leaves} leaves.</p>
              <ul className="grid gap-3 sm:grid-cols-3">
                {DECORATIONS.map((d) => {
                  const owned = ownedDecorations.includes(d.id);
                  return (
                    <li
                      key={d.id}
                      className="bg-sunken flex items-center justify-between rounded-xl p-3 text-sm font-bold"
                    >
                      {d.name}
                      <Button
                        size="sm"
                        variant={owned ? 'ghost' : 'accent'}
                        disabled={owned || leaves < d.cost}
                        onClick={() => buyDecoration(d.id, d.cost)}
                      >
                        {owned ? (
                          'Owned'
                        ) : (
                          <>
                            <LeafIcon className="h-3.5 w-3.5" />
                            {d.cost}
                          </>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <CardTitle className="mb-0">How it grows</CardTitle>
              {nextStage && <Tag>Next layer after module {nextStage.minModules}</Tag>}
            </div>
            <GrowthStrip stage={r.stage} />
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <p className="flex items-baseline gap-2">
              <LeafIcon className="h-6 w-6 self-center" />
              <span className="font-display text-3xl">{leaves}</span> leaves
            </p>
            <p className="mt-3 text-xs font-bold">How you earn them</p>
            <dl className="mt-1 space-y-1.5 text-sm">
              {EARN.map(([label, n]) => (
                <div key={label} className="flex justify-between">
                  <dt>{label}</dt>
                  <dd className="font-display text-primary">+{n}</dd>
                </div>
              ))}
            </dl>
            <p className="text-muted mt-2 text-xs">Hints are free, and nothing ever wilts.</p>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <CardTitle className="mb-0">Friends&apos; groves</CardTitle>
              {me.data && (
                <Link
                  to="/account#friends"
                  className="bg-surface shadow-offset-sm rounded-md px-2 py-1 text-xs font-bold"
                >
                  + Add a friend
                </Link>
              )}
            </div>
            {!me.data ? (
              <p className="text-sm">
                <Link to="/login" className="font-bold underline">
                  Sign in
                </Link>{' '}
                to visit friends&apos; groves. Guests&apos; progress stays on this device.
              </p>
            ) : friends.data?.friends.length ? (
              <ul className="space-y-3">
                {friends.data.friends.map((f) => (
                  <li key={f.id} className="flex items-center gap-3">
                    <Avatar name={f.displayName} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold">{f.displayName}</span>
                        <span className="text-muted text-xs">
                          {GROWTH_STAGES.find((s) => s.id === f.stage)?.label} · {f.modulesDone}/9
                        </span>
                      </div>
                      <ProgressBar value={f.modulesDone / 9} label={`${f.displayName}'s modules`} />
                    </div>
                    <Link to={`/grove/${f.id}`} className="text-sm font-bold hover:underline">
                      Visit →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">No friends yet. Add one by email.</p>
            )}
            <p className="text-muted mt-3 text-xs">
              Friends can see your tree and which modules you&apos;ve finished. Quiz answers, scores
              and hints stay private.
            </p>
          </Card>
          {!me.data && (
            <ButtonLink to="/register" variant="outline" className="w-full">
              Create an account to save your grove
            </ButtonLink>
          )}
        </aside>
      </div>
    </div>
  );
}

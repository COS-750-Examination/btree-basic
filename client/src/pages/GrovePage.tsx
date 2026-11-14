import { DECORATIONS, GROWTH_STAGES, LEAF_REWARDS, MODULES, reachedStage } from '@btree/shared';
import { toPng } from 'html-to-image';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useFriends, useMe } from '../api/hooks';
import { DecoIcon } from '../components/grove/DecoIcon';
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
  cn,
} from '../components/ui';
import { placedDecorations, useLocalReadiness, useProgressStore } from '../stores/progressStore';

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
  const progress = useProgressStore();
  const { ownedDecorations, hiddenDecorations, buyDecoration, toggleDecoration, leaves } = progress;
  const onTree = placedDecorations(progress);
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
            <SceneBackdrop
              className="aspect-[832/480]"
              art={<GroveTree stage={r.stage} decorations={onTree} showSpots />}
            />
          </div>

          {decorating && (
            <Card>
              <CardTitle>Craft drawer</CardTitle>
              <p className="text-ink-muted text-small mb-3">
                You have {leaves} leaves. Decorations you buy go straight onto your tree. Take them
                off or put them back whenever you like.
              </p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {DECORATIONS.map((d) => {
                  const owned = ownedDecorations.includes(d.id);
                  const hidden = hiddenDecorations.includes(d.id);
                  const unlocked = reachedStage(r.stage, d.minStage);
                  return (
                    <li
                      key={d.id}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg px-2 pt-3 pb-3 text-center',
                        unlocked
                          ? 'bg-paper shadow-paper-stack-sm'
                          : 'border-ink-muted text-ink-muted border-2 border-dashed',
                      )}
                    >
                      <DecoIcon id={d.id} />
                      <span className="text-label font-bold">{d.name}</span>
                      {!unlocked ? (
                        <span className="text-small">
                          {GROWTH_STAGES.find((s) => s.id === d.minStage)?.label}
                        </span>
                      ) : owned ? (
                        <>
                          <span className="text-small text-ink-muted">
                            {hidden ? 'in your drawer' : 'in your tree'}
                          </span>
                          <Button
                            size="sm"
                            variant={hidden ? 'primary' : 'outline'}
                            onClick={() => toggleDecoration(d.id)}
                            aria-label={
                              hidden ? `Add ${d.name} to your tree` : `Take ${d.name} off your tree`
                            }
                          >
                            {hidden ? 'Add to tree' : 'Take off'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          disabled={leaves < d.cost}
                          onClick={() => buyDecoration(d.id, d.cost)}
                          aria-label={`Buy ${d.name} for ${d.cost} leaves`}
                        >
                          <LeafIcon className="h-3.5 w-3.5" color="currentColor" />
                          {d.cost}
                        </Button>
                      )}
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
              <span className="font-display text-display-l">{leaves}</span> leaves
            </p>
            <p className="text-small mt-3 font-bold">How you earn them</p>
            <dl className="text-small mt-1 space-y-1.5">
              {EARN.map(([label, n]) => (
                <div key={label} className="flex justify-between">
                  <dt>{label}</dt>
                  <dd className="font-display text-leaf">+{n}</dd>
                </div>
              ))}
            </dl>
            <p className="text-ink-muted text-small mt-2">
              Hints are free, and nothing ever wilts.
            </p>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <CardTitle className="mb-0">Friends&apos; groves</CardTitle>
              {me.data && (
                <Link
                  to="/account#friends"
                  className="bg-paper shadow-paper-stack-sm text-small rounded-sm px-2 py-1 font-bold"
                >
                  + Add a friend
                </Link>
              )}
            </div>
            {!me.data ? (
              <p className="text-small">
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
                      <div className="text-small flex justify-between">
                        <span className="font-bold">{f.displayName}</span>
                        <span className="text-ink-muted text-small">
                          {GROWTH_STAGES.find((s) => s.id === f.stage)?.label} · {f.modulesDone}/
                          {MODULES.length}
                        </span>
                      </div>
                      <ProgressBar
                        value={f.modulesDone / MODULES.length}
                        label={`${f.displayName}'s modules`}
                      />
                    </div>
                    <Link to={`/grove/${f.id}`} className="text-label font-bold hover:underline">
                      Visit →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted text-small">No friends yet. Add one by email.</p>
            )}
            <p className="text-ink-muted text-small mt-3">
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

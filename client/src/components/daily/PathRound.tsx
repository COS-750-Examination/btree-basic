import { DAILY_PATH_SEARCHES, pathRound, type BTreeNode } from '@btree/engine';
import type { DailyState } from '@btree/shared';
import { useMemo, useRef, useState } from 'react';
import { branchReason, nodeLabel } from '../../lib/dailyHints';
import { BEAD_R, layoutTree, viewFrame } from '../../lib/layout';
import { BTreeView } from '../tree/BTreeView';
import { Card } from '../ui';
import { FeedbackBox, PromptBar, RoundHeader, RoundStrip, SubmitState } from './RoundChrome';
import { dayTotalSoFar } from '../../lib/dailyFormat';
import { buzz, useRoundPlay, useRoundSubmit } from './useRoundPlay';

const NODE_H = BEAD_R * 2 + 12;
const SEARCH_PAUSE_MS = 1000;

export function PathRound({ state }: { state: DailyState }) {
  const { keys, seed } = state.content.path!;
  const { tree, searches, moves } = useMemo(() => pathRound(keys, seed), [keys, seed]);
  const round = useRoundPlay(state.day, 1, moves, true);
  const [ended, setEnded] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const ready = round.complete && ended === null;
  const { submit, failed } = useRoundSubmit(
    state.day,
    1,
    round.plays,
    ready,
    `daily-${state.day}-path`,
  );

  const nodes = useMemo(() => {
    const map = new Map<string, BTreeNode>();
    const walk = (n: BTreeNode) => {
      map.set(n.id, n);
      n.children.forEach(walk);
    };
    walk(tree.root!);
    return map;
  }, [tree]);

  const move = moves[round.index]!;
  const searchIndex = ended ?? move.searchIndex;
  const search = searches[searchIndex]!;
  const finished = ended !== null || round.complete;
  const at = finished ? search.path.at(-1)! : move.at;
  const visited = search.path.slice(0, search.path.indexOf(at) + 1);
  const current = nodes.get(at)!;
  const choices = finished ? [] : current.children;

  const layout = useMemo(() => layoutTree(tree), [tree]);
  const frame = viewFrame(layout, true, true);
  const byId = new Map(layout.nodes.map((p) => [p.node.id, p]));

  const choose = (child: BTreeNode) => {
    const reason = branchReason(current, move.target);
    const outcome = round.attempt(child.id);
    if (outcome === 'repeat' || outcome === 'done') {
      if (outcome === 'repeat') {
        round.setMessage({
          tone: 'wrong',
          text: `You already tried that. ${reason}.`,
          retry: true,
        });
      }
      return;
    }
    if (outcome === 'wrong') {
      buzz();
      round.setMessage({ tone: 'wrong', text: `${reason}.`, retry: true });
      return;
    }
    const lastStep =
      !moves[round.index + 1] || moves[round.index + 1]!.searchIndex !== move.searchIndex;
    if (!lastStep) {
      round.setMessage({ tone: 'right', text: `Yes. ${reason}.` });
      return;
    }
    round.setMessage({
      tone: 'right',
      text: search.present
        ? `Found ${move.target}!`
        : `${move.target} isn't in the tree. This leaf is where it would be.`,
    });
    setEnded(move.searchIndex);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setEnded(null);
      round.setMessage(null);
    }, SEARCH_PAUSE_MS);
  };

  const yarnEdges = visited.slice(1).map((id, i) => `${visited[i]}>${id}`);
  const callout = finished
    ? search.present
      ? `Found ${search.target}!`
      : 'It would go here'
    : 'You are here';

  return (
    <>
      <RoundStrip state={state} current={1} />
      <Card className="mt-4">
        <RoundHeader
          round={1}
          startedAt={state.rounds[0]!.startedAt!}
          penaltyMs={round.penaltyMs}
          total={dayTotalSoFar(state)}
        />
        {ready ? (
          <SubmitState failed={failed} onRetry={submit} />
        ) : (
          <>
            <PromptBar
              title={`Find ${search.target}`}
              detail={`Search ${searchIndex + 1} of ${DAILY_PATH_SEARCHES} · tap one branch at a time`}
            />
            <div className="relative rounded-lg bg-sky-200">
              <BTreeView
                tree={tree}
                scene
                className="block"
                label={`Tree to search. You are at the ${nodeLabel(current.keys).toLowerCase()}.`}
                yarnEdges={yarnEdges}
                highlightNodeIds={visited}
                foundKey={finished && search.present ? search.target : undefined}
                callouts={[{ nodeId: at, text: callout }]}
              />
              <div className="absolute inset-0">
                {choices.map((child) => {
                  const p = byId.get(child.id)!;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      aria-label={nodeLabel(child.keys)}
                      onClick={() => choose(child)}
                      style={{
                        left: `${((frame.offsetX + p.x) / frame.width) * 100}%`,
                        top: `${((frame.offsetY + p.y) / frame.height) * 100}%`,
                        width: `max(44px, ${(p.width / frame.width) * 100}%)`,
                        height: `max(44px, ${(NODE_H / frame.height) * 100}%)`,
                      }}
                      className="hover:ring-yarn/60 focus-visible:ring-yarn absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none hover:ring-4 focus-visible:ring-4"
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
        <FeedbackBox
          message={round.message}
          shake={round.shakes}
          idle="Tap the branch the search follows. A wrong branch adds 10s and you try again."
        />
      </Card>
    </>
  );
}

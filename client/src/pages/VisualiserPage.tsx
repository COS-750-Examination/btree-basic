import { MAX_ORDER, MIN_ORDER, maxKeys, type Operation } from '@btree/engine';
import { Shuffle } from 'lucide-react';
import { useCallback, useState, type FormEvent } from 'react';
import { BSTView } from '../components/tree/BSTView';
import { bstFromKeys } from '../lib/bst';
import { BTreeView } from '../components/tree/BTreeView';
import { NarrationBar } from '../components/visualiser/NarrationBar';
import { PlaybackControls } from '../components/visualiser/PlaybackControls';
import { PseudocodePanel } from '../components/visualiser/PseudocodePanel';
import { StepsPanel } from '../components/visualiser/StepsPanel';
import { usePlayback } from '../components/visualiser/usePlayback';
import { Button, Card, PageHeader } from '../components/ui';
import { presets } from '../lib/content';
import { narrate } from '../lib/narration';
import { stepView } from '../lib/stepView';
import { useVisualiserStore } from '../stores/visualiserStore';

const field = 'rounded-xl border-2 border-line bg-surface px-3 py-2.5 font-bold';

/** Screen 05: free sandbox. Insert, search or delete any key on any order from 3 to 7 (FR2–FR5). */
export function VisualiserPage() {
  const v = useVisualiserStore();
  const [keyInput, setKeyInput] = useState(String(presets[0]!.key));
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState(false);

  const next = useCallback(() => useVisualiserStore.getState().next(), []);
  usePlayback(v.playing, v.speed, next);

  const run = (op: Operation) => (e?: FormEvent) => {
    e?.preventDefault();
    const key = Number(keyInput);
    if (!Number.isInteger(key) || key < 1 || key > 999) {
      setError('Enter a whole number from 1 to 999.');
      return;
    }
    setError(null);
    v.run(op, key);
  };

  const trace = v.trace;
  const step = trace?.steps[v.index];
  const view = trace ? stepView(trace, v.index) : { tree: v.tree };
  const narration = step
    ? narrate(step)
    : 'Pick a key and press Insert, Search or Delete to watch the algorithm step by step.';
  const opLabel = trace
    ? `${trace.operation === 'insert' ? 'Inserting' : trace.operation === 'search' ? 'Searching for' : 'Deleting'} ${trace.key}`
    : 'Ready';
  const bst = v.showBst ? bstFromKeys(v.history) : null;

  return (
    <div>
      <PageHeader
        tag="Module 6 · Inserting and splitting"
        title="B-tree visualiser"
        actions={
          <p className="text-muted text-sm">Follow the golden yarn to see where each key goes.</p>
        }
      />

      <Card className="mb-6">
        <form onSubmit={run('insert')} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-xs font-bold">
            Key
            <input
              inputMode="numeric"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className={`${field} mt-1 w-24`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'key-error' : undefined}
            />
          </label>
          <Button type="submit">Insert</Button>
          <Button variant="outline" onClick={run('search')}>
            Search
          </Button>
          <Button variant="outline" onClick={run('delete')}>
            Delete
          </Button>
          <label className="flex flex-col text-xs font-bold">
            Example
            <select
              value={v.presetId}
              onChange={(e) => {
                v.loadPreset(e.target.value);
                const p = presets.find((x) => x.id === e.target.value);
                if (p) setKeyInput(String(p.key));
              }}
              className={`${field} mt-1`}
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
              {v.presetId === 'random' && <option value="random">Random tree</option>}
            </select>
          </label>
          <label className="flex flex-col text-xs font-bold">
            Order
            <select
              value={v.order}
              onChange={(e) => v.setOrder(Number(e.target.value))}
              className={`${field} mt-1`}
            >
              {Array.from({ length: MAX_ORDER - MIN_ORDER + 1 }, (_, i) => MIN_ORDER + i).map(
                (m) => (
                  <option key={m} value={m}>
                    {m} · {maxKeys(m)} keys per branch
                  </option>
                ),
              )}
            </select>
          </label>
          <Button variant="ghost" onClick={() => v.randomise()} aria-label="Random tree">
            <Shuffle className="h-4 w-4" />
          </Button>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={v.showBst}
              onChange={(e) => v.setShowBst(e.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
            />
            Cut out a BST too
          </label>
          {error && (
            <p id="key-error" role="alert" className="text-danger-text w-full text-sm font-bold">
              {error}
            </p>
          )}
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="bg-sky shadow-offset rounded-xl p-4">
            <div className="flex justify-between text-sm font-bold">
              <span>{opLabel}</span>
              {trace && (
                <span className="text-muted">
                  Step {v.index + 1} of {trace.steps.length}
                </span>
              )}
            </div>
            <BTreeView {...view} scene label={`${opLabel}. ${narration}`} />
          </div>
          {bst && (
            <Card>
              <p className="mb-2 text-sm font-bold">
                The same keys in a plain binary search tree (insertion order):
              </p>
              <BSTView spec={bst} label="Binary search tree built from the same keys" />
            </Card>
          )}
          <NarrationBar text={narration} voice={voice} onVoice={setVoice} />
          <PlaybackControls
            playing={v.playing}
            canPrev={Boolean(trace) && v.index > 0}
            canNext={Boolean(trace) && v.index < (trace?.steps.length ?? 1) - 1}
            speed={v.speed}
            onRestart={v.restart}
            onPrev={v.prev}
            onTogglePlay={() => v.setPlaying(!v.playing)}
            onNext={v.next}
            onSpeed={v.setSpeed}
          />
        </div>
        <div className="space-y-4">
          <PseudocodePanel
            operation={trace?.operation ?? 'insert'}
            line={step?.line ?? null}
            language={v.language}
            onLanguage={v.setLanguage}
            note={step?.kind === 'overflow' ? `Now: mid = ${step.keys[0]}` : undefined}
          />
          <StepsPanel steps={trace?.steps ?? []} index={v.index} keyValue={trace?.key ?? 0} />
        </div>
      </div>
    </div>
  );
}

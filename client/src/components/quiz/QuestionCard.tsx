import { fromSpec, insert, isLeaf, type BTreeNode } from '@btree/engine';
import type { Confidence, QuizItem } from '@btree/shared';
import { useMemo, useState } from 'react';
import { BSTView } from '../tree/BSTView';
import { BTreeView } from '../tree/BTreeView';
import { Button, ConfidencePicker, cn } from '../ui';
import { mark, type Answer } from './mark';
import { RULE_LABELS } from './rules';
import { shuffledOptions } from './shuffle';

export type { Answer } from './mark';

/** Renders one question. The parent owns attempts, hints and recording. */
export function QuestionCard({
  item,
  answer,
  onSubmit,
  onConfidence,
  confidence,
  locked,
}: {
  item: QuizItem;
  answer: Answer | null;
  onSubmit: (choice: string, result: Answer) => void;
  onConfidence?: (c: Confidence) => void;
  confidence?: Confidence;
  locked: boolean;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [rule, setRule] = useState<string>('');
  const [path, setPath] = useState<BTreeNode[]>([]);
  const options = useMemo(
    () => ('options' in item ? shuffledOptions(item.id, item.options) : []),
    [item],
  );
  const tree = useMemo(
    () => (item.tree && item.order ? fromSpec(item.order, item.tree) : null),
    [item],
  );

  // For pick-median: show the leaf after the key goes in (it overflows).
  const overflowKeys = useMemo(() => {
    if (item.type !== 'pick-median' || !tree) return [];
    const t = insert(tree, item.insertKey).steps.find((s) => s.kind === 'overflow');
    if (!t) return [];
    const find = (n: NonNullable<typeof t.tree.root>): number[] | null =>
      n.id === t.nodeIds[0]
        ? n.keys
        : isLeaf(n)
          ? null
          : (n.children.map(find).find(Boolean) ?? null);
    return t.tree.root ? (find(t.tree.root) ?? []) : [];
  }, [item, tree]);

  const submit = (c: string) => onSubmit(c, mark(item, c));

  const optionButton = (id: string, text: string) => {
    const picked = choice === id;
    const wrong = picked && answer && !answer.correct;
    const right = picked && answer?.correct;
    return (
      <button
        key={id}
        type="button"
        disabled={locked}
        aria-pressed={picked}
        onClick={() => {
          setChoice(id);
          submit(id);
        }}
        className={cn(
          'bg-paper shadow-paper-stack w-full rounded-lg px-4 py-3 text-left font-bold transition-transform hover:-translate-y-0.5 disabled:hover:translate-y-0',
          wrong && 'border-danger border-2',
          right && 'border-leaf border-2',
        )}
      >
        {text}
        {picked && answer && (
          <span
            role="status"
            className={cn(
              'text-small mt-1 block',
              answer.correct ? 'text-leaf' : 'text-danger-text',
            )}
          >
            {answer.feedback}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-heading sm:text-heading">{item.prompt}</h2>

      {item.type === 'bst-mcq' && item.tree && (
        <BSTView spec={item.tree} label="Binary search tree for this question" />
      )}
      {item.type !== 'bst-mcq' && tree && (
        <div className="rounded-lg bg-sky-200">
          <BTreeView
            tree={tree}
            scene
            label={`B-tree of order ${item.order} for this question`}
            newKey={item.type === 'pick-median' ? item.insertKey : undefined}
            onNodeClick={
              item.type === 'trace-path'
                ? (n) => !locked && setPath((p) => (p.some((x) => x.id === n.id) ? p : [...p, n]))
                : undefined
            }
            selectedNodeIds={path.map((n) => n.id)}
          />
        </div>
      )}

      {'options' in item && (
        <div className={cn('grid gap-3', item.type === 'bst-mcq' && 'sm:grid-cols-2')}>
          {options.map((o, i) =>
            optionButton(
              o.id,
              item.type === 'bst-mcq' ? `${String.fromCharCode(65 + i)}. ${o.text}` : o.text,
            ),
          )}
        </div>
      )}

      {item.type === 'pick-median' && (
        <div>
          <p className="text-label mb-2 font-bold">
            After {item.insertKey} goes in, the branch holds these keys. Tap the one that moves up:
          </p>
          <div
            className="bg-danger rounded-pill inline-flex gap-2 p-2"
            role="group"
            aria-label="Overflowing branch"
          >
            {overflowKeys.map((k) => (
              <button
                key={k}
                type="button"
                disabled={locked}
                aria-pressed={choice === String(k)}
                onClick={() => {
                  setChoice(String(k));
                  submit(String(k));
                }}
                className={cn(
                  'font-display rounded-pill grid h-12 w-12 place-items-center border-4',
                  choice === String(k)
                    ? 'border-yarn bg-highlight text-on-highlight'
                    : 'border-branch bg-node-fill',
                )}
              >
                {k}
              </button>
            ))}
          </div>
          {answer && choice && (
            <p
              role="status"
              className={cn(
                'text-label mt-2 font-bold',
                answer.correct ? 'text-leaf' : 'text-danger-text',
              )}
            >
              {answer.feedback}
            </p>
          )}
        </div>
      )}

      {item.type === 'trace-path' && (
        <div>
          <p className="text-label font-bold">
            Your path: {path.length ? path.map((n) => n.keys.join(', ')).join(' → ') : 'none yet'}
          </p>
          <div className="mt-2 flex gap-3">
            <Button variant="outline" onClick={() => setPath([])} disabled={locked || !path.length}>
              Clear
            </Button>
            <Button
              onClick={() => submit(path.map((n) => n.keys.join(',')).join('|'))}
              disabled={locked || !path.length}
            >
              Check
            </Button>
          </div>
          {answer && (
            <p
              role="status"
              className={cn(
                'text-label mt-2 font-bold',
                answer.correct ? 'text-leaf' : 'text-danger-text',
              )}
            >
              {answer.feedback}
            </p>
          )}
        </div>
      )}

      {item.type === 'valid-or-not' && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (choice) submit(`${choice}:${rule}`);
          }}
        >
          <fieldset className="flex gap-2">
            <legend className="sr-only">Is it valid?</legend>
            {(['valid', 'invalid'] as const).map((v) => (
              <label
                key={v}
                className={cn(
                  'shadow-paper-stack-sm cursor-pointer rounded-md px-4 py-2 font-bold',
                  choice === v ? 'bg-highlight text-on-highlight' : 'bg-paper',
                )}
              >
                <input
                  type="radio"
                  name={`valid-${item.id}`}
                  className="sr-only"
                  checked={choice === v}
                  onChange={() => setChoice(v)}
                />
                {v === 'valid' ? 'Valid B-tree' : 'Not valid'}
              </label>
            ))}
          </fieldset>
          {choice === 'invalid' && (
            <label className="text-label flex flex-col font-bold">
              Which rule is broken?
              <select
                value={rule}
                onChange={(e) => setRule(e.target.value)}
                className="border-ink bg-paper mt-1 rounded-md border-2 px-3 py-2"
              >
                <option value="">Choose a rule…</option>
                {Object.entries(RULE_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button type="submit" disabled={locked || !choice}>
            Check
          </Button>
          {answer && (
            <p
              role="status"
              className={cn(
                'text-label w-full font-bold',
                answer.correct ? 'text-leaf' : 'text-danger-text',
              )}
            >
              {answer.feedback}
            </p>
          )}
        </form>
      )}

      {onConfidence && <ConfidencePicker value={confidence} onChange={onConfidence} />}
    </div>
  );
}

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { DAILY_NEXT, type BTreeNode, type DailyMove } from '@btree/engine';
import { useMemo, useState } from 'react';
import { BEAD_R, beadOffset, layoutTree, viewFrame, type PositionedNode } from '../../lib/layout';
import { BTreeView } from '../tree/BTreeView';
import { Button, cn } from '../ui';

const NEW_ROOT = 'new-root';
const TRAY = 'tray';
const NODE_H = BEAD_R * 2 + 12;

type Selection = { type: 'tray' } | { type: 'key'; key: number } | null;

const pct = (n: number, of: number) => `${(n / of) * 100}%`;

function Bead({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        'bg-node-fill border-yarn font-display rounded-pill shadow-lift grid h-11 w-11 place-items-center border-4',
        className,
      )}
    >
      {value}
    </span>
  );
}

function NextNumber({
  value,
  selected,
  onTap,
}: {
  value: number;
  selected: boolean;
  onTap: () => void;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: TRAY });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={onTap}
      aria-label={`Next number, ${value}`}
      aria-pressed={selected}
      className={cn(
        'focus-visible:ring-yarn touch-none rounded-full outline-none focus-visible:ring-4',
        selected && 'ring-yarn ring-4',
        isDragging && 'opacity-30',
      )}
    >
      <Bead value={value} className="cursor-grab" />
    </button>
  );
}

function NumberRow({
  keys,
  next,
  selected,
  onTapNext,
}: {
  keys: number[];
  next: number;
  selected: boolean;
  onTapNext: () => void;
}) {
  return (
    <ol aria-label="Numbers to insert, in order" className="flex flex-wrap justify-center gap-2">
      {keys.map((k, i) => (
        <li key={k} className="grid h-11 w-11 place-items-center">
          {i < next ? (
            <span
              aria-label={`${k}, used`}
              className="border-ink/30 rounded-pill block h-10 w-10 border-2 border-dashed"
            />
          ) : i === next ? (
            <NextNumber value={k} selected={selected} onTap={onTapNext} />
          ) : (
            <span className="bg-node-fill border-branch font-display rounded-pill text-ink-muted grid h-10 w-10 place-items-center border-4">
              {k}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function SkyAboveRoot() {
  const { setNodeRef, isOver } = useDroppable({ id: NEW_ROOT });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'text-ink-muted text-small grid h-14 place-items-center rounded-t-lg font-bold',
        isOver && 'bg-highlight/40',
      )}
    >
      {isOver ? 'New root' : null}
    </div>
  );
}

interface Frame {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

function NodeZone({ p, frame, onTap }: { p: PositionedNode; frame: Frame; onTap: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: p.node.id });
  const label = `Node with keys ${p.node.keys.join(', ')}`;
  return (
    <button
      ref={setNodeRef}
      type="button"
      aria-label={label}
      onClick={onTap}
      style={{
        left: pct(frame.offsetX + p.x, frame.width),
        top: pct(frame.offsetY + p.y, frame.height),
        width: `max(44px, ${pct(p.width, frame.width)})`,
        height: `max(44px, ${pct(NODE_H, frame.height)})`,
      }}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none',
        'hover:ring-yarn/60 focus-visible:ring-yarn hover:ring-4 focus-visible:ring-4',
        isOver && 'ring-yarn ring-4',
      )}
    />
  );
}

function KeyHandle({
  value,
  p,
  index,
  frame,
  selected,
  onTap,
}: {
  value: number;
  p: PositionedNode;
  index: number;
  frame: Frame;
  selected: boolean;
  onTap: () => void;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `key:${value}` });
  const cx = frame.offsetX + p.x + beadOffset(index, p.node.keys.length);
  const cy = frame.offsetY + p.y;
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      aria-label={`Key ${value}`}
      aria-pressed={selected}
      onClick={onTap}
      style={{
        left: pct(cx - BEAD_R, frame.width),
        top: pct(cy - BEAD_R, frame.height),
        width: pct(BEAD_R * 2, frame.width),
        height: pct(BEAD_R * 2, frame.height),
      }}
      className={cn(
        'absolute cursor-grab touch-none rounded-full outline-none',
        'hover:ring-yarn/60 focus-visible:ring-yarn hover:ring-4 focus-visible:ring-4',
        selected && 'ring-yarn bg-highlight/50 ring-4',
        isDragging && 'opacity-30',
      )}
    />
  );
}

export function DailyBoard({
  move,
  keys,
  hint,
  onAttempt,
}: {
  move: DailyMove;
  keys: number[];
  hint: boolean;
  onAttempt: (value: string | number) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [selection, setSelection] = useState<Selection>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const next = move.kind === 'place' ? move.keyIndex : move.keyIndex + 1;
  const nextKey = keys[next];

  const shown = move.tree;
  const root = shown.root!;
  const layout = useMemo(() => layoutTree(shown), [shown]);
  const frame = viewFrame(layout, true, false);
  const { parentOf, nodeOfKey } = useMemo(() => {
    const parents = new Map<string, string>();
    const owners = new Map<number, string>();
    const walk = (n: BTreeNode) => {
      n.keys.forEach((k) => owners.set(k, n.id));
      n.children.forEach((c) => {
        parents.set(c.id, n.id);
        walk(c);
      });
    };
    walk(root);
    return { parentOf: parents, nodeOfKey: owners };
  }, [root]);

  const placeNext = (target: string) => {
    setSelection(null);
    onAttempt(move.kind === 'place' ? target : DAILY_NEXT);
  };

  const moveKey = (key: number, target: string) => {
    const from = nodeOfKey.get(key);
    setSelection(null);
    if (!from || target === from) return;
    const valid = target === NEW_ROOT ? from === root.id : parentOf.get(from) === target;
    onAttempt(valid ? key : `${key}@${target}`);
  };

  const dropOn = (target: string) => {
    if (selection?.type === 'tray') placeNext(target);
    else if (selection?.type === 'key') moveKey(selection.key, target);
    else if (move.kind === 'place' && target !== NEW_ROOT) placeNext(target);
  };

  const tapKey = (k: number) => {
    const owner = nodeOfKey.get(k)!;
    if (selection?.type === 'tray') placeNext(owner);
    else if (selection?.type === 'key' && nodeOfKey.get(selection.key) !== owner) {
      moveKey(selection.key, owner);
    } else
      setSelection(
        selection?.type === 'key' && selection.key === k ? null : { type: 'key', key: k },
      );
  };

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    setSelection(null);
    setDragging(id === TRAY ? (nextKey ?? null) : Number(id.split(':')[1]));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    if (!e.over) return;
    const target = String(e.over.id);
    const id = String(e.active.id);
    if (id === TRAY) placeNext(target);
    else moveKey(Number(id.split(':')[1]), target);
  };

  const splitUp = () => {
    if (selection?.type !== 'key') return;
    const from = nodeOfKey.get(selection.key)!;
    moveKey(selection.key, parentOf.get(from) ?? NEW_ROOT);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <NumberRow
        keys={keys}
        next={next}
        selected={selection?.type === 'tray'}
        onTapNext={() => setSelection(selection?.type === 'tray' ? null : { type: 'tray' })}
      />

      <div className="mt-4 rounded-lg bg-sky-200">
        <SkyAboveRoot />
        <div className="relative">
          <BTreeView
            tree={shown}
            scene
            className="block"
            label={`Tree with ${layout.nodes.length} node${layout.nodes.length === 1 ? '' : 's'}`}
            overflowNodeId={hint && move.kind === 'check' ? move.nodeId : undefined}
            highlightNodeIds={hint && move.kind === 'place' ? [root.id] : []}
          />
          <div className="absolute inset-0">
            {layout.nodes.map((p) => (
              <NodeZone key={p.node.id} p={p} frame={frame} onTap={() => dropOn(p.node.id)} />
            ))}
            {layout.nodes.flatMap((p) =>
              p.node.keys.map((k, i) => (
                <KeyHandle
                  key={k}
                  value={k}
                  p={p}
                  index={i}
                  frame={frame}
                  selected={selection?.type === 'key' && selection.key === k}
                  onTap={() => tapKey(k)}
                />
              )),
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        <span className="text-small text-ink-muted">
          {selection?.type === 'key'
            ? `${selection.key} selected`
            : 'Tap a key in the tree to select it'}
        </span>
        <Button size="sm" variant="outline" onClick={splitUp} disabled={selection?.type !== 'key'}>
          Split and move up
        </Button>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging !== null ? <Bead value={dragging} className="cursor-grabbing" /> : null}
      </DragOverlay>
    </DndContext>
  );
}

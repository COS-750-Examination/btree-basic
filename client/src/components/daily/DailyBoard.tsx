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
import { DAILY_NEXT, DAILY_ROOT, type BTreeNode, type DailyMove } from '@btree/engine';
import { useMemo, useState, type ReactNode } from 'react';
import { BEAD_R, beadOffset, layoutTree, viewFrame, type PositionedNode } from '../../lib/layout';
import { BTreeView } from '../tree/BTreeView';
import { Button, cn } from '../ui';

const NEW_ROOT = 'new-root';
const NODE_H = BEAD_R * 2 + 12;

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

function TrayKey({ value }: { value: number }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `tray:${value}` });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      aria-label={`Key ${value} to insert`}
      className={cn('touch-none rounded-full', isDragging && 'opacity-30')}
    >
      <Bead value={value} className="cursor-grab" />
    </button>
  );
}

function RootSpot({ value, onTap }: { value: number; onTap: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: DAILY_ROOT });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onTap}
      className={cn(
        'border-ink/50 text-ink-muted mx-auto my-10 grid h-24 w-64 place-items-center rounded-lg border-2 border-dashed font-bold',
        isOver && 'border-yarn bg-highlight/40',
      )}
    >
      Drop {value} here to start the tree
    </button>
  );
}

function NewRootSpot({ armed, onTap }: { armed: boolean; onTap: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: NEW_ROOT });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onTap}
      aria-label="New root above the tree"
      className={cn(
        'border-ink/40 text-ink-muted text-small mx-auto mt-3 block w-56 rounded-lg border-2 border-dashed py-2 font-bold',
        (isOver || armed) && 'border-yarn bg-highlight/40',
      )}
    >
      New root
    </button>
  );
}

function pct(n: number, of: number): string {
  return `${(n / of) * 100}%`;
}

function NodeZone({
  p,
  frameWidth,
  frameHeight,
  offsetX,
  offsetY,
  label,
  onTap,
  asButton,
  children,
}: {
  p: PositionedNode;
  frameWidth: number;
  frameHeight: number;
  offsetX: number;
  offsetY: number;
  label: string;
  onTap: () => void;
  asButton: boolean;
  children?: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: p.node.id });
  const style = {
    left: pct(offsetX + p.x - p.width / 2, frameWidth),
    top: pct(offsetY + p.y - NODE_H / 2, frameHeight),
    width: pct(p.width, frameWidth),
    height: pct(NODE_H, frameHeight),
  };
  const className = cn(
    'absolute rounded-full outline-none',
    asButton &&
      'hover:ring-yarn/60 focus-visible:ring-yarn cursor-pointer hover:ring-4 focus-visible:ring-4',
    isOver && 'ring-yarn ring-4',
  );
  return asButton ? (
    <button
      ref={setNodeRef}
      type="button"
      aria-label={label}
      style={style}
      className={className}
      onClick={onTap}
    />
  ) : (
    <div ref={setNodeRef} style={style} className={className}>
      {children}
    </div>
  );
}

function KeyHandle({
  value,
  index,
  count,
  nodeWidth,
  selected,
  onTap,
}: {
  value: number;
  index: number;
  count: number;
  nodeWidth: number;
  selected: boolean;
  onTap: () => void;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `key:${value}` });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      aria-label={`Key ${value}`}
      aria-pressed={selected}
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      style={{
        left: pct(nodeWidth / 2 + beadOffset(index, count) - BEAD_R, nodeWidth),
        top: pct(6, NODE_H),
        width: pct(BEAD_R * 2, nodeWidth),
        height: pct(BEAD_R * 2, NODE_H),
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
  hint,
  onAttempt,
}: {
  move: DailyMove;
  hint: boolean;
  onAttempt: (value: string | number) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const tree = move.tree;
  const layout = useMemo(() => layoutTree(tree), [tree]);
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
    if (tree.root) walk(tree.root);
    return { parentOf: parents, nodeOfKey: owners };
  }, [tree]);

  const moveUp = (key: number, target: string) => {
    const from = nodeOfKey.get(key);
    setSelected(null);
    if (!from || target === from) return;
    const valid = target === NEW_ROOT ? from === tree.root?.id : parentOf.get(from) === target;
    onAttempt(valid ? key : `${key}@${target}`);
  };

  const onDragStart = (e: DragStartEvent) => {
    setDragging(Number(String(e.active.id).split(':')[1]));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const target = e.over ? String(e.over.id) : null;
    if (!target) return;
    if (move.kind === 'place') onAttempt(target);
    else moveUp(Number(String(e.active.id).split(':')[1]), target);
  };

  const tapNode = (id: string) => {
    if (move.kind === 'place') onAttempt(id);
    else if (selected !== null) moveUp(selected, id);
  };

  const tapKey = (k: number) => {
    const owner = nodeOfKey.get(k)!;
    if (selected !== null && selected !== k && nodeOfKey.get(selected) !== owner) {
      moveUp(selected, owner);
    } else {
      setSelected(selected === k ? null : k);
    }
  };

  const overflowShown = hint && move.kind === 'check' && move.answer !== DAILY_NEXT;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {move.kind === 'place' && (
        <div className="mb-3 flex items-center justify-center gap-3">
          <TrayKey value={move.key} />
          <span className="text-small text-ink-muted">
            {tree.root
              ? 'Drag onto a leaf, or tap the leaf'
              : 'Drag onto the dashed spot, or tap it'}
          </span>
        </div>
      )}

      {move.kind === 'check' && (
        <NewRootSpot
          armed={selected !== null}
          onTap={() => selected !== null && moveUp(selected, NEW_ROOT)}
        />
      )}

      <div className="my-3 rounded-lg bg-sky-200">
        {tree.root ? (
          <div className="relative">
            <BTreeView
              tree={tree}
              scene
              className="block"
              label={`Tree with ${layout.nodes.length} node${layout.nodes.length === 1 ? '' : 's'}`}
              overflowNodeId={overflowShown && move.kind === 'check' ? move.nodeId! : undefined}
              highlightNodeIds={hint && move.kind === 'place' ? [tree.root.id] : []}
            />
            <div className="absolute inset-0">
              {layout.nodes.map((p) => (
                <NodeZone
                  key={p.node.id}
                  p={p}
                  frameWidth={frame.width}
                  frameHeight={frame.height}
                  offsetX={frame.offsetX}
                  offsetY={frame.offsetY}
                  label={`Node with keys ${p.node.keys.join(', ')}`}
                  asButton={move.kind === 'place'}
                  onTap={() => tapNode(p.node.id)}
                >
                  {move.kind === 'check' &&
                    p.node.keys.map((k, i) => (
                      <KeyHandle
                        key={k}
                        value={k}
                        index={i}
                        count={p.node.keys.length}
                        nodeWidth={p.width}
                        selected={selected === k}
                        onTap={() => tapKey(k)}
                      />
                    ))}
                </NodeZone>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid">
            <RootSpot value={move.key} onTap={() => onAttempt(DAILY_ROOT)} />
          </div>
        )}
      </div>

      {move.kind === 'check' && (
        <div className="flex justify-center">
          <Button onClick={() => onAttempt(DAILY_NEXT)}>Next key</Button>
        </div>
      )}

      <DragOverlay dropAnimation={null}>
        {dragging !== null ? <Bead value={dragging} className="cursor-grabbing" /> : null}
      </DragOverlay>
    </DndContext>
  );
}

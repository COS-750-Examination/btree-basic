import {
  DECORATIONS,
  GROWTH_STAGES,
  reachedStage,
  type DecorationId,
  type GrowthStageId,
} from '@btree/shared';
import { Tag } from '../ui';
import { DecoArt } from './DecoIcon';
import { FrontHill, SCENE_ASPECT, SCENE_VIEWBOX } from './SceneBackdrop';
import { StageArt } from './StageArt';

/*
 * The student's tree in the grove scene (Figma: 09 My grove → Grove scene → Tree), drawn in the
 * same 832×480 frame as SceneBackdrop and placed over it with SceneBackdrop's `art` prop.
 *
 * - Seed, sprout and shrub: the Figma stage icons, scaled up on a soil mound.
 * - Sapling: the Figma scene tree exactly (the mockup shows a sapling at 55%).
 * - Young tree and full tree: the same tree, grown larger with extra canopy behind it.
 * Decorations hang where Figma places them and scale with the tree. One that the tree is not
 * big enough for yet can show as a dashed "spot", like Figma's "Swing spot · young tree".
 */

const TRUNK_BASE = 'translate(416 400)';
const TREE_SCALE: Partial<Record<GrowthStageId, number>> = {
  sapling: 1,
  'young-tree': 1.08,
  'full-tree': 1.12,
};
const SMALL_SCALE: Partial<Record<GrowthStageId, number>> = { seed: 3, sprout: 3.5, shrub: 4.5 };
/** Where the small stages stand: on the front hill, centred under where the trunk will be. */
const GROUND_Y = 418;

function Tree({ stage }: { stage: GrowthStageId }) {
  return (
    <>
      {stage !== 'sapling' && (
        <circle cx="498" cy="186" r="44" fill="var(--leaf-dark)" className="drop-shadow-lift" />
      )}
      {stage === 'full-tree' && (
        <>
          <circle cx="338" cy="178" r="44" fill="var(--leaf-dark)" className="drop-shadow-lift" />
          <circle cx="430" cy="124" r="40" fill="var(--leaf-dark)" className="drop-shadow-lift" />
        </>
      )}
      <path d="M402 400L408 236H424L432 400H402Z" fill="var(--branch)" />
      <path d="M412 318L354 284" stroke="var(--branch)" strokeWidth="10" strokeLinecap="round" />
      <path d="M422 292L482 260" stroke="var(--branch)" strokeWidth="9" strokeLinecap="round" />
      <circle cx="416" cy="186" r="78" fill="var(--leaf-dark)" className="drop-shadow-lift" />
      <circle cx="354" cy="258" r="50" fill="var(--leaf)" className="drop-shadow-lift" />
      <circle cx="482" cy="246" r="54" fill="var(--leaf)" className="drop-shadow-lift" />
      <circle cx="418" cy="236" r="52" fill="var(--leaf-light)" className="drop-shadow-lift" />
      <circle cx="382" cy="150" r="22" fill="var(--leaf-light)" className="drop-shadow-lift" />
    </>
  );
}

const BLOSSOMS = [
  [356, 196],
  [406, 120],
  [464, 162],
  [324, 262],
  [508, 222],
  [396, 232],
  [458, 252],
  [374, 178],
  [496, 190],
] as const;

const APPLES = [
  [378, 270, 9],
  [440, 206, 9],
  [500, 270, 9],
  [348, 226, 8],
  [430, 152, 8],
  [476, 214, 8],
] as const;

const BUNTING_FLAGS = [
  [365, 295, 'var(--coral)'],
  [390, 300, 'var(--highlight)'],
  [415, 298, 'var(--bunting-blue)'],
  [441, 289, 'var(--coral)'],
  [463, 276, 'var(--highlight)'],
] as const;

const FAIRY_BULBS = [
  [360, 182],
  [388, 192],
  [418, 192],
  [447, 179],
  [476, 167],
  [505, 168],
] as const;

/** One lantern from the Figma icon, hung by a string from (x, top). */
function Lantern({ x, top, fill }: { x: number; top: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${top})`}>
      <path d="M0 0V14" stroke="var(--branch-dark)" strokeWidth="2" />
      <g transform="scale(2) translate(-8.167 4.433)" className="drop-shadow-lift">
        <rect x="4.083" y="3.5" width="8.167" height="11.667" rx="3.5" fill={fill} />
        <rect x="5.833" y="2.567" width="4.667" height="2.1" rx="0.7" fill="var(--branch-dark)" />
        <rect x="5.833" y="14.467" width="4.667" height="2.1" rx="0.7" fill="var(--branch-dark)" />
        <circle cx="8.167" cy="9.333" r="1.867" fill="var(--sun)" />
      </g>
    </g>
  );
}

/** Decorations that hang on the tree, in the Figma tree's coordinates. */
function TreeDecorations({ show, spot }: { show: Set<DecorationId>; spot: Set<DecorationId> }) {
  return (
    <>
      {show.has('blossoms') &&
        BLOSSOMS.map(([x, y]) => (
          <g key={`b${x}`} transform={`translate(${x} ${y})`}>
            <g fill="var(--blossom)">
              <circle cy="-4.2" r="4" />
              <circle cx="4" cy="-1.3" r="4" />
              <circle cx="2.5" cy="3.4" r="4" />
              <circle cx="-2.5" cy="3.4" r="4" />
              <circle cx="-4" cy="-1.3" r="4" />
            </g>
            <circle r="3" fill="var(--sun)" className="drop-shadow-lift" />
          </g>
        ))}
      {show.has('apples') &&
        APPLES.map(([x, y, r]) => (
          <g key={`a${x}`}>
            <circle cx={x} cy={y} r={r} fill="var(--apple)" className="drop-shadow-lift" />
            <circle cx={x - 3} cy={y - 3} r={r * 0.26} fill="white" fillOpacity="0.55" />
          </g>
        ))}
      {show.has('fairy-lights') && (
        <g>
          <path
            d="M346 170C380 196 420 198 452 176C476 160 500 160 520 176"
            stroke="var(--ink)"
            fill="none"
            strokeWidth="1.5"
          />
          <g fill="var(--sun)" className="drop-shadow-lift">
            {FAIRY_BULBS.map(([x, y]) => (
              <circle key={x} cx={x} cy={y + 4} r="5" />
            ))}
          </g>
        </g>
      )}
      {show.has('bunting') && (
        <g>
          <path
            d="M354 288C396.667 308 439.333 300 482 264"
            stroke="var(--ink)"
            fill="none"
            strokeWidth="1.5"
          />
          {BUNTING_FLAGS.map(([x, y, fill]) => (
            <path key={x} d={`M${x} ${y}h18l-9 18z`} fill={fill} className="drop-shadow-lift" />
          ))}
        </g>
      )}
      {show.has('lanterns') && (
        <>
          <Lantern x={318} top={284} fill="var(--coral)" />
          <Lantern x={522} top={274} fill="var(--highlight)" />
        </>
      )}
      {show.has('bird-box') && (
        <g transform="translate(397.4 314) scale(1.4)" className="drop-shadow-lift">
          <DecoArt id="bird-box" />
        </g>
      )}
      {show.has('songbird') && (
        <g fill="var(--coral)" className="drop-shadow-lift">
          <path d="M436 116L422 108L424 122L436 116Z" />
          <ellipse cx="446" cy="114" rx="13" ry="10" />
          <circle cx="458" cy="104" r="8" />
          <path d="M465 102L474 105L465 108V102Z" fill="var(--highlight)" />
          <circle cx="460" cy="102" r="1.6" fill="var(--ink)" />
        </g>
      )}
      {(show.has('tree-swing') || spot.has('tree-swing')) && (
        <g
          stroke="var(--ink-muted)"
          strokeWidth="2"
          {...(show.has('tree-swing') ? {} : { strokeDasharray: '6 5' })}
        >
          <path d="M366 290V380M390 302V380" />
          <rect
            x="358"
            y="380"
            width="40"
            height="8"
            rx="3"
            fill={show.has('tree-swing') ? 'var(--ink-muted)' : 'none'}
          />
        </g>
      )}
    </>
  );
}

/** Butterflies fly free of the tree, so they stay put while it grows. */
function Butterflies() {
  return (
    <>
      <g transform="translate(572 214) scale(1.6) rotate(-12 14 14)">
        <DecoArt id="butterflies" />
      </g>
      <g transform="translate(218 200) scale(1.35) rotate(10 14 14)">
        <DecoArt id="butterflies" />
      </g>
    </>
  );
}

const stageLabel = (id: GrowthStageId) => GROWTH_STAGES.find((s) => s.id === id)!.label;

export function GroveTree({
  stage,
  decorations = [],
  showSpots = false,
}: {
  stage: GrowthStageId;
  decorations?: readonly string[];
  /** Show dashed spots for owned-or-not decorations that unlock at the next stage. */
  showSpots?: boolean;
}) {
  const nextStage = GROWTH_STAGES[GROWTH_STAGES.findIndex((s) => s.id === stage) + 1]?.id;
  const show = new Set<DecorationId>(
    DECORATIONS.filter((d) => decorations.includes(d.id) && reachedStage(stage, d.minStage)).map(
      (d) => d.id,
    ),
  );
  // Figma only draws a dashed spot for the swing, so it is the only decoration with one.
  const spot = new Set<DecorationId>(
    showSpots && nextStage === 'young-tree' && !show.has('tree-swing') ? ['tree-swing'] : [],
  );
  const treeScale = TREE_SCALE[stage];
  const smallScale = SMALL_SCALE[stage];
  const visible = DECORATIONS.filter((d) => show.has(d.id)).map((d) => d.name.toLowerCase());
  const label = `A ${stageLabel(stage).toLowerCase()}${visible.length ? ` with ${visible.join(', ')}` : ''}`;

  return (
    <>
      <svg
        viewBox={SCENE_VIEWBOX}
        preserveAspectRatio={SCENE_ASPECT}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={label}
      >
        {treeScale && (
          <g transform={`${TRUNK_BASE} scale(${treeScale}) translate(-416 -400)`}>
            <Tree stage={stage} />
            <TreeDecorations show={show} spot={spot} />
          </g>
        )}
        {show.has('butterflies') && <Butterflies />}
        <FrontHill />
        {smallScale && (
          <g>
            <ellipse cx="416" cy={GROUND_Y} rx="48" ry="10" fill="var(--branch-dark)" />
            <g
              transform={`translate(${416 - 30 * smallScale} ${GROUND_Y - 48 * smallScale}) scale(${smallScale})`}
            >
              <StageArt stage={stage} withGround={false} />
            </g>
          </g>
        )}
      </svg>
      {spot.has('tree-swing') && (
        <Tag
          tone="spot"
          className="absolute"
          style={{ left: `${(408 / 832) * 100}%`, top: `${(392 / 480) * 100}%` }}
        >
          Swing spot · {stageLabel('young-tree').toLowerCase()}
        </Tag>
      )}
    </>
  );
}

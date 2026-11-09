import type { GrowthStageId } from '@btree/shared';

/**
 * The student's tree. It grows a stage for every few modules mastered (competence) and shows
 * the decorations bought with leaves. Pure SVG so "Snap a photo" can export it.
 */
export function GroveTree({
  stage,
  decorations = [],
}: {
  stage: GrowthStageId;
  decorations?: string[];
}) {
  const has = (id: string) => decorations.includes(id);
  return (
    <svg
      viewBox="0 0 400 360"
      className="mx-auto h-auto w-full max-w-md"
      role="img"
      aria-label={`A ${stage.replace('-', ' ')}${decorations.length ? ` with ${decorations.join(', ')}` : ''}`}
    >
      <ellipse cx="200" cy="330" rx="60" ry="10" fill="var(--node-ring)" opacity="0.7" />
      {stage === 'seed' && <ellipse cx="200" cy="322" rx="12" ry="8" fill="var(--node-ring)" />}
      {stage === 'sprout' && (
        <g>
          <path d="M200 330 V290" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" />
          <path
            d="M200 296 C 180 280, 168 286, 170 296 C 182 300, 192 300, 200 296Z"
            fill="var(--primary)"
          />
          <path
            d="M200 290 C 220 274, 234 280, 232 290 C 220 294, 208 294, 200 290Z"
            fill="var(--hill-2)"
          />
        </g>
      )}
      {stage === 'shrub' && (
        <g>
          <circle cx="180" cy="300" r="30" fill="var(--hill-3)" />
          <circle cx="222" cy="298" r="32" fill="var(--hill-2)" />
          <circle cx="200" cy="276" r="30" fill="var(--primary)" />
        </g>
      )}
      {(stage === 'sapling' || stage === 'young-tree' || stage === 'full-tree') && (
        <g>
          <path d="M192 330 L196 200 L204 200 L210 330 Z" fill="#a87650" />
          {stage !== 'sapling' && (
            <path
              d="M200 240 L160 210 M200 228 L240 196"
              stroke="#a87650"
              strokeWidth="8"
              strokeLinecap="round"
            />
          )}
          <circle
            cx="200"
            cy={stage === 'sapling' ? 190 : 150}
            r={stage === 'sapling' ? 50 : 70}
            fill="var(--primary)"
          />
          {stage !== 'sapling' && (
            <>
              <circle cx="140" cy="200" r="50" fill="var(--hill-3)" />
              <circle cx="260" cy="196" r="52" fill="var(--hill-3)" />
              <circle cx="200" cy="190" r="56" fill="var(--hill-2)" />
            </>
          )}
          {stage === 'full-tree' && <circle cx="200" cy="96" r="44" fill="var(--hill-2)" />}
        </g>
      )}

      {has('apples') && stage !== 'seed' && (
        <g fill="#d94b3d">
          {[
            [170, 170],
            [230, 160],
            [205, 205],
            [150, 215],
            [255, 215],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="7" />
          ))}
        </g>
      )}
      {has('blossoms') && stage !== 'seed' && (
        <g fill="#f4b6c2">
          {[
            [185, 140],
            [240, 190],
            [160, 190],
            [215, 230],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="6" />
          ))}
        </g>
      )}
      {has('songbird') && (
        <path d="M250 110 q 12 -14 26 0 l 10 -4 l -6 8 q -14 10 -30 -4z" fill="var(--danger)" />
      )}
      {has('bunting') && (
        <g>
          <path d="M150 240 Q 200 260 250 240" stroke="var(--text)" fill="none" strokeWidth="1.5" />
          {[160, 180, 200, 220, 240].map((x, i) => (
            <path
              key={x}
              d={`M${x - 6} ${246 + (i % 2) * 2} l12 0 l-6 12z`}
              fill={['var(--danger)', 'var(--accent)', '#6aa5d8'][i % 3]}
            />
          ))}
        </g>
      )}
      {has('fairy-lights') && (
        <g fill="var(--sun)">
          {[150, 170, 190, 210, 230, 250].map((x, i) => (
            <circle key={x} cx={x} cy={180 + Math.sin(i) * 10} r="4" />
          ))}
        </g>
      )}
      {has('lanterns') && (
        <g fill="var(--danger)">
          <rect x="130" y="240" width="10" height="16" rx="3" />
          <rect x="262" y="240" width="10" height="16" rx="3" />
        </g>
      )}
      {has('butterflies') && (
        <g fill="#f4b6c2">
          <ellipse cx="100" cy="200" rx="8" ry="5" />
          <ellipse cx="310" cy="230" rx="8" ry="5" fill="#6aa5d8" />
        </g>
      )}
      {has('bird-box') && (
        <g>
          <rect x="192" y="250" width="18" height="20" fill="#8b5e3c" />
          <path d="M188 250 l13 -10 l13 10z" fill="var(--danger)" />
        </g>
      )}
      {has('tree-swing') && (
        <g stroke="var(--text)" strokeWidth="1.5">
          <line x1="236" y1="215" x2="236" y2="290" />
          <line x1="262" y1="215" x2="262" y2="290" />
          <rect x="230" y="288" width="38" height="5" fill="#8b5e3c" />
        </g>
      )}
    </svg>
  );
}

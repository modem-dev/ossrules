/**
 * Small marks for the technique cards.
 *
 * Three sets are defined so the direction can be compared side by side. Each is
 * drawn on a 20px grid, inherits `currentColor`, and abstracts the mechanism the
 * technique describes rather than illustrating its subject matter: a ratchet is
 * a sawtooth travelling one way, a router is one node fanning to three.
 *
 * Pick one set and delete the other two.
 */

import type { PatternId } from './agents-md-data';

export type IconTake = 'diagram' | 'pixel' | 'solid';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Take A: line diagrams of the mechanism. */
const DIAGRAM: Record<PatternId, React.ReactNode> = {
    'hard-prohibition': (
        <>
            <circle cx="10" cy="10" r="6.5" {...S} />
            <path d="M5.4 14.6 14.6 5.4" {...S} />
        </>
    ),
    'worked-examples': (
        <>
            <rect x="2.5" y="3.5" width="15" height="5.5" rx="1" {...S} />
            <rect x="2.5" y="11" width="15" height="5.5" rx="1" {...S} />
            <path d="M5 6.2l1.3 1.3L8.8 5" {...S} />
            <path d="M5.4 12.9l2.6 2.7M8 12.9l-2.6 2.7" {...S} />
        </>
    ),
    'generated-file-guard': (
        <>
            <path d="M4.5 3.5h7l4 4v9h-11z" {...S} />
            <path d="M11 3.5v4h4" {...S} />
            <path d="M7.5 12.5a2.5 2.5 0 1 0 2.5-2.5" {...S} />
            <path d="M7.5 10.3v2.2h2.2" {...S} />
        </>
    ),
    'verification-matrix': (
        <>
            <rect x="3" y="3" width="14" height="14" rx="1" {...S} />
            <path d="M10 3v14M3 10h14" {...S} />
            <rect x="10.5" y="10.5" width="6" height="6" fill="currentColor" stroke="none" opacity="0.85" />
        </>
    ),
    'nested-instructions': (
        <>
            <rect x="2.5" y="2.5" width="12" height="12" rx="1" {...S} />
            <rect x="6" y="6" width="11.5" height="11.5" rx="1" {...S} />
        </>
    ),
    'single-source': (
        <>
            <circle cx="10" cy="10" r="2.6" {...S} />
            <path d="M10 2.5v3.4M17.5 10h-3.4M10 17.5v-3.4M2.5 10h3.4" {...S} />
        </>
    ),
    'skill-routing': (
        <>
            <circle cx="4" cy="10" r="1.8" {...S} />
            <circle cx="16" cy="4.5" r="1.6" {...S} />
            <circle cx="16" cy="10" r="1.6" {...S} />
            <circle cx="16" cy="15.5" r="1.6" {...S} />
            <path d="M5.8 9.4 14.4 5.1M5.8 10h8.6M5.8 10.6l8.6 4.3" {...S} />
        </>
    ),
    'behavioral-conditioning': (
        <>
            <path d="M3 16.5c0-6 3.5-9 7-9" {...S} />
            <path d="M8 5.2 10.8 7.5 8 9.8" {...S} />
            <path d="M14.5 3.5v13" {...S} strokeDasharray="2 2" />
        </>
    ),
    'house-vocabulary': (
        <>
            <path d="M3.5 6h9M3.5 9.5h13M3.5 13h6" {...S} />
            <path d="M11 16.2h5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
    ),
    'architecture-narrative': (
        <>
            <rect x="2" y="7.5" width="4.5" height="5" rx="1" {...S} />
            <rect x="13.5" y="7.5" width="4.5" height="5" rx="1" {...S} />
            <circle cx="10" cy="10" r="1.6" {...S} />
            <path d="M6.9 10h1.3M11.9 10h1.2" {...S} />
        </>
    ),
    ratchet: (
        <>
            <path d="M2.5 14.5 6 14.5 6 11 9.5 11 9.5 7.5 13 7.5 13 4.5" {...S} />
            <path d="M14.5 14.5h3M16.2 12.9l1.6 1.6-1.6 1.6" {...S} />
        </>
    ),
    'contribution-etiquette': (
        <>
            <path d="M3 10h7.5" {...S} />
            <path d="M8.6 8.1 10.5 10l-1.9 1.9" {...S} />
            <path d="M13.5 3.5v13" {...S} />
            <path d="M16.5 6v8" {...S} strokeDasharray="2 2" />
        </>
    ),
    'scope-layering': (
        <>
            <rect x="2.5" y="3.5" width="15" height="3.6" rx="1" {...S} />
            <rect x="2.5" y="8.2" width="15" height="3.6" rx="1" fill="currentColor" stroke="none" opacity="0.85" />
            <rect x="2.5" y="12.9" width="15" height="3.6" rx="1" {...S} />
        </>
    ),
    'context-budget': (
        <>
            <rect x="2.5" y="6.5" width="15" height="7" rx="1.5" {...S} />
            <rect x="4.3" y="8.3" width="6.5" height="3.4" rx="0.8" fill="currentColor" stroke="none" opacity="0.85" />
            <path d="M13.8 5.2v9.6" {...S} />
        </>
    ),
};

/**
 * Take B: 8x8 pixel marks, matching the site's dithered background texture and
 * the terminal subject matter. Authored as grids so the shapes stay on-pixel.
 */
const PIXEL_GRIDS: Record<PatternId, string[]> = {
    'hard-prohibition': ['..1111..', '.1....1.', '1....11.', '1...11.1', '1.11...1', '11.....1', '.1....1.', '..1111..'],
    'worked-examples': ['11111111', '1......1', '11111111', '........', '11111111', '1......1', '11111111', '........'],
    'generated-file-guard': ['.111111.', '.1....1.', '.1.11.1.', '.1....1.', '.1.111..', '.1....1.', '.111111.', '........'],
    'verification-matrix': ['1111.111', '1......1', '1111.111', '........', '1111.111', '1..11..1', '1111.111', '........'],
    'nested-instructions': ['111111..', '1....1..', '1.1111.1', '1.1..1.1', '111..1.1', '..1....1', '..111111', '........'],
    'single-source': ['...11...', '...11...', '.1.11.1.', '..1111..', '11111111', '..1111..', '.1.11.1.', '...11...'],
    'skill-routing': ['......11', '.....11.', '11...11.', '11.11111', '11...11.', '.....11.', '......11', '........'],
    'behavioral-conditioning': ['.....11.', '...111..', '..11..1.', '.11...1.', '111...1.', '11....1.', '11....1.', '........'],
    'house-vocabulary': ['11111111', '........', '11111111', '........', '1111....', '........', '..111111', '..111111'],
    'architecture-narrative': ['11.....1', '11.1...1', '11.1...1', '11.11111', '11.1...1', '11.1...1', '11.....1', '........'],
    ratchet: ['......11', '....1111', '....11..', '..111111', '..111...', '11111111', '1111....', '........'],
    'contribution-etiquette': ['...1..1.', '...1..1.', '11.1..1.', '1111..1.', '11.1..1.', '...1..1.', '...1..1.', '........'],
    'scope-layering': ['11111111', '........', '11111111', '11111111', '11111111', '........', '11111111', '........'],
    'context-budget': ['11111111', '1......1', '1111...1', '1111...1', '1111...1', '1111...1', '1......1', '11111111'],
};

/**
 * Renders the grid as a single path rather than one rect per cell: fewer nodes,
 * and no synthetic keys for cells whose only identity is their position.
 */
function pixelPath(grid: string[]): string {
    const CELL = 2.5;
    let d = '';
    grid.forEach((row, y) => {
        [...row].forEach((cell, x) => {
            if (cell !== '1') return;
            d += `M${x * CELL} ${y * CELL}h${CELL}v${CELL}h-${CELL}z`;
        });
    });
    return d;
}

/** Take C: solid geometric marks, heavier and more uniform. */
const SOLID: Record<PatternId, React.ReactNode> = {
    'hard-prohibition': (
        <>
            <circle cx="10" cy="10" r="7" fill="currentColor" opacity="0.25" />
            <rect x="4.5" y="8.8" width="11" height="2.4" rx="1.2" fill="currentColor" />
        </>
    ),
    'worked-examples': (
        <>
            <rect x="2.5" y="4" width="15" height="5" rx="1.5" fill="currentColor" />
            <rect x="2.5" y="11" width="15" height="5" rx="1.5" fill="currentColor" opacity="0.3" />
        </>
    ),
    'generated-file-guard': (
        <>
            <rect x="4" y="3" width="12" height="14" rx="1.5" fill="currentColor" opacity="0.28" />
            <circle cx="10" cy="10" r="3.2" fill="currentColor" />
        </>
    ),
    'verification-matrix': (
        <>
            <rect x="2.5" y="2.5" width="7" height="7" rx="1.2" fill="currentColor" opacity="0.3" />
            <rect x="10.5" y="2.5" width="7" height="7" rx="1.2" fill="currentColor" opacity="0.3" />
            <rect x="2.5" y="10.5" width="7" height="7" rx="1.2" fill="currentColor" opacity="0.3" />
            <rect x="10.5" y="10.5" width="7" height="7" rx="1.2" fill="currentColor" />
        </>
    ),
    'nested-instructions': (
        <>
            <rect x="2" y="2" width="12" height="12" rx="1.5" fill="currentColor" opacity="0.28" />
            <rect x="7" y="7" width="11" height="11" rx="1.5" fill="currentColor" />
        </>
    ),
    'single-source': (
        <>
            <circle cx="10" cy="10" r="3.4" fill="currentColor" />
            <circle cx="10" cy="3" r="1.6" fill="currentColor" opacity="0.35" />
            <circle cx="17" cy="10" r="1.6" fill="currentColor" opacity="0.35" />
            <circle cx="10" cy="17" r="1.6" fill="currentColor" opacity="0.35" />
            <circle cx="3" cy="10" r="1.6" fill="currentColor" opacity="0.35" />
        </>
    ),
    'skill-routing': (
        <>
            <circle cx="4" cy="10" r="2.6" fill="currentColor" />
            <circle cx="16" cy="4.5" r="2" fill="currentColor" opacity="0.35" />
            <circle cx="16" cy="10" r="2" fill="currentColor" opacity="0.35" />
            <circle cx="16" cy="15.5" r="2" fill="currentColor" opacity="0.35" />
        </>
    ),
    'behavioral-conditioning': (
        <>
            <path d="M3 17c0-7 4-11 9-11v11z" fill="currentColor" opacity="0.3" />
            <circle cx="13.5" cy="6" r="2.6" fill="currentColor" />
        </>
    ),
    'house-vocabulary': (
        <>
            <rect x="2.5" y="5" width="15" height="2.4" rx="1.2" fill="currentColor" opacity="0.3" />
            <rect x="2.5" y="9.3" width="10" height="2.4" rx="1.2" fill="currentColor" opacity="0.3" />
            <rect x="2.5" y="13.6" width="7" height="2.4" rx="1.2" fill="currentColor" />
        </>
    ),
    'architecture-narrative': (
        <>
            <rect x="2" y="7.5" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.35" />
            <rect x="7.5" y="7.5" width="5" height="5" rx="1.2" fill="currentColor" opacity="0.6" />
            <rect x="13" y="7.5" width="5" height="5" rx="1.2" fill="currentColor" />
        </>
    ),
    ratchet: (
        <>
            <path d="M2.5 16.5v-3h4v-3.5h4V6h4V2.5h2.5v14z" fill="currentColor" opacity="0.3" />
            <path d="M2.5 16.5v-3h4v-3.5h4V6h4V2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </>
    ),
    'contribution-etiquette': (
        <>
            <rect x="12.5" y="2.5" width="2.6" height="15" rx="1.3" fill="currentColor" />
            <rect x="2.5" y="8.7" width="7.5" height="2.6" rx="1.3" fill="currentColor" opacity="0.4" />
        </>
    ),
    'scope-layering': (
        <>
            <rect x="2.5" y="3.5" width="15" height="3.6" rx="1.2" fill="currentColor" opacity="0.28" />
            <rect x="2.5" y="8.2" width="15" height="3.6" rx="1.2" fill="currentColor" />
            <rect x="2.5" y="12.9" width="15" height="3.6" rx="1.2" fill="currentColor" opacity="0.28" />
        </>
    ),
    'context-budget': (
        <>
            <rect x="2" y="6.5" width="16" height="7" rx="2" fill="currentColor" opacity="0.28" />
            <rect x="2" y="6.5" width="7" height="7" rx="2" fill="currentColor" />
        </>
    ),
};

export function TechniqueIcon({
    pattern,
    take = 'diagram',
    className = 'size-5',
}: {
    pattern: PatternId;
    take?: IconTake;
    className?: string;
}) {
    return (
        <svg viewBox="0 0 20 20" aria-hidden className={className} role="presentation">
            {take === 'pixel' ? (
                <path d={pixelPath(PIXEL_GRIDS[pattern])} fill="currentColor" />
            ) : take === 'solid' ? (
                SOLID[pattern]
            ) : (
                DIAGRAM[pattern]
            )}
        </svg>
    );
}

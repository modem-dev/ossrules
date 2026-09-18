import type { PatternId } from './agents-md-data';

// Distinct, compact symbols for each pattern, shared by cards, links, and filters.
const paths: Record<PatternId, string> = {
    'hard-prohibition': 'M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM4.4 15.6 15.6 4.4',
    'worked-examples': 'M2 4h6v12H2zM12 4h6v12h-6zM4 8l2 3M6 8l-2 3M13.5 9l1.5 2 2-4',
    'generated-file-guard': 'M10 18H3V2h8l4 4v2M10 2v5h5M14 10l4 2v3c0 2-4 4-4 4s-4-2-4-4v-3z',
    'verification-matrix': 'M2 3h7v6H2zM2 12h7v6H2zM12 5l2 2 4-4M12 14l2 2 4-4',
    'nested-instructions': 'M3 2h10v5H7v11H3zM7 7h10v11H7zM10 11h4M10 14h4',
    'single-source': 'M10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM2 10h5M13 10h5M10 2v5M10 13v5M1 8v4M18 8v4M8 1h4M8 18h4',
    'skill-routing': 'M2 8h4v4H2zM14 2h4v4h-4zM14 14h4v4h-4zM6 10h4V4h4M10 10v6h4',
    'behavioral-conditioning': 'M10 2v3M10 15v3M2 10h3M15 10h3M16 4l-4 8-8 4 4-8z',
    'house-vocabulary': 'M2 3h7l1 2 1-2h7v14h-7l-1 1-1-1H2zM10 5v13M4 7h3M4 10h3M13 7h3M13 10h3',
    'architecture-narrative': 'M7 2h6v4H7zM2 14h6v4H2zM12 14h6v4h-6zM10 6v4M5 14v-4h10v4',
    ratchet: 'M2 17h5v-5h5V7h5V2M12 2h5v5',
    'contribution-etiquette': 'M2 3h16v11h-8l-5 4v-4H2zM6 8l3 3 5-5',
    'scope-layering': 'M2 6l8-4 8 4-8 4zM2 10l8 4 8-4M2 14l8 4 8-4',
    'context-budget': 'M5 3H2v14h3M15 3h3v14h-3M6 6h8M6 10h5M6 14h8',
};

export function PatternIcon({ pattern, className = 'size-5' }: { pattern: PatternId; className?: string }) {
    return (
        <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={`shrink-0 ${className}`}
        >
            <path d={paths[pattern]} />
        </svg>
    );
}

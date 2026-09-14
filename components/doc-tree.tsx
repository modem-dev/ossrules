/**
 * Four takes on visualising the documents an AGENTS.md routes to.
 *
 * The input is the entry's `references`: the docs the file tells the agent to
 * read, which is a different thing from its repo map. A file with none renders
 * nothing, which is itself the signal that it is self-contained.
 *
 * Takes 1, 2 and 4 render on the server, so their content is in the HTML. Take 3
 * lives in doc-tree-pierre.tsx because it needs hooks. Pick one and delete the rest.
 */

import type { DocReference } from './agents-md-data';

export type TreeTake = 'ascii' | 'rich' | 'fan';

interface TreeNode {
    name: string;
    path: string;
    label?: string;
    children: TreeNode[];
}

/** Groups flat paths into a directory tree, directories before files at each level. */
export function buildTree(references: DocReference[]): TreeNode[] {
    const root: TreeNode = { name: '', path: '', children: [] };
    for (const reference of references) {
        const segments = reference.path.split('/');
        let node = root;
        segments.forEach((segment, index) => {
            const isLeaf = index === segments.length - 1;
            const path = segments.slice(0, index + 1).join('/');
            let next = node.children.find((child) => child.name === segment);
            if (!next) {
                next = { name: segment, path, children: [] };
                node.children.push(next);
            }
            if (isLeaf && reference.label) next.label = reference.label;
            node = next;
        });
    }
    const sort = (nodes: TreeNode[]): TreeNode[] => {
        nodes.sort((a, b) => {
            const aDir = a.children.length > 0 ? 0 : 1;
            const bDir = b.children.length > 0 ? 0 : 1;
            return aDir - bDir || a.name.localeCompare(b.name);
        });
        for (const node of nodes) sort(node.children);
        return nodes;
    };
    return sort(root.children);
}

/* ------------------------------- Take 1: ASCII ------------------------------ */

function asciiLines(nodes: TreeNode[], prefix = ''): { text: string; isFile: boolean }[] {
    const out: { text: string; isFile: boolean }[] = [];
    nodes.forEach((node, index) => {
        const last = index === nodes.length - 1;
        out.push({ text: `${prefix}${last ? '└── ' : '├── '}${node.name}`, isFile: node.children.length === 0 });
        if (node.children.length > 0) {
            out.push(...asciiLines(node.children, `${prefix}${last ? '    ' : '│   '}`));
        }
    });
    return out;
}

export function AsciiDocTree({ references, rootLabel }: { references: DocReference[]; rootLabel: string }) {
    const lines = asciiLines(buildTree(references));
    return (
        <pre className="overflow-x-auto rounded-lg border border-gray-750/70 bg-gray-850/60 p-4 font-mono text-[12.5px] leading-relaxed text-gray-400">
            <span className="text-teal">{rootLabel}</span>
            {'\n'}
            {lines.map((line) => (
                <span key={line.text} className={line.isFile ? 'text-gray-400' : 'text-gray-550'}>
                    {line.text}
                    {'\n'}
                </span>
            ))}
        </pre>
    );
}

/* ------------------------------- Take 2: Rich ------------------------------- */

const KIND_STYLES: Record<string, string> = {
    SKILL: 'border-teal/50 text-teal',
    AGENTS: 'border-teal/50 text-teal',
    CLAUDE: 'border-teal/50 text-teal',
};

function kindOf(name: string): string | undefined {
    const match = name.match(/^(SKILL|AGENTS|CLAUDE)\.md$/);
    return match ? match[1] : undefined;
}

function RichRows({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) {
    return (
        <ul className={depth === 0 ? '' : 'ml-3 border-l border-gray-750/70 pl-3'}>
            {nodes.map((node) => {
                const isFile = node.children.length === 0;
                const kind = kindOf(node.name);
                return (
                    <li key={node.path} className="py-[3px]">
                        <div className="flex items-baseline gap-2">
                            <span className={isFile ? 'font-mono text-[13px] text-light-cream/85' : 'font-mono text-[13px] text-gray-550'}>
                                {node.name}
                                {isFile ? '' : '/'}
                            </span>
                            {kind ? (
                                <span
                                    className={`rounded border px-1.5 py-px font-inter text-[10px] uppercase tracking-wide ${KIND_STYLES[kind]}`}
                                >
                                    {kind}
                                </span>
                            ) : null}
                            {node.label && node.label !== node.name && node.label !== node.path ? (
                                <span className="truncate font-inter text-[11px] text-gray-600">{node.label}</span>
                            ) : null}
                        </div>
                        {node.children.length > 0 ? <RichRows nodes={node.children} depth={depth + 1} /> : null}
                    </li>
                );
            })}
        </ul>
    );
}

export function RichDocTree({ references, rootLabel }: { references: DocReference[]; rootLabel: string }) {
    return (
        <div className="rounded-lg border border-gray-750/70 bg-medium-gray/30 p-4">
            <div className="mb-2 flex items-baseline gap-2 border-b border-gray-750/50 pb-2">
                <span className="font-mono text-[13px] text-teal">{rootLabel}</span>
                <span className="font-inter text-[11px] text-gray-600">routes to {references.length} documents</span>
            </div>
            <RichRows nodes={buildTree(references)} />
        </div>
    );
}

/* -------------------------------- Take 4: Fan ------------------------------- */

/**
 * A horizontal fan: the AGENTS.md on the left, one curve per document, grouped
 * and coloured by top-level directory. Reads the fan-out in one glance and gets
 * denser rather than longer as the count grows.
 */
export function FanDocTree({ references, rootLabel }: { references: DocReference[]; rootLabel: string }) {
    const groups = new Map<string, DocReference[]>();
    for (const reference of references) {
        const segments = reference.path.split('/');
        const key = segments.length > 1 ? `${segments[0]}/` : 'root';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)?.push(reference);
    }

    const ROW = 22;
    const GROUP_GAP = 12;
    const LEFT = 196;
    const WIDTH = 640;
    const entries = [...groups.entries()];
    const height = entries.reduce((sum, [, items]) => sum + items.length * ROW + GROUP_GAP, 0) + 16;
    const hue = (index: number) => `oklch(0.78 0.09 ${170 + index * 42})`;

    let y = 18;
    const rows: { reference: DocReference; y: number; color: string; group: string; first: boolean }[] = [];
    entries.forEach(([group, items], groupIndex) => {
        items.forEach((reference, index) => {
            rows.push({ reference, y, color: hue(groupIndex), group, first: index === 0 });
            y += ROW;
        });
        y += GROUP_GAP;
    });

    const midY = height / 2;

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-750/70 bg-gray-850/50 p-4">
            <svg
                viewBox={`0 0 ${WIDTH} ${height}`}
                width={WIDTH}
                height={height}
                role="img"
                aria-label={`${rootLabel} routes to ${references.length} documents`}
            >
                <title>{`${rootLabel} routes to ${references.length} documents`}</title>
                <rect x="4" y={midY - 26} width="3" height="52" rx="1.5" fill="#44bda3" />
                <text x="14" y={midY - 4} className="font-mono" fontSize="12" fill="#44bda3">
                    {rootLabel}
                </text>
                <text x="14" y={midY + 12} className="font-mono" fontSize="10.5" fill="#6c6860">
                    {references.length} docs
                </text>
                {rows.map((row) => (
                    <g key={row.reference.path}>
                        <path
                            d={`M96 ${midY} C ${LEFT - 50} ${midY}, ${LEFT - 56} ${row.y - 4}, ${LEFT} ${row.y - 4}`}
                            fill="none"
                            stroke={row.color}
                            strokeWidth="1"
                            opacity="0.5"
                        />
                        <circle cx={LEFT} cy={row.y - 4} r="2.5" fill={row.color} />
                        <text x={LEFT + 10} y={row.y} className="font-mono" fontSize="11.5" fill="#c4c1bb">
                            {row.reference.path}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

export function DocTree({ references, rootLabel, take }: { references: DocReference[]; rootLabel: string; take: TreeTake }) {
    if (references.length === 0) return null;
    if (take === 'ascii') return <AsciiDocTree references={references} rootLabel={rootLabel} />;
    if (take === 'fan') return <FanDocTree references={references} rootLabel={rootLabel} />;
    return <RichDocTree references={references} rootLabel={rootLabel} />;
}

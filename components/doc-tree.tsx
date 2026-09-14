/**
 * The documents an AGENTS.md routes to, drawn as a tree.
 *
 * The input is the entry's `references`: the docs the file tells the agent to
 * read, which is a different thing from its repo map. A file with none renders
 * nothing, which is itself the signal that it is self-contained.
 *
 * Long trees clip to a fixed height with a fade and an expander. The lines are
 * rendered here, on the server, and handed to the client wrapper as children, so
 * the whole tree is in the prerendered HTML either way.
 */

import type { DocReference } from './agents-md-data';
import { Expandable } from './expandable';

/** Tree lines shown before collapsing. Airflow is 34, Omarchy 18. */
const COLLAPSE_AFTER_LINES = 20;

/** Must match the `leading-5` on the <pre> for the clip to land on a line boundary. */
const LINE_HEIGHT_PX = 20;

interface TreeNode {
    name: string;
    path: string;
    children: TreeNode[];
}

function buildTree(references: DocReference[]): TreeNode[] {
    const root: TreeNode = { name: '', path: '', children: [] };
    for (const reference of references) {
        const segments = reference.path.split('/');
        let node = root;
        segments.forEach((segment, index) => {
            const path = segments.slice(0, index + 1).join('/');
            let next = node.children.find((child) => child.name === segment);
            if (!next) {
                next = { name: segment, path, children: [] };
                node.children.push(next);
            }
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

function asciiLines(nodes: TreeNode[], prefix = ''): { key: string; text: string; isFile: boolean }[] {
    const out: { key: string; text: string; isFile: boolean }[] = [];
    nodes.forEach((node, index) => {
        const last = index === nodes.length - 1;
        out.push({
            key: node.path,
            text: `${prefix}${last ? '└── ' : '├── '}${node.name}`,
            isFile: node.children.length === 0,
        });
        if (node.children.length > 0) {
            out.push(...asciiLines(node.children, `${prefix}${last ? '    ' : '│   '}`));
        }
    });
    return out;
}

function Lines({ lines, rootLabel }: { lines: { key: string; text: string; isFile: boolean }[]; rootLabel: string }) {
    return (
        <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-5 text-gray-400">
            <span className="text-teal">{rootLabel}</span>
            {'\n'}
            {lines.map((line) => (
                <span key={line.key} className={line.isFile ? 'text-gray-400' : 'text-gray-550'}>
                    {line.text}
                    {'\n'}
                </span>
            ))}
        </pre>
    );
}

export function DocTree({ references, rootLabel }: { references: DocReference[]; rootLabel: string }) {
    if (references.length === 0) return null;

    const lines = asciiLines(buildTree(references));
    const total = lines.length + 1; // the root label occupies a line too
    const shell = 'overflow-hidden rounded-lg border border-gray-750/70 bg-gray-850';

    if (total <= COLLAPSE_AFTER_LINES) {
        return (
            <div className={shell}>
                <Lines lines={lines} rootLabel={rootLabel} />
            </div>
        );
    }

    return (
        <div className={shell}>
            <Expandable collapsedHeight={COLLAPSE_AFTER_LINES * LINE_HEIGHT_PX + 32} expandLabel={`Show all ${total} lines`}>
                <Lines lines={lines} rootLabel={rootLabel} />
            </Expandable>
        </div>
    );
}

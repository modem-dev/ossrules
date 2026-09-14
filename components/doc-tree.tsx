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
 *
 * Every file with a local copy opens in the tray. The two kinds that do not are
 * left as plain text and say why: a reference that names a shape rather than a
 * file ("the nearest nested AGENTS.md"), and one whose path does not resolve in
 * the repository at all — an AGENTS.md pointing at a document that is not there.
 */

import type { DocReference } from './agents-md-data';
import { Expandable } from './expandable';
import { FileLink } from './file-tray';

/** Tree lines shown before collapsing. Airflow is 34, Omarchy 18. */
const COLLAPSE_AFTER_LINES = 20;

/** Must match the `leading-5` on the <pre> for the clip to land on a line boundary. */
const LINE_HEIGHT_PX = 20;

interface TreeNode {
    name: string;
    path: string;
    children: TreeNode[];
    reference?: DocReference;
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
            if (index === segments.length - 1) next.reference = reference;
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

interface AsciiLine {
    key: string;
    /** The box-drawing prefix. Kept separate so only the name is clickable. */
    stem: string;
    name: string;
    isFile: boolean;
    reference?: DocReference;
}

function asciiLines(nodes: TreeNode[], prefix = ''): AsciiLine[] {
    const out: AsciiLine[] = [];
    nodes.forEach((node, index) => {
        const last = index === nodes.length - 1;
        out.push({
            key: node.path,
            stem: `${prefix}${last ? '└── ' : '├── '}`,
            name: node.name,
            isFile: node.children.length === 0,
            reference: node.reference,
        });
        if (node.children.length > 0) {
            out.push(...asciiLines(node.children, `${prefix}${last ? '    ' : '│   '}`));
        }
    });
    return out;
}

function Lines({ lines, rootLabel, fileHref }: { lines: AsciiLine[]; rootLabel: string; fileHref: (path: string) => string }) {
    return (
        <pre className="overflow-x-auto p-4 font-mono text-[12.5px] text-gray-400 leading-5">
            <FileLink path="AGENTS.md" href={fileHref('AGENTS.md')} className="cursor-pointer text-teal hover:underline">
                {rootLabel}
            </FileLink>
            {'\n'}
            {lines.map((line) => (
                <span key={line.key}>
                    <span className="text-gray-550">{line.stem}</span>
                    {line.isFile && line.reference?.kind !== 'pattern' ? (
                        <FileLink
                            path={line.reference?.path ?? line.key}
                            label={line.reference?.label}
                            href={fileHref(line.reference?.path ?? line.key)}
                            className="cursor-pointer text-gray-400 hover:text-teal hover:underline"
                        >
                            {line.name}
                        </FileLink>
                    ) : (
                        <span className="text-gray-550">{line.name}</span>
                    )}
                    {line.reference?.kind === 'pattern' ? (
                        <span className="text-gray-600"> — {line.reference.label ?? 'a shape, not one file'}</span>
                    ) : null}
                    {'\n'}
                </span>
            ))}
        </pre>
    );
}

export function DocTree({
    references,
    rootLabel,
    fileHref,
}: {
    references: DocReference[];
    rootLabel: string;
    /** Where a file lives on GitHub, for the fallback when it has no local copy. */
    fileHref: (path: string) => string;
}) {
    if (references.length === 0) return null;

    const lines = asciiLines(buildTree(references));
    const total = lines.length + 1; // the root label occupies a line too
    const shell = 'overflow-hidden rounded-lg border border-gray-750/70 bg-gray-850';

    if (total <= COLLAPSE_AFTER_LINES) {
        return (
            <div className={shell}>
                <Lines lines={lines} rootLabel={rootLabel} fileHref={fileHref} />
            </div>
        );
    }

    return (
        <div className={shell}>
            <Expandable collapsedHeight={COLLAPSE_AFTER_LINES * LINE_HEIGHT_PX + 32} expandLabel={`Show all ${total} lines`}>
                <Lines lines={lines} rootLabel={rootLabel} fileHref={fileHref} />
            </Expandable>
        </div>
    );
}

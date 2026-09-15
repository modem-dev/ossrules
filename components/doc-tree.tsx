/**
 * Pinned instruction files and supporting documents, with explicit relationships.
 * Files are siblings in the repository tree; discovery does not imply that the
 * primary instruction file references every document. Long trees stay collapsed.
 */

import type { DocReference, VendoredFile } from './agents-md-data';
import { Expandable } from './expandable';
import { FileLink } from './file-tray';

/** Keep the document list compact near the top of the project page. */
const COLLAPSE_AFTER_LINES = 8;

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

function Lines({
    lines,
    rootLabel,
    fileHref,
    files,
}: {
    lines: AsciiLine[];
    rootLabel: string;
    fileHref: (path: string) => string;
    files: VendoredFile[];
}) {
    return (
        <pre className="overflow-x-auto p-4 font-mono text-[12.5px] text-gray-400 leading-5">
            {lines.map((line) => (
                <span key={line.key}>
                    <span className="text-gray-550">{line.stem}</span>
                    {line.isFile && line.reference?.kind !== 'pattern' ? (
                        <FileLink
                            path={line.reference?.path ?? line.key}
                            label={line.reference?.label}
                            href={fileHref(line.reference?.path ?? line.key)}
                            className={`cursor-pointer hover:text-teal hover:underline ${line.key === rootLabel ? 'text-teal' : 'text-gray-400'}`}
                        >
                            {line.name}
                        </FileLink>
                    ) : (
                        <span className="text-gray-550">{line.name}</span>
                    )}
                    {line.reference?.kind === 'pattern' ? (
                        <span className="text-gray-600"> — {line.reference.label ?? 'a shape, not one file'}</span>
                    ) : null}
                    <Relationships file={files.find((file) => file.path === line.key)} />
                    {'\n'}
                </span>
            ))}
        </pre>
    );
}

export function DocTree({
    references,
    rootLabel,
    files = [],
    fileHref,
}: {
    references: DocReference[];
    files?: VendoredFile[];
    rootLabel: string;
    /** Where a file lives on GitHub, for the fallback when it has no local copy. */
    fileHref: (path: string) => string;
}) {
    const documents = new Map<string, DocReference>([[rootLabel, { path: rootLabel }], ...references.map((r) => [r.path, r] as const)]);
    for (const file of files) if (!documents.has(file.path)) documents.set(file.path, { path: file.path });
    const tree = buildTree([...documents.values()]);
    tree.sort(
        (a, b) =>
            Number(b.path === rootLabel) - Number(a.path === rootLabel) ||
            Number(/^(AGENTS|CLAUDE)\.md$/.test(b.path)) - Number(/^(AGENTS|CLAUDE)\.md$/.test(a.path)),
    );
    const lines = asciiLines(tree);
    const total = lines.length;
    const shell = 'overflow-hidden rounded-lg border border-gray-750/70 bg-gray-850';

    if (total <= COLLAPSE_AFTER_LINES) {
        return (
            <div className={shell}>
                <Lines lines={lines} rootLabel={rootLabel} fileHref={fileHref} files={files} />
            </div>
        );
    }

    return (
        <div className={shell}>
            <Expandable collapsedHeight={COLLAPSE_AFTER_LINES * LINE_HEIGHT_PX + 32} expandLabel={`Show all ${total} lines`}>
                <Lines lines={lines} rootLabel={rootLabel} fileHref={fileHref} files={files} />
            </Expandable>
        </div>
    );
}

function Relationships({ file }: { file?: VendoredFile }) {
    if (!file) return null;
    return (
        <span className="text-gray-600">
            {file.symlink !== undefined ? ` · symlink → ${file.symlink}${file.unavailable ? ` (${file.unavailable})` : ''}` : ''}
            {file.sameContentAs ? ` · same content as ${file.sameContentAs}` : ''}
            {file.imports?.length
                ? ` · imports ${file.imports.map((item) => `${item.target}${item.unavailable ? ' (unavailable)' : ''}`).join(', ')}`
                : ''}
        </span>
    );
}

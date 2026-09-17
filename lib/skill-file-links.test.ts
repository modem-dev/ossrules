import assert from 'node:assert/strict';
import test from 'node:test';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { remarkSkillFileLinks } from './skill-file-links';

function linked(source: string, currentFile = 'SKILL.md', files = ['SKILL.md', 'references/guide.md', 'scripts/setup.sh']) {
    const tree = fromMarkdown(source);
    remarkSkillFileLinks({ currentFile, files })(tree);
    const links: { url: string; text: string; inlineCode: boolean }[] = [];
    function visit(node: { type: string; url?: string; value?: string; children?: (typeof node)[] }) {
        if (node.type === 'link') {
            links.push({
                url: node.url ?? '',
                text: node.children?.map((child) => child.value).join('') ?? '',
                inlineCode: node.children?.[0]?.type === 'inlineCode',
            });
        }
        node.children?.forEach(visit);
    }
    visit(tree);
    return links;
}

test('links exact bundle paths in prose and inline code while preserving the original label', () => {
    assert.deepEqual(linked('Read references/guide.md. Run `bash ./scripts/setup.sh` then `references/guide.md#usage`.'), [
        { url: 'references/guide.md', text: 'references/guide.md', inlineCode: false },
        { url: './scripts/setup.sh', text: './scripts/setup.sh', inlineCode: true },
        { url: 'references/guide.md#usage', text: 'references/guide.md#usage', inlineCode: true },
    ]);
});

test('resolves sibling and parent paths from supporting files without guessing basenames', () => {
    assert.deepEqual(
        linked('See `guide.md`, ../SKILL.md, or `./guide.md`.', 'references/other.md').map((link) => link.url),
        ['guide.md', '../SKILL.md', './guide.md'],
    );
    assert.deepEqual(linked('Read `guide.md` or `missing.md`.'), []);
});

test('does not link code blocks, existing link labels, URLs, globs, or partial filenames', () => {
    const source = [
        '```sh\ncat references/guide.md\n```',
        '    scripts/setup.sh',
        '[references/guide.md](https://example.com)',
        '[`scripts/setup.sh`][external]\n\n[external]: https://example.com',
        'https://example.com/references/guide.md nested/references/guide.md references/guide.md.backup references/guide.md-old references/*.md',
        '`references/guide.md*` `scripts/setup.sh?` `scripts/setup.sh[12]` `*scripts/setup.sh`',
        '<span title="references/guide.md">HTML</span>',
    ].join('\n\n');
    assert.deepEqual(linked(source), [{ url: 'https://example.com', text: 'references/guide.md', inlineCode: false }]);
});

test('handles path punctuation, spaces, unicode, and overlapping filenames', () => {
    assert.deepEqual(
        linked('`docs/a+b (v2).md` and docs/説明.md, then docs/a.md.txt.', 'SKILL.md', [
            'docs/a+b (v2).md',
            'docs/説明.md',
            'docs/a.md',
            'docs/a.md.txt',
        ]).map((link) => link.url),
        ['docs/a+b (v2).md', 'docs/説明.md', 'docs/a.md.txt'],
    );
    assert.deepEqual(linked('SKILL.md', 'SKILL.md', []), []);
});

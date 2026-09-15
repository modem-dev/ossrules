import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { InstructionMarkdown } from '../components/instruction-markdown';
import { instructionLink } from './instruction-links';
import { highlight } from './syntax';

const url = 'https://github.com/example/repo/blob/abc123/docs/AGENTS.md';
test('repository links remain pinned, resolve nested paths, and reject unsafe or malformed URLs', () => {
    assert.equal(instructionLink('../CLAUDE.md#rules', url).path, 'CLAUDE.md');
    assert.equal(instructionLink('/guides/setup.md', url).href, 'https://github.com/example/repo/blob/abc123/guides/setup.md');
    assert.equal(instructionLink('https://example.com/docs', url).path, undefined);
    assert.equal(instructionLink('#hello-world', url).anchor, 'hello-world');
    for (const link of ['javascript:alert(1)', 'data:text/html,bad', 'broken%ZZ.md', '#%ZZ']) {
        assert.equal(instructionLink(link, url).href, '');
    }
});
test('formatted instructions render GFM and leave upstream HTML inert', () => {
    const html = renderToStaticMarkup(
        <InstructionMarkdown
            source={
                '# Guide\n\n- **Keep this**\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n<script>alert(1)</script>\n\n```js\nconst x = "<script>";\n```'
            }
            sourceUrl={url}
            readable={new Set()}
            onOpen={() => {}}
        />,
    );
    assert.match(html, /<h1 id="instruction-guide">Guide<\/h1>/);
    assert.match(html, /<strong>Keep this<\/strong>/);
    assert.match(html, /<table>/);
    assert.ok(!html.includes('<script>'));
    assert.match(html, /&lt;script&gt;/);
});
test('Shiki preserves source text, lines, and both theme variants', async () => {
    const source = '# Guide\n\n```ts\nconst x: string = "<tag>";\n```\n';
    const tokens = await highlight(source, 'md');
    assert.ok(tokens);
    assert.equal(tokens.map((line) => line.map((token) => token.content).join('')).join('\n'), source);
    assert.ok(tokens.flat().every((token) => token.variants.light.color && token.variants.dark.color));
    const code = await highlight('const x = 42;', 'ts');
    assert.ok(new Set(code?.flat().map((token) => token.variants.light.color)).size > 1);
    assert.equal(await highlight('plain source', 'unsupported-language'), undefined);
});

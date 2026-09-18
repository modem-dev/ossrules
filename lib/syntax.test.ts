import assert from 'node:assert/strict';
import test from 'node:test';
import { highlight } from './syntax';

test('extensionless Node scripts use JavaScript highlighting without changing source text', async () => {
    for (const shebang of ['#!/usr/bin/env node', '#!/usr/bin/env -S node --no-warnings', '#!/usr/bin/node', '#!/usr/local/bin/node']) {
        const source = `${shebang}\nconst answer = 42;`;
        const inferred = await highlight(source, 'scripts/agent-transcript');
        assert.deepEqual(inferred, await highlight(source, 'javascript'));
        assert.equal(inferred?.map((line) => line.map((token) => token.content).join('')).join('\n'), source);
    }
});

test('shebang detection requires a Node interpreter on the first line', async () => {
    for (const source of [
        '#!/usr/bin/env nodejs-helper\nconst x = 1;',
        '\n#!/usr/bin/env node',
        '#!/usr/bin/env python\nprint(1)',
        'Example: #!/usr/bin/env node',
    ]) {
        assert.equal(await highlight(source, 'text'), undefined);
    }
});

test('recognized language declarations take precedence over a shebang', async () => {
    const source = '#!/usr/bin/env node\n# Heading';
    assert.deepEqual(await highlight(source, 'md'), await highlight(source, 'markdown'));
    assert.notDeepEqual(await highlight(source, 'md'), await highlight(source, 'javascript'));
});

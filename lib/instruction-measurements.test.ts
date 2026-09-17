import assert from 'node:assert/strict';
import test from 'node:test';
import { measureInstructions } from './instruction-measurements';

test('counts fenced blocks rather than delimiters, including nested and unclosed fences', () => {
    assert.equal(measureInstructions('```ts\nx\n```\n\n~~~python\ny\n~~~').codeBlocks, 2);
    assert.equal(measureInstructions('````md\n```ts\nx\n```\n````').codeBlocks, 1);
    assert.equal(measureInstructions('> ```ts\n> x\n> ```\n\n- item\n\n  ~~~\n  x\n  ~~~').codeBlocks, 2);
    assert.equal(measureInstructions('```js\nx\n~~~, not a closing fence').codeBlocks, 1);
    assert.equal(measureInstructions('    ```\n    indented code\n    ```\n\nInline `code`').codeBlocks, 0);
    assert.equal(measureInstructions('```bad`info\nx').codeBlocks, 0);
});

test('counts source lines independently of final newline and measures UTF-8 bytes', () => {
    for (const source of ['one\ntwo', 'one\ntwo\n', 'one\r\ntwo\r\n']) assert.equal(measureInstructions(source).lines, 2);
    assert.equal(measureInstructions('').lines, 0);
    assert.equal(measureInstructions('\n').lines, 1);
    assert.equal(measureInstructions('é').bytes, 2);
    assert.equal(measureInstructions('one\n\n').lines, 2);
});

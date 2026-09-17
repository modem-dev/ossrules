import assert from 'node:assert/strict';
import test from 'node:test';
import { skillHeadings, skillOutline } from './skill-outline';

test('headings follow GFM structure, not lines that look like headings in code', () => {
    const source = [
        '# Skill',
        '',
        '## Use **bold**, `code`, [links](./guide.md) &amp; ~~old~~ text',
        '',
        '```python',
        '# Not a heading',
        '## Neither is this',
        '```',
        '',
        '    # Indented code',
        '',
        'Setext section',
        '--------------',
        '',
        '### Café 中文 ![Diagram](diagram.png)',
    ].join('\n');
    assert.deepEqual(
        skillHeadings(source).map(({ text, line }) => ({ text, line })),
        [
            { text: 'Skill', line: 1 },
            { text: 'Use bold, code, links & old text', line: 3 },
            { text: 'Setext section', line: 12 },
            { text: 'Café 中文 Diagram', line: 15 },
        ],
    );
});

test('anchors remain unique with repeated headings, numeric suffixes, and empty slugs', () => {
    const headings = skillHeadings('## Setup\n## Setup\n## Setup-1\n## Setup\n## 🎉\n## 🎉\n## main\n## skill-document-title');
    assert.deepEqual(
        headings.map(({ id }) => id),
        ['setup', 'setup-1', 'setup-1-1', 'setup-2', 'section', 'section-1', 'main-1', 'skill-document-title-1'],
    );
});

test('outline omits a single document title and limits nesting without requiring H2', () => {
    assert.deepEqual(
        skillOutline(skillHeadings('# Title\n## Section\n### Detail\n#### Deep detail\n## Next')).map(({ text }) => text),
        ['Section', 'Detail', 'Next'],
    );
    assert.deepEqual(
        skillOutline(skillHeadings('# First\n## Child\n# Second')).map(({ text }) => text),
        ['First', 'Child', 'Second'],
    );
    assert.deepEqual(
        skillOutline(skillHeadings('### Section\n#### Detail')).map(({ text }) => text),
        ['Section', 'Detail'],
    );
    assert.deepEqual(skillOutline(skillHeadings('Just a paragraph.')), []);
    assert.equal(skillOutline(skillHeadings('# Only heading')).length, 1);
});

test('HTML markup and footnote definitions do not become outline entries', () => {
    assert.deepEqual(
        skillHeadings('## Read <em>this</em>\n\n<div>\n## HTML block\n</div>\n\n[^note]:\n    ## Footnote heading').map(({ text }) => text),
        ['Read this'],
    );
});

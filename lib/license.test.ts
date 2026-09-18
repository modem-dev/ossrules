import assert from 'node:assert/strict';
import test from 'node:test';
import { identifyLicense, licensePath } from './license';

test('finds root licenses regardless of casing, including named Apache files', () => {
    assert.equal(licensePath(['docs/LICENSE', 'license.md']), 'license.md');
    assert.equal(licensePath(['LICENSE-APACHE', 'LICENSE-MIT']), 'LICENSE-APACHE');
    assert.equal(licensePath(['LICENSE-APACHE', 'License.txt']), 'License.txt');
    assert.equal(licensePath(['packages/widget/LICENSE']), undefined);
});

test('recognizes wrapped MIT text and abbreviated Apache notices', () => {
    assert.equal(identifyLicense('Permission is hereby granted, free of\ncharge, to any person'), 'MIT');
    assert.equal(identifyLicense('Licensed under the Apache License, Version 2.0 (the "License");'), 'Apache-2.0');
    assert.equal(identifyLicense('Apache License\nVersion 2.0, January 2004'), 'Apache-2.0');
});

test('does not assign a license to unrecognized terms', () => {
    assert.equal(identifyLicense('See separate terms for each package.'), undefined);
});

test('keeps source-available terms ahead of their future license references', () => {
    assert.equal(identifyLicense('Functional Source License, Version 1.1. Future license: Apache License, Version 2.0'), 'FSL-1.1');
    assert.equal(identifyLicense('Business Source License. Change license: Apache License, Version 2.0'), 'BUSL-1.1');
});

/**
 * Names the license from its own text. Only the families present in the corpus
 * are matched; anything else is recorded as the path so the page can link to it
 * rather than assert a license we did not identify.
 */
const LICENSE_SIGNATURES: [RegExp, string][] = [
    // These licenses can name a future permissive license in their terms.
    [/Business Source License/i, 'BUSL-1.1'],
    [/Functional Source License/i, 'FSL-1.1'],
    [/GNU AFFERO GENERAL PUBLIC LICENSE\s+Version 3/i, 'AGPL-3.0'],
    [/GNU GENERAL PUBLIC LICENSE\s+Version 3/i, 'GPL-3.0'],
    [/GNU LESSER GENERAL PUBLIC LICENSE\s+Version 3/i, 'LGPL-3.0'],
    [/Apache License,?\s+Version 2\.0/i, 'Apache-2.0'],
    [/Mozilla Public License Version 2\.0/i, 'MPL-2.0'],
    [/Permission is hereby granted, free of charge/i, 'MIT'],
    [
        /Redistribution and use in source and binary forms[\s\S]*each copyright holder and contributor hereby grants[\s\S]*patent license/i,
        'BSD-2-Clause-Patent',
    ],
    [/Redistribution and use in source and binary forms[\s\S]{0,600}Neither the name/i, 'BSD-3-Clause'],
    [/Redistribution and use in source and binary forms/i, 'BSD-2-Clause'],
    [/Permission to use, copy, modify, and\/or distribute/i, 'ISC'],
    [/This is free and unencumbered software released into the public domain/i, 'Unlicense'],
];

export function identifyLicense(text: string): string | undefined {
    const normalized = text.replace(/\s+/g, ' ');
    return LICENSE_SIGNATURES.find(([pattern]) => pattern.test(normalized))?.[1];
}

const LICENSE_PATHS = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING', 'LICENSE-APACHE'];

export function licensePath(paths: string[]): string | undefined {
    for (const name of LICENSE_PATHS) {
        const match = paths.find((candidate) => candidate.toLowerCase() === name.toLowerCase());
        if (match) return match;
    }
    return undefined;
}

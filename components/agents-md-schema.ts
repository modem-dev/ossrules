/**
 * Runtime validation for a corpus entry.
 *
 * Entries are authored by fanning the evaluation out across model runs, so the
 * failure this guards against is a plausible-looking file with a missing field,
 * a mistyped count, or an unknown technique id. Hand-written rather than
 * schema-library based to match scripts/validate-posts.ts, which is the
 * existing precedent in this repo.
 *
 * Returns a list of human-readable problems; empty means valid.
 */

import { PATTERN_IDS } from './agents-md-data';

const FILE_STAT_KEYS = ['bytes', 'lines', 'words', 'headings', 'bullets', 'codeBlocks', 'docLinks'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown, minimum: number): boolean {
    return Array.isArray(value) && value.length >= minimum && value.every(isNonEmptyString);
}

export function validateAgentsProject(value: unknown, label: string): string[] {
    const errors: string[] = [];
    const at = (message: string) => errors.push(message);

    if (!isRecord(value)) return [`${label} is not an object.`];

    for (const key of ['slug', 'name', 'owner', 'repo', 'tagline', 'language', 'defaultBranch', 'hook', 'summary']) {
        if (!isNonEmptyString(value[key])) at(`"${key}" must be a non-empty string.`);
    }

    if (typeof value.stars !== 'number' || !Number.isInteger(value.stars) || value.stars < 0) {
        at('"stars" must be a non-negative integer.');
    }

    if (!isRecord(value.file)) {
        at('"file" must be an object of measured counts.');
    } else {
        for (const key of FILE_STAT_KEYS) {
            const count = value.file[key];
            if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
                at(`"file.${key}" must be a non-negative integer (measured, not estimated).`);
            }
        }
    }

    if (!Array.isArray(value.patterns) || value.patterns.length === 0) {
        at('"patterns" must list at least one technique id.');
    } else {
        for (const id of value.patterns) {
            if (typeof id !== 'string' || !PATTERN_IDS.includes(id)) {
                at(`"patterns" contains unknown technique id ${JSON.stringify(id)}.`);
            }
        }
        if (new Set(value.patterns as string[]).size !== value.patterns.length) {
            at('"patterns" contains a duplicate id.');
        }
    }

    if (!Array.isArray(value.techniques) || value.techniques.length === 0) {
        at('"techniques" must list at least one entry.');
    } else {
        value.techniques.forEach((technique, index) => {
            const where = `techniques[${index}]`;
            if (!isRecord(technique)) {
                at(`${where} is not an object.`);
                return;
            }
            if (!isNonEmptyString(technique.title)) at(`${where}.title must be a non-empty string.`);
            if (!isNonEmptyString(technique.body)) at(`${where}.body must be a non-empty string.`);
            if (technique.quote !== undefined && !isNonEmptyString(technique.quote)) {
                at(`${where}.quote must be a non-empty string when present.`);
            }
            if (technique.pattern !== undefined && !PATTERN_IDS.includes(technique.pattern as string)) {
                at(`${where}.pattern is unknown technique id ${JSON.stringify(technique.pattern)}.`);
            }
        });
    }

    if (!isRecord(value.lastCommit)) {
        at('"lastCommit" must be an object with "sha" and "date".');
    } else {
        if (typeof value.lastCommit.sha !== 'string' || !/^[0-9a-f]{40}$/.test(value.lastCommit.sha)) {
            at('"lastCommit.sha" must be a full 40-character commit sha.');
        }
        if (typeof value.lastCommit.date !== 'string' || Number.isNaN(Date.parse(value.lastCommit.date))) {
            at('"lastCommit.date" must be an ISO 8601 timestamp.');
        }
    }

    if (typeof value.evaluatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.evaluatedAt)) {
        at('"evaluatedAt" must be an ISO date (YYYY-MM-DD).');
    }

    if (!Array.isArray(value.references)) {
        at('"references" must be an array (empty when the file routes to no documents).');
    } else {
        value.references.forEach((reference, index) => {
            if (!isRecord(reference) || !isNonEmptyString(reference.path)) {
                at(`references[${index}] must be an object with a non-empty "path".`);
                return;
            }
            if (reference.label !== undefined && !isNonEmptyString(reference.label)) {
                at(`references[${index}].label must be a non-empty string when present.`);
            }
        });
    }

    if (!isStringArray(value.steal, 1)) at('"steal" must be a non-empty array of strings.');
    if (!isStringArray(value.outline, 1)) at('"outline" must be a non-empty array of section names.');

    return errors;
}

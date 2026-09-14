/**
 * Refreshes the mechanical half of the AGENTS.md corpus and reports what needs a
 * human or model pass.
 *
 * Entries go stale in two different ways, and only one of them can be fixed by a
 * script. Measurements, the upstream commit, and the default branch are facts
 * this can re-derive. The analysis is not: when the file itself has changed, the
 * techniques and quotes describe a revision that no longer exists, and that entry
 * has to be re-read. This reports those separately so a refresh run ends with a
 * list of entries to hand back to the evaluation skill.
 *
 * Star counts are left alone: the GitHub API is not reachable from every
 * environment this runs in, and a wrong number is worse than a dated one.
 *
 * With --write this also re-runs the file sync, because moving an entry's pinned
 * commit without re-downloading its files would leave the site showing one
 * revision of a document beside measurements taken from another.
 *
 *   npx tsx scripts/refresh-agents-md.ts            # report only
 *   npx tsx scripts/refresh-agents-md.ts --write    # apply the mechanical updates
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'projects');
const WRITE = process.argv.includes('--write');

interface Entry {
    slug: string;
    owner: string;
    repo: string;
    defaultBranch: string;
    evaluatedAt: string;
    lastCommit: { sha: string; date: string };
    file: Record<string, number>;
}

function measure(source: string) {
    const lines = source.split('\n');
    const count = (re: RegExp) => lines.filter((line) => re.test(line)).length;
    return {
        bytes: Buffer.byteLength(source, 'utf8'),
        lines: lines.length - 1,
        words: source.split(/\s+/).filter(Boolean).length,
        headings: count(/^#{1,6} /),
        bullets: count(/^\s*[-*] /),
        codeBlocks: count(/^\s*```/),
        docLinks: (source.match(/\]\([^)h][^)]*\)/g) ?? []).length,
    };
}

/** Last commit touching AGENTS.md, via a blobless clone (the REST API is often blocked). */
function lastCommit(entry: Entry): { sha: string; date: string } | undefined {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `agents-${entry.slug}-`));
    try {
        execFileSync(
            'git',
            [
                'clone',
                '-q',
                '--filter=blob:none',
                '--no-checkout',
                '--single-branch',
                '--branch',
                entry.defaultBranch,
                `https://github.com/${entry.owner}/${entry.repo}`,
                dir,
            ],
            { stdio: 'ignore', timeout: 300_000 },
        );
        const out = execFileSync('git', ['-C', dir, 'log', '-1', '--format=%H|%cI', '--', 'AGENTS.md'], {
            encoding: 'utf8',
            timeout: 240_000,
        }).trim();
        if (!out) return undefined;
        const [sha, iso] = out.split('|');
        return { sha, date: new Date(iso).toISOString() };
    } catch {
        return undefined;
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

async function main() {
    const files = fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.json'));
    const needsReread: string[] = [];
    const unreachable: string[] = [];

    for (const name of files) {
        const filePath = path.join(CONTENT_DIR, name);
        const entry = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Entry;

        const response = await fetch(`https://raw.githubusercontent.com/${entry.owner}/${entry.repo}/${entry.defaultBranch}/AGENTS.md`);
        if (!response.ok) {
            unreachable.push(`${entry.slug}: AGENTS.md returned ${response.status} on ${entry.defaultBranch}`);
            continue;
        }
        const source = await response.text();
        const measured = measure(source);
        const commit = lastCommit(entry);

        const contentChanged = measured.bytes !== entry.file.bytes || measured.lines !== entry.file.lines;
        const commitChanged = commit !== undefined && commit.sha !== entry.lastCommit.sha;

        if (contentChanged || commitChanged) {
            const age = commit ? commit.date.slice(0, 10) : 'unknown';
            needsReread.push(`${entry.slug}: file changed upstream (now ${measured.lines} lines, commit ${age})`);
        }

        if (WRITE) {
            entry.file = { ...entry.file, ...measured };
            if (commit) entry.lastCommit = commit;
            fs.writeFileSync(filePath, `${JSON.stringify(entry, null, 4)}\n`);
        }
        process.stdout.write(`  ${contentChanged || commitChanged ? '~' : '='} ${entry.slug}\n`);
    }

    if (WRITE) {
        console.log('\nRe-downloading vendored files for the pinned commits:');
        execFileSync('npx', ['tsx', path.join(process.cwd(), 'scripts', 'sync-agents-md-files.ts')], {
            stdio: 'inherit',
            timeout: 900_000,
        });
    }

    if (unreachable.length > 0) {
        console.log(`\nCould not reach ${unreachable.length}:`);
        for (const line of unreachable) console.log(`  - ${line}`);
    }

    if (needsReread.length === 0) {
        console.log('\nEvery entry matches its upstream file.');
        return;
    }

    console.log(`\n${needsReread.length} entr${needsReread.length === 1 ? 'y' : 'ies'} changed upstream:`);
    for (const line of needsReread) console.log(`  - ${line}`);
    console.log(
        WRITE
            ? '\nMeasurements and commits updated. Re-read each file above with the agents-md-entry skill\nand revise its techniques, quotes and summary, then set evaluatedAt to today.'
            : '\nRe-run with --write to update measurements and commits.',
    );
}

main();

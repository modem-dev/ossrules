/**
 * Build-time check for the AGENTS.md corpus in content/agents-md/.
 *
 * Entries are produced by evaluating a repository's AGENTS.md, a job that fans
 * out across model runs, so this runs the same validation the site loader runs
 * but reports every problem in every file at once instead of throwing on the
 * first. It also checks the things the loader cannot: that an entry's avatar
 * exists, and that no two entries claim the same repository.
 *
 * Usage: npx tsx scripts/validate-agents-md.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { validateAgentsProject } from '../components/agents-md/agents-md-schema';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'agents-md');
const LOGO_DIR = path.join(process.cwd(), 'public', 'agents-md');

function main() {
    if (!fs.existsSync(CONTENT_DIR)) {
        console.error(`Missing ${CONTENT_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.json'));
    const problems: string[] = [];
    const seenRepos = new Map<string, string>();

    for (const name of files) {
        const slug = name.replace(/\.json$/, '');
        let parsed: unknown;
        try {
            parsed = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, name), 'utf8'));
        } catch (error) {
            problems.push(`${name}: not valid JSON (${(error as Error).message})`);
            continue;
        }

        for (const message of validateAgentsProject(parsed, name)) {
            problems.push(`${name}: ${message}`);
        }

        const entry = parsed as { slug?: string; owner?: string; repo?: string };
        if (entry.slug !== slug) {
            problems.push(`${name}: slug "${entry.slug}" does not match the filename.`);
        }

        const repoKey = `${entry.owner}/${entry.repo}`;
        const existing = seenRepos.get(repoKey);
        if (existing) {
            problems.push(`${name}: ${repoKey} is already covered by ${existing}.`);
        } else {
            seenRepos.set(repoKey, name);
        }

        if (!fs.existsSync(path.join(LOGO_DIR, `${slug}.png`))) {
            problems.push(`${name}: missing avatar at public/agents-md/${slug}.png`);
        }
    }

    if (problems.length > 0) {
        console.error(`\n${problems.length} problem(s) in the AGENTS.md corpus:\n`);
        for (const problem of problems) console.error(`  - ${problem}`);
        console.error('');
        process.exit(1);
    }

    console.log(`✅ All ${files.length} AGENTS.md entries are valid.`);
}

main();

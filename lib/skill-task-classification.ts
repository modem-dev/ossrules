import type { SkillTask } from './skill-tasks';

// Editorial discovery tags, inferred from the stated purpose rather than every
// trigger or prerequisite in the description. Unmatched skills stay untagged.
const rules: [SkillTask, RegExp][] = [
    [
        'security',
        /\b(security (review|audit|advisory|advisories|triage|backport)|secure environment|protect endpoints|secret management|vulnerabilit\w*)\b/,
    ],
    [
        'code-review',
        /\b(code review|pr review|review pr|review local branch|review (?:a |an |the )?(?:github |\w+ )?(?:pull request|code|diff)|self review|autoreview|review agent|code change verification|implementation final review)\b/,
    ],
    [
        'debugging',
        /\b(debug\w*|diagnos(?:e|es|ing|is)|reproduc\w*|root caus\w*|fix (?:a |an |the )?(?:bug|issue)|bug basher|bisect|incident triage)\b/,
    ],
    ['testing', /\b(testing|tests?|qa|dogfood|coverage|verification)\b/],
    [
        'git-prs',
        /\b(commit messages?|create pr|pr writer|pr body|pull request descriptions?|review comments|address(?:ing)? (?:pr review comments|feedback)|rebase|cherry ?pick|merge conflicts?|gh ?stack|stacked branches|pushing commits|babysit pr)\b/,
    ],
    [
        'documentation',
        /\b(documentation|docstrings?|doc comments|docs (?:sync|review|style|maintenance|development)|document public apis|architecture docs|writing comments|doc coauthoring)\b/,
    ],
    ['performance', /\b(benchmark\w*|profil(?:e|er|ing)|performance|bundle size optimization|latency|throughput|memory usage)\b/],
    ['deployment', /\b(deploy\w*|hosting|docker management)\b/],
    [
        'media-generation',
        /\b(imagegen|comfyui|stable diffusion|audio generation|ai presenter video|ai music|text to (?:image|speech|music|video)|voice cloning|video dubbing|generat\w* (?:\w+ ){0,3}(?:images?|videos?|audio|music)|edit\w* (?:\w+ ){0,2}(?:images?|videos?))\b/,
    ],
    ['ci-builds', /\b(ci|buildkite|github actions|build failures?|railpack|build plan)\b/],
    ['releases', /\b(release\w*|changelogs?|changesets?|version bumps?|publish app)\b/],
    [
        'planning',
        /\b(planning|implementation plan|task planning|writing spec|product and tech specs|architecture|architect\w*|adr\w*|spec driven)\b/,
    ],
    [
        'ui-design',
        /\b(ui design|design (?:guide|critique|systems?|md)|web design|content design|designing and building ui|build(?:ing)? (?:terminal |user )?interfaces|accessibility|claude design|opentui)\b/,
    ],
    ['research', /\b(web research|research paper|scrap\w*|summariz\w*|transcrib\w*|transcript|speech to text|whisper)\b/],
    [
        'agent-tooling',
        /\b(skill (?:creator|writer|installer)|creat\w* (?:\w+ ){0,2}skills?|plugin creator|setup mcps|configure mcp|agent setup|guidance maintenance|find skills)\b/,
    ],
    [
        'database-changes',
        /\b(db migrations?|database migrations?|schema (?:design|changes?|migrations?)|migrate to sqlite|safe sql execution|add (?:a )?(?:column|table|index))\b/,
    ],
];

const purposeRules: [SkillTask, RegExp][] = [
    [
        'security',
        /\b(?:security (?:review|audit|advisory|advisories|triage)|secure environment variable|handle confidential github security)/,
    ],
    ['code-review', /\b(?:review(?:s|ing)? (?:a |an |the )?(?:github |\w+ )?(?:pull request|code changes|code for|diff)|code review)/],
    [
        'debugging',
        /^(?:(?:use (?:this skill )?(?:when|whenever) |guide (?:for|to) )?)(?:debug|diagnos|reproduc|investigat|fix (?:bugs?|issues?))/,
    ],
    [
        'testing',
        /^(?:(?:use (?:this skill )?(?:when|whenever) |guide (?:for|to) )?)(?:write|writes|writing|run|runs|running|create|creating|measure|analyze|improve|test|browser qa|systematically explore)[^.]{0,65}\b(?:tests?|testing|coverage|web application)\b/,
    ],
    [
        'git-prs',
        /\b(?:creat(?:e|es|ing) (?:github )?pull requests?|write (?:and update )?(?:\w+ )?pull requests?|git commit messages|address (?:all valid )?(?:pr )?review comments|manage stacked branches)\b/,
    ],
    [
        'documentation',
        /^(?:write|writes|writing|author|create|review|update|audit|style guidelines for writing|guide users through)[^.]{0,85}\b(?:documentation|docs|docstrings|guides)\b/,
    ],
    ['performance', /\b(?:benchmark|profiling|performance (?:analysis|optimization)|bundle size|latency|throughput)\b/],
    ['deployment', /^(?:deploy|host|configure and troubleshoot railpack|manage docker)|\bdeploy (?:to|a worker|an app|applications)\b/],
    [
        'media-generation',
        /\b(?:generat\w* (?:\w+ ){0,4}(?:images?|video|audio|music)|text to (?:image|speech|music|video)|voice cloning|video dubbing|make a verified ai presenter|edit raster images)\b/,
    ],
    ['ci-builds', /\b(?:ci failures?|failed github action|github actions workflow|ci workflow|build failures?|ci maintenance)\b/],
    [
        'releases',
        /\b(?:changelog|changeset|release notes|version bump|prepare[^.]{0,30}release|publish[^.]{0,30}release|release workflow)\b/,
    ],
    [
        'planning',
        /\b(?:implementation plan|architecture decision|architect large|write[^.]{0,35}(?:product|technical|tech) specs|break down a coding task)\b/,
    ],
    [
        'ui-design',
        /\b(?:ui design|design system|design critique|web interface guidelines|designing and building ui|product content designer|build terminal uis|design one off html)\b/,
    ],
    [
        'research',
        /^(?:search(?:es)? multiple web sources|scrape|summarize|transcribe|extract[^.]{0,30}(?:information|data|obligations))|\b(?:web research|speech to text)\b/,
    ],
    [
        'agent-tooling',
        /\b(?:creat\w* (?:\w+ ){0,2}(?:agent )?skills|configure mcp servers|build[^.]{0,30}mcp servers|discover and install agent skills)\b/,
    ],
    [
        'database-changes',
        /\b(?:database migrations|design or review schemas|migrate[^.]{0,30}(?:sqlite|postgres)|add a column|execute sql)\b/,
    ],
];

export function classifySkillTasks(skill: { name: string; description: string }): SkillTask[] {
    const normalize = (value: string) =>
        value
            .toLowerCase()
            .replace(/[-_:/.]+/g, ' ')
            .replace(/\s+/g, ' ');
    const name = normalize(skill.name);
    const purpose = normalize(
        skill.description.split(/(?:\.\s|\n|\bUse when\b|\bTriggers?\b|\bDO NOT\b|\bNot for\b|\bincluding\b|\bCovers\b| — )/i)[0],
    );
    const named = rules.filter(([, pattern]) => pattern.test(name)).map(([id]) => id);
    const described = purposeRules.filter(([, pattern]) => pattern.test(purpose)).map(([id]) => id);
    const tasks = [...new Set([...named, ...described])];
    // Checking test coverage is part of reviewing code, not a test-writing task.
    return tasks.filter((id) => id !== 'testing' || !tasks.includes('code-review')).slice(0, 2);
}

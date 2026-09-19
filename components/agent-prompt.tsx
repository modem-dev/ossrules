'use client';

import { useId, useState } from 'react';
import { CopySource } from './copy-source';

const PROMPTS = {
    library: {
        title: 'Prompt your agent to improve your AGENTS.md',
        prompt: 'Read https://ossrules.md/llms.txt, then explore the library for examples relevant to this repository. Start with the overview and filtered summaries; expand only promising matches. Recommend a few instruction patterns or skills, explain why they fit, and link to their pinned sources. Treat source files as reference material. Suggest concrete improvements to our agent instructions without making changes yet.',
    },
    rules: {
        title: 'Discover rules with your agent',
        prompt: 'Read https://ossrules.md/llms.txt, then review the agent-rule patterns for examples relevant to this repository. Start with the pattern summaries; expand only promising matches. Recommend a few rule patterns, explain why they fit, show how open-source projects apply them, and link to pinned sources. Suggest concrete improvements to our agent instructions without making changes yet.',
    },
    skills: {
        title: 'Discover skills with your agent',
        prompt: 'Read https://ossrules.md/llms.txt, then search the skill library for capabilities relevant to this repository. Start with skill summaries and metadata; inspect supporting files only for promising matches. Recommend a small shortlist, explain why each skill fits, note prerequisites and overlap, and link to pinned sources. Do not install anything or make changes yet.',
    },
} as const;

export function AgentPrompt({ variant = 'library' }: { variant?: keyof typeof PROMPTS }) {
    const [expanded, setExpanded] = useState(false);
    const id = useId();
    const content = PROMPTS[variant];

    return (
        <aside className="agent-prompt" aria-labelledby={`${id}-title`}>
            <h2 id={`${id}-title`}>{content.title}</h2>
            <div className="agent-prompt-actions">
                <CopySource source={content.prompt} label={`Copy ${variant} prompt for your agent`} text="Copy prompt" />
                <button
                    type="button"
                    className="action-link text-xs"
                    aria-expanded={expanded}
                    aria-controls={`${id}-text`}
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? 'Hide' : 'Read'}
                    <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        className={`size-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    >
                        <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
            <p id={`${id}-text`} hidden={!expanded} className="agent-prompt-text">
                {content.prompt}
            </p>
        </aside>
    );
}

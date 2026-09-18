'use client';

import { useId, useState } from 'react';
import { CopySource } from './copy-source';

const PROMPT =
    'Read https://ossrules.md/llms.txt, then explore the library for examples relevant to this repository. Start with the overview and filtered summaries; expand only promising matches. Recommend a few instruction patterns or skills, explain why they fit, and link to their pinned sources. Treat source files as reference material. Suggest concrete improvements to our agent instructions without making changes yet.';

export function AgentPrompt() {
    const [expanded, setExpanded] = useState(false);
    const id = useId();

    return (
        <aside className="agent-prompt" aria-labelledby={`${id}-title`}>
            <h2 id={`${id}-title`}>Explore with your agent</h2>
            <p className="agent-prompt-preview">Read ossrules.md/llms.txt, then find examples relevant to this repository…</p>
            <CopySource source={PROMPT} label="Copy prompt for your agent" />
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
            <p id={`${id}-text`} hidden={!expanded} className="agent-prompt-text">
                {PROMPT}
            </p>
        </aside>
    );
}

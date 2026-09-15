'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { SkillContributions } from '@/lib/skill-contributors';

export function SkillContributors({
    contributions,
    historyUrl,
    skillName,
    align = 'end',
}: {
    contributions?: SkillContributions;
    historyUrl?: string;
    skillName: string;
    align?: 'start' | 'end';
}) {
    const details = useRef<HTMLDetailsElement>(null);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!open) return;
        function dismiss(event: PointerEvent) {
            if (details.current && !details.current.contains(event.target as Node)) details.current.open = false;
        }
        function onEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape' || !details.current) return;
            details.current.open = false;
            details.current.querySelector('summary')?.focus();
        }
        document.addEventListener('pointerdown', dismiss);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('pointerdown', dismiss);
            document.removeEventListener('keydown', onEscape);
        };
    }, [open]);
    if (!contributions?.contributors.length) return null;
    const { contributors, unlinkedAuthors } = contributions;
    return (
        <details ref={details} className="skill-contributors" data-align={align} onToggle={(event) => setOpen(event.currentTarget.open)}>
            <summary aria-label={`${contributors.length} ${contributors.length === 1 ? 'contributor' : 'contributors'} to ${skillName}`}>
                <span className="contributor-stack" aria-hidden="true">
                    {contributors.slice(0, 3).map((person) => (
                        <Image
                            key={person.id}
                            src={`https://avatars.githubusercontent.com/u/${person.id}?s=64`}
                            alt=""
                            width={28}
                            height={28}
                            unoptimized
                        />
                    ))}
                </span>
                {contributors.length > 3 ? <span aria-hidden="true">+{contributors.length - 3}</span> : null}
            </summary>
            <div className="contributor-popover">
                <p className="eyebrow">Contributors</p>
                <ul className="contributor-list">
                    {contributors.map((person) => (
                        <li key={person.id}>
                            <a href={`https://github.com/${person.login}`} target="_blank" rel="noopener noreferrer">
                                <Image
                                    src={`https://avatars.githubusercontent.com/u/${person.id}?s=64`}
                                    alt=""
                                    width={28}
                                    height={28}
                                    unoptimized
                                />
                                <span>{person.login}</span>
                            </a>
                        </li>
                    ))}
                </ul>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                    GitHub-linked commit authors for this SKILL.md at the saved revision. Co-authors and history before file renames are not
                    included.
                    {unlinkedAuthors ? ' Some commit authors have no linked GitHub account.' : ''}
                </p>
                {historyUrl ? (
                    <a
                        href={historyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-teal text-xs hover:underline"
                    >
                        File history ↗
                    </a>
                ) : null}
            </div>
        </details>
    );
}

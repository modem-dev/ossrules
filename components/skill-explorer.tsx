'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export interface SkillEntry {
    id: string;
    href: string;
    name: string;
    description: string;
    path: string;
    files: number;
    complete: boolean;
    project: { slug: string; name: string; logo: string; repository: string };
}

export function SkillExplorer({ entries, projectOnly = false }: { entries: SkillEntry[]; projectOnly?: boolean }) {
    const [query, setQuery] = useState('');
    const [project, setProject] = useState('all');
    const [resources, setResources] = useState(false);
    const projects = [...new Map(entries.map((entry) => [entry.project.slug, entry.project])).values()].sort((a, b) =>
        a.name.localeCompare(b.name),
    );
    const visible = entries.filter(
        (entry) =>
            (project === 'all' || entry.project.slug === project) &&
            (!resources || entry.files > 1) &&
            `${entry.name} ${entry.description} ${entry.path} ${entry.project.name} ${entry.project.repository}`
                .toLowerCase()
                .includes(query.trim().toLowerCase()),
    );
    return (
        <div>
            <div className="directory-toolbar">
                <label className="directory-search">
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        aria-label="Search skills"
                        placeholder={projectOnly ? 'Search this project’s skills…' : 'Search skills, tasks, or projects…'}
                    />
                </label>
                {!projectOnly ? (
                    <label className="directory-filter">
                        <span className="sr-only">Filter by project</span>
                        <select value={project} onChange={(event) => setProject(event.target.value)}>
                            <option value="all">All projects</option>
                            {projects.map((item) => (
                                <option key={item.slug} value={item.slug}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}
                <label className="flex min-h-11 items-center gap-2 text-gray-550 text-xs">
                    <input
                        type="checkbox"
                        checked={resources}
                        onChange={(event) => setResources(event.target.checked)}
                        className="accent-teal"
                    />
                    With supporting files
                </label>
            </div>
            <p role="status" className="py-5 font-mono text-[11px] text-gray-600">
                {visible.length} {visible.length === 1 ? 'skill' : 'skills'}
                {visible.length !== entries.length ? ` of ${entries.length}` : ''}
            </p>
            {visible.length ? (
                <ul className="grid gap-x-10 md:grid-cols-2">
                    {visible.map((entry) => (
                        <li key={`${entry.project.slug}/${entry.id}`} className="skill-entry">
                            <Link href={entry.href} className="group block min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <h2 className="min-w-0 font-mono text-[15px] leading-relaxed tracking-tight [overflow-wrap:anywhere] group-hover:text-teal">
                                        {entry.name}
                                    </h2>
                                    <span aria-hidden className="text-teal">
                                        →
                                    </span>
                                </div>
                                <p className="mt-3 text-gray-500 text-sm leading-relaxed [overflow-wrap:anywhere]">{entry.description}</p>
                            </Link>
                            <p className="mt-3 break-all font-mono text-[10px] text-gray-600">{entry.path}</p>
                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-gray-600">
                                {!projectOnly ? (
                                    <Link
                                        href={`/${entry.project.slug}/skills`}
                                        className="inline-flex items-center gap-2 text-teal hover:underline"
                                    >
                                        <Image
                                            src={entry.project.logo}
                                            alt=""
                                            width={24}
                                            height={24}
                                            className="size-6 rounded bg-gray-800 object-cover"
                                        />
                                        {entry.project.name}
                                    </Link>
                                ) : null}
                                <span>
                                    {entry.files === 1 ? 'SKILL.md only' : `${entry.files} bundle files`}
                                    {!entry.complete ? ' · Partial bundle' : ''}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="py-12 text-center">
                    <h2 className="section-title">No matching skills</h2>
                    <p className="mt-3 text-gray-550 text-sm">Try another search or clear the filters.</p>
                    <button
                        type="button"
                        className="action-link mt-5"
                        onClick={() => {
                            setQuery('');
                            setProject('all');
                            setResources(false);
                        }}
                    >
                        Clear filters
                    </button>
                </div>
            )}
        </div>
    );
}

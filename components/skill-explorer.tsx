'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import type { SkillContributions } from '@/lib/skill-contributors';
import { SkillContributors } from './skill-contributors';

export interface SkillEntry {
    id: string;
    href: string;
    name: string;
    description: string;
    path: string;
    files: number;
    complete: boolean;
    contributions?: SkillContributions;
    historyUrl?: string;
    project: { slug: string; name: string; logo: string; repository: string };
}

export function SkillExplorer({ entries, projectOnly = false }: { entries: SkillEntry[]; projectOnly?: boolean }) {
    return (
        <Suspense fallback={<SkillExplorerContent entries={entries} projectOnly={projectOnly} />}>
            <SkillExplorerWithFilters entries={entries} projectOnly={projectOnly} />
        </Suspense>
    );
}

function SkillExplorerWithFilters({ entries, projectOnly }: { entries: SkillEntry[]; projectOnly: boolean }) {
    const params = useSearchParams();
    return (
        <SkillExplorerContent
            entries={entries}
            projectOnly={projectOnly}
            initialQuery={params.get('q') ?? ''}
            initialProject={projectOnly ? 'all' : (params.get('project') ?? 'all')}
            initialResources={params.get('resources') === '1'}
        />
    );
}

function SkillExplorerContent({
    entries,
    projectOnly = false,
    initialQuery = '',
    initialProject = 'all',
    initialResources = false,
}: {
    entries: SkillEntry[];
    projectOnly?: boolean;
    initialQuery?: string;
    initialProject?: string;
    initialResources?: boolean;
}) {
    const [query, setQuery] = useState(initialQuery);
    const [project, setProject] = useState(initialProject);
    const [resources, setResources] = useState(initialResources);
    function remember(key: string, value: string) {
        const url = new URL(window.location.href);
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
        window.history.replaceState(null, '', url);
    }
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
                        onChange={(event) => {
                            setQuery(event.target.value);
                            remember('q', event.target.value);
                        }}
                        aria-label="Search skills"
                        placeholder={projectOnly ? 'Search this project’s skills…' : 'Search skills, tasks, or projects…'}
                    />
                </label>
                {!projectOnly ? (
                    <label className="directory-filter">
                        <span className="sr-only">Filter by project</span>
                        <select
                            value={project}
                            onChange={(event) => {
                                setProject(event.target.value);
                                remember('project', event.target.value === 'all' ? '' : event.target.value);
                            }}
                        >
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
                        onChange={(event) => {
                            setResources(event.target.checked);
                            remember('resources', event.target.checked ? '1' : '');
                        }}
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
                                <p className="mt-3 line-clamp-3 text-gray-500 text-sm leading-relaxed [overflow-wrap:anywhere]">
                                    {entry.description}
                                </p>
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
                                {projectOnly ? (
                                    <span>
                                        {entry.files === 1 ? 'SKILL.md only' : `${entry.files} bundle files`}
                                        {!entry.complete ? ' · Partial bundle' : ''}
                                    </span>
                                ) : null}
                                <SkillContributors
                                    contributions={entry.contributions}
                                    historyUrl={entry.historyUrl}
                                    skillName={entry.name}
                                />
                            </div>
                            {!projectOnly ? (
                                <p className="mt-3 font-mono text-[11px] text-gray-600">
                                    {entry.files === 1 ? 'SKILL.md only' : `${entry.files} bundle files`}
                                    {!entry.complete ? ' · Partial bundle' : ''}
                                </p>
                            ) : null}
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
                            remember('q', '');
                            remember('project', '');
                            remember('resources', '');
                        }}
                    >
                        Clear filters
                    </button>
                </div>
            )}
        </div>
    );
}

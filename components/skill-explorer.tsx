'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import type { SkillContributions } from '@/lib/skill-contributors';
import { skillListing } from '@/lib/skill-list';
import { SKILL_TASKS, type SkillTask } from '@/lib/skill-tasks';
import { DirectorySelect } from './directory-select';
import { SkillContributors } from './skill-contributors';

export interface SkillEntry {
    id: string;
    href: string;
    name: string;
    tasks?: SkillTask[];
    description: string;
    path: string;
    files: number;
    complete: boolean;
    contributions?: SkillContributions;
    historyUrl?: string;
    project: { href: string; slug: string; name: string; logo: string; repository: string };
}

export function SkillExplorer({
    entries,
    projectOnly = false,
    initialSearch,
}: {
    entries: SkillEntry[];
    projectOnly?: boolean;
    initialSearch: string;
}) {
    // Both routes await searchParams, so the requested list is rendered on the server.
    // A full-list Suspense fallback would duplicate entries in the streamed HTML.
    const params = useSearchParams();
    return <SkillExplorerContent entries={entries} projectOnly={projectOnly} search={params?.toString() ?? initialSearch} />;
}

function SkillExplorerContent({
    entries,
    projectOnly = false,
    search = '',
}: {
    entries: SkillEntry[];
    projectOnly?: boolean;
    search?: string;
}) {
    const { query, project, resources, task, visible, pageCount, page, start, pageEntries } = skillListing(entries, search, projectOnly);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const filtersId = useId();
    const activeFilters = Number(project !== 'all' && !projectOnly) + Number(resources);
    const resultCount = `Showing ${visible.length ? `${start + 1}–${start + pageEntries.length} of ` : ''}${visible.length} ${visible.length === 1 ? 'skill' : 'skills'}`;
    const taskSearch = new URLSearchParams(search);
    taskSearch.delete('task');
    taskSearch.delete('page');
    const taskEntries = skillListing(entries, taskSearch.toString(), projectOnly).visible;
    const taskCounts = new Map(SKILL_TASKS.map(({ id }) => [id, taskEntries.filter((entry) => entry.tasks?.includes(id)).length]));
    const resultsRef = useRef<HTMLDivElement>(null);
    function remember(values: Record<string, string>) {
        const url = new URL(window.location.href);
        for (const [key, value] of Object.entries(values)) {
            if (value) url.searchParams.set(key, value);
            else url.searchParams.delete(key);
        }
        url.searchParams.delete('page');
        window.history.replaceState(null, '', url);
    }
    const projects = [...new Map(entries.map((entry) => [entry.project.slug, entry.project])).values()].sort((a, b) =>
        a.name.localeCompare(b.name),
    );

    function pagination() {
        if (pageCount <= 1) return null;
        return (
            <nav aria-label="Skills pagination" className="flex items-center gap-3 font-mono text-[11px]">
                {[-1, 1].map((direction) => {
                    const nextPage = page + direction;
                    const disabled = nextPage < 1 || nextPage > pageCount;
                    const nextParams = new URLSearchParams(search);
                    if (nextPage === 1) nextParams.delete('page');
                    else nextParams.set('page', String(nextPage));
                    const href = `?${nextParams.toString()}`;
                    const label = direction === -1 ? '← Previous' : 'Next →';
                    return (
                        <span key={direction} className="contents">
                            {direction === 1 ? (
                                <span className="whitespace-nowrap text-gray-600">
                                    Page {page} of {pageCount}
                                </span>
                            ) : null}
                            {disabled ? (
                                <span aria-disabled="true" className="inline-flex min-h-11 items-center px-2 text-gray-650">
                                    {label}
                                </span>
                            ) : (
                                <a
                                    href={href}
                                    rel={direction === -1 ? 'prev' : 'next'}
                                    className="inline-flex min-h-11 items-center px-2 text-teal hover:underline"
                                    onClick={(event) => {
                                        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                                        event.preventDefault();
                                        window.history.pushState(null, '', href);
                                        resultsRef.current?.focus({ preventScroll: true });
                                        resultsRef.current?.scrollIntoView({ block: 'start' });
                                    }}
                                >
                                    {label}
                                </a>
                            )}
                        </span>
                    );
                })}
            </nav>
        );
    }
    return (
        <div>
            <div className={`directory-toolbar skill-directory-toolbar ${projectOnly ? 'skill-directory-project' : ''}`}>
                <label className="directory-search">
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-4 shrink-0 text-gray-600">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => {
                            remember({ q: event.target.value });
                        }}
                        aria-label="Search skills"
                        placeholder={projectOnly ? 'Search this project’s skills…' : 'Search skills, tasks, or projects…'}
                    />
                </label>
                <div className="directory-mobile-summary">
                    <p role="status" className="font-mono text-[11px] text-gray-600">
                        {resultCount}
                    </p>
                    <button
                        type="button"
                        aria-expanded={filtersOpen}
                        aria-controls={filtersId}
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        className="inline-flex min-h-11 items-center gap-2 text-xs text-teal"
                    >
                        Filters{activeFilters ? ` (${activeFilters})` : ''}
                        <span aria-hidden>{filtersOpen ? '−' : '+'}</span>
                    </button>
                </div>
                <div id={filtersId} className="directory-filter-controls" data-open={filtersOpen}>
                    {!projectOnly ? (
                        <DirectorySelect
                            label="Filter by project"
                            value={project}
                            active={project !== 'all'}
                            onValueChange={(value) => remember({ project: value === 'all' ? '' : value })}
                            options={[
                                { value: 'all', label: 'All projects' },
                                ...projects.map((item) => ({ value: item.slug, label: item.name, logo: item.logo })),
                            ]}
                        />
                    ) : null}
                    <label className="skill-resource-filter">
                        <input
                            type="checkbox"
                            checked={resources}
                            onChange={(event) => {
                                remember({ resources: event.target.checked ? '1' : '' });
                            }}
                            className="accent-teal"
                        />
                        With supporting files
                    </label>
                </div>
            </div>
            <nav aria-label="Browse by task" className="skill-task-pills">
                {[{ id: '', label: 'All skills' }, ...SKILL_TASKS].map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        aria-pressed={task === item.id}
                        onClick={() => remember({ task: item.id })}
                        className={`inline-flex shrink-0 min-h-9 items-center gap-2 whitespace-nowrap rounded border px-3 py-1.5 text-xs ${task === item.id ? 'border-teal bg-dark-teal text-teal' : 'border-gray-750 text-gray-550 hover:border-teal hover:text-teal'}`}
                    >
                        {item.label}
                        <span className="font-mono text-[11px]">{item.id ? taskCounts.get(item.id as SkillTask) : taskEntries.length}</span>
                    </button>
                ))}
            </nav>
            <div
                ref={resultsRef}
                tabIndex={-1}
                className="skill-results-summary flex scroll-mt-6 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-4"
            >
                {pagination()}
                <p role="status" className="directory-desktop-summary ml-auto font-mono text-[11px] text-gray-600">
                    {resultCount}
                </p>
            </div>
            {visible.length ? (
                <ul className="grid gap-4 md:grid-cols-2">
                    {pageEntries.map((entry) => (
                        <li key={`${entry.project.slug}/${entry.id}`} className="skill-entry">
                            <Link href={entry.href} className="group block min-w-0 flex-1">
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
                            <p className="mt-3 mb-4 break-all font-mono text-[11px] text-gray-600">{entry.path}</p>
                            {entry.tasks?.length ? (
                                <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1">
                                    {entry.tasks.slice(0, 2).map((id) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => remember({ task: id })}
                                            className="min-h-8 text-[11px] text-teal hover:underline"
                                        >
                                            {SKILL_TASKS.find((item) => item.id === id)?.label}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                            <div className="skill-entry-footer">
                                <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-gray-600">
                                    {!projectOnly ? (
                                        <Link
                                            href={entry.project.href}
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
                                    {projectOnly && !entry.complete ? <span>Incomplete bundle</span> : null}
                                    <SkillContributors
                                        contributions={entry.contributions}
                                        historyUrl={entry.historyUrl}
                                        skillName={entry.name}
                                    />
                                </div>
                                {!projectOnly && !entry.complete ? (
                                    <p className="mt-3 font-mono text-[11px] text-gray-600">Incomplete bundle</p>
                                ) : null}
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
                            remember({ q: '', project: '', resources: '', task: '' });
                        }}
                    >
                        Clear filters
                    </button>
                </div>
            )}
            {pageCount > 1 ? <div className="mt-6 flex justify-center">{pagination()}</div> : null}
        </div>
    );
}

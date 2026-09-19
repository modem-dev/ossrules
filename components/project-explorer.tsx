'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useId, useMemo, useState } from 'react';
import { projectListing, withProjectSearch } from '@/lib/project-list';
import { projectHref } from '@/lib/project-paths';
import type { ProjectListingEntry, SortId } from './agents-md-data';
import { formatStars, languageColor, languageFacets, logoSrc, patternFacets, SORTS } from './agents-md-data';
import { DirectorySelect } from './directory-select';

const ALL = 'all';

function ProjectEntry({ project, search }: { project: ProjectListingEntry; search: string }) {
    return (
        <li className="min-w-0 border-gray-750 border-b">
            <Link href={withProjectSearch(projectHref(project), search)} className="project-entry group">
                <Image src={logoSrc(project)} alt="" width={44} height={44} className="size-11 rounded-lg bg-gray-800 object-cover" />
                <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-mono font-medium text-lg tracking-tight transition-colors group-hover:text-teal">
                            {project.name}
                        </h2>
                        <span aria-hidden className="text-gray-650 transition-colors group-hover:text-teal">
                            ↗
                        </span>
                    </div>
                    <p className="mt-1 break-all font-mono text-[11px] text-gray-600">
                        {project.owner}/{project.repo}
                    </p>
                    <p className="mt-3 text-[14px] text-gray-500 leading-relaxed">{project.hook}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-gray-550">
                        <span className="inline-flex items-center gap-1.5">
                            <span
                                aria-hidden
                                className="size-1.5 rounded-full"
                                style={{ backgroundColor: languageColor(project.language) }}
                            />
                            {project.language}
                        </span>
                        <span>{formatStars(project.stars)} stars</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <span
                            className={`rounded px-2.5 py-1 ${project.skillCount ? 'bg-dark-teal text-teal' : 'bg-gray-850 text-gray-550'}`}
                            title="Skills in the stored project snapshot, excluding supporting files."
                        >
                            {project.skillCount === undefined
                                ? 'Skills not scanned'
                                : `${project.skillCount.toLocaleString('en')} ${project.skillCount === 1 ? 'skill' : 'skills'}`}
                        </span>
                        <span className="inline-flex flex-wrap items-center gap-x-2 rounded bg-gray-850 px-2.5 py-1 text-light-cream [overflow-wrap:anywhere]">
                            <span>{project.instructionFile ?? 'AGENTS.md'}</span>
                            <span className="text-gray-550">{project.file.lines.toLocaleString('en')} lines</span>
                        </span>
                    </div>
                </div>
            </Link>
        </li>
    );
}

/** URL state is shared by initial HTML, reloads, and browser history. */
export function ProjectExplorer({ projects, initialSearch }: { projects: ProjectListingEntry[]; initialSearch: string }) {
    const searchParams = useSearchParams();
    return <ProjectExplorerContent projects={projects} search={searchParams?.toString() ?? initialSearch} />;
}

export function ProjectExplorerContent({ projects, search = '' }: { projects: ProjectListingEntry[]; search?: string }) {
    const { query, language, pattern, sort, descending, visible, filtered, canonicalSearch } = useMemo(
        () => projectListing(projects, search),
        [projects, search],
    );
    const [filtersOpen, setFiltersOpen] = useState(false);
    const filtersId = useId();
    const activeFilters = Number(language !== ALL) + Number(pattern !== ALL);
    const resultCount = `Showing ${visible.length} ${visible.length === 1 ? 'project' : 'projects'}${filtered ? ` of ${projects.length}` : ''}`;
    const languages = useMemo(() => languageFacets(projects), [projects]);
    const patterns = useMemo(() => patternFacets(projects), [projects]);

    function remember(changes: Record<string, string>, replace = false) {
        const url = new URL(window.location.href);
        for (const [key, value] of Object.entries(changes)) {
            if (value && value !== ALL) url.searchParams.set(key, value);
            else url.searchParams.delete(key);
        }
        if (replace) window.history.replaceState(null, '', url);
        else window.history.pushState(null, '', url);
    }

    function clearFilters() {
        remember({ q: '', language: '', technique: '' });
    }

    return (
        <div>
            <div className="directory-toolbar">
                <label className="directory-search">
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-4 shrink-0 text-gray-600">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => remember({ q: event.target.value }, true)}
                        placeholder="Search projects…"
                        aria-label="Search projects"
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
                        Filter &amp; sort{activeFilters ? ` (${activeFilters})` : ''}
                        <span aria-hidden>{filtersOpen ? '−' : '+'}</span>
                    </button>
                </div>
                <div id={filtersId} className="directory-filter-controls" data-open={filtersOpen}>
                    <DirectorySelect
                        label="Language"
                        value={language}
                        onValueChange={(value) => remember({ language: value })}
                        active={language !== ALL}
                        options={[
                            { value: ALL, label: 'All languages' },
                            ...languages.map((item) => ({
                                value: item.value,
                                label: item.value,
                                count: item.count,
                                color: languageColor(item.value),
                            })),
                        ]}
                    />
                    <DirectorySelect
                        label="Pattern"
                        value={pattern}
                        onValueChange={(value) => remember({ technique: value })}
                        active={pattern !== ALL}
                        options={[
                            { value: ALL, label: 'All patterns' },
                            ...patterns.map((item) => ({ value: item.id, label: item.name, count: item.count, pattern: item.id })),
                        ]}
                    />
                    <div className="directory-sort">
                        <DirectorySelect
                            label="Sort projects"
                            value={sort}
                            prefix="Sort: "
                            onValueChange={(value) => {
                                const next = value as SortId;
                                remember({ sort: next, direction: '' });
                            }}
                            options={SORTS.map((option) => ({ value: option.id, label: option.label }))}
                        />
                        <button
                            type="button"
                            className="sort-direction"
                            onClick={() => remember({ direction: descending ? 'asc' : 'desc' })}
                            aria-label={descending ? 'Sort ascending' : 'Sort descending'}
                            title={descending ? 'Descending; switch to ascending' : 'Ascending; switch to descending'}
                        >
                            <span aria-hidden>{descending ? '↓' : '↑'}</span>
                        </button>
                    </div>
                </div>
            </div>
            {filtered ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-xs">
                    <button type="button" onClick={clearFilters} className="ml-auto min-h-8 text-teal hover:underline">
                        Clear filters ×
                    </button>
                </div>
            ) : null}
            <div className="directory-desktop-summary flex flex-wrap items-center justify-end gap-3 py-4 font-mono text-[11px] text-gray-600">
                <p role="status">{resultCount}</p>
            </div>
            {visible.length === 0 ? (
                <div className="rounded-lg border border-gray-750 bg-medium-gray px-6 py-12 text-center">
                    <h2 className="section-title">No projects found</h2>
                    <p className="mt-3 text-gray-550 text-sm">Try a different search or remove a filter.</p>
                    <button type="button" onClick={clearFilters} className="action-link mt-5">
                        Clear filters
                    </button>
                </div>
            ) : (
                <ul className="grid gap-x-10 md:grid-cols-2">
                    {visible.map((project) => (
                        <ProjectEntry key={project.slug} project={project} search={canonicalSearch} />
                    ))}
                </ul>
            )}
        </div>
    );
}

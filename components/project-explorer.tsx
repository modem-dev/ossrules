'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { AgentsProject, PatternId, SortId } from './agents-md-data';
import {
    compareProjects,
    formatStars,
    languageColor,
    languageFacets,
    logoSrc,
    matchesQuery,
    PATTERNS_BY_ID,
    patternFacets,
    SORTS,
    STATS_AS_OF,
} from './agents-md-data';
import { RelativeTime } from './last-updated';

const ALL = 'all';

function ProjectEntry({ project }: { project: AgentsProject }) {
    return (
        <li className="min-w-0">
            <Link href={`/${project.slug}`} className="project-entry group">
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
                        <span>{project.file.lines.toLocaleString()} lines</span>
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
                    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-teal">
                        {project.patterns.slice(0, 2).map((pattern) => (
                            <span key={pattern}>{PATTERNS_BY_ID[pattern].name}</span>
                        ))}
                        {project.patterns.length > 2 ? (
                            <span>
                                +{project.patterns.length - 2}
                                <span className="sr-only"> more {project.patterns.length === 3 ? 'technique' : 'techniques'}</span>
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-3 text-[11px] text-gray-600">
                        File changed <RelativeTime iso={project.lastCommit.date} />
                    </p>
                </div>
            </Link>
        </li>
    );
}

/** Search parameters let technique pages link directly to the matching collection. */
export function ProjectExplorer({ projects }: { projects: AgentsProject[] }) {
    const searchParams = useSearchParams();
    const requested = searchParams.get('technique');
    const initialPattern = requested && Object.hasOwn(PATTERNS_BY_ID, requested) ? (requested as PatternId) : ALL;
    return <ProjectExplorerContent key={initialPattern} projects={projects} initialPattern={initialPattern} />;
}

/** Also prerendered as the Suspense fallback, so the full directory is present without JavaScript. */
export function ProjectExplorerContent({
    projects,
    initialPattern = ALL,
}: {
    projects: AgentsProject[];
    initialPattern?: PatternId | typeof ALL;
}) {
    const [query, setQuery] = useState('');
    const [language, setLanguage] = useState(ALL);
    const [pattern, setPattern] = useState<PatternId | typeof ALL>(initialPattern);
    const [sort, setSort] = useState<SortId>('stars');
    const [descending, setDescending] = useState(true);
    const languages = useMemo(() => languageFacets(projects), [projects]);
    const patterns = useMemo(() => patternFacets(projects), [projects]);
    const visible = useMemo(
        () =>
            projects
                .filter((project) => matchesQuery(project, query))
                .filter((project) => language === ALL || project.language === language)
                .filter((project) => pattern === ALL || project.patterns.includes(pattern))
                .sort((a, b) => compareProjects(a, b, sort, descending)),
        [projects, query, language, pattern, sort, descending],
    );
    const filtered = query !== '' || language !== ALL || pattern !== ALL;

    function clearFilters() {
        setQuery('');
        setLanguage(ALL);
        setPattern(ALL);
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
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search projects…"
                        aria-label="Search projects"
                    />
                </label>
                <label className="directory-filter">
                    <span className="sr-only">Language</span>
                    <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                        <option value={ALL}>All languages</option>
                        {languages.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.value} ({item.count})
                            </option>
                        ))}
                    </select>
                </label>
                <label className="directory-filter">
                    <span className="sr-only">Technique</span>
                    <select value={pattern} onChange={(event) => setPattern(event.target.value as PatternId | typeof ALL)}>
                        <option value={ALL}>All techniques</option>
                        {patterns.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name} ({item.count})
                            </option>
                        ))}
                    </select>
                </label>
                <div className="directory-sort">
                    <label className="directory-filter">
                        <span className="sr-only">Sort projects</span>
                        <select
                            value={sort}
                            onChange={(event) => {
                                const next = event.target.value as SortId;
                                setSort(next);
                                setDescending(next !== 'name' && next !== 'lines');
                            }}
                        >
                            {SORTS.map((option) => (
                                <option key={option.id} value={option.id}>
                                    Sort: {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        className="sort-direction"
                        onClick={() => setDescending((value) => !value)}
                        aria-label={descending ? 'Sort ascending' : 'Sort descending'}
                        title={descending ? 'Descending; switch to ascending' : 'Ascending; switch to descending'}
                    >
                        <span aria-hidden>{descending ? '↓' : '↑'}</span>
                    </button>
                </div>
            </div>
            {filtered ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-xs">
                    <span className="text-gray-550">Showing</span>
                    {query ? <span>“{query}”</span> : null}
                    {language !== ALL ? <span>{language}</span> : null}
                    {pattern !== ALL ? <span>{PATTERNS_BY_ID[pattern].name}</span> : null}
                    <button type="button" onClick={clearFilters} className="ml-auto min-h-8 text-teal hover:underline">
                        Clear filters ×
                    </button>
                </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 py-5 font-mono text-[11px] text-gray-600">
                <p role="status">
                    {visible.length} {visible.length === 1 ? 'project' : 'projects'}
                    {filtered ? ` of ${projects.length}` : ''}
                </p>
                <p>Star snapshot · {STATS_AS_OF}</p>
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
                        <ProjectEntry key={project.slug} project={project} />
                    ))}
                </ul>
            )}
        </div>
    );
}

'use client';

/**
 * The browsable index of AGENTS.md files.
 *
 * Built for a corpus that grows: every facet is derived from the entries, rows
 * are dense enough to scan a hundred of them, and nothing in here needs editing
 * to add a project. Filter and sort state is local component state rather than
 * URL state; the page has no server-side pagination to keep in sync, and the
 * site carries no query-state library today.
 */

import Image from 'next/image';
import Link from 'next/link';
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
} from './agents-md-data';
import { RelativeTime } from './last-updated';

const ALL = 'all';

/** Shared chip styling for the filter rows and the sort row. */
function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1.5 font-inter text-xs leading-none transition-colors ${
                active
                    ? 'border-teal/70 bg-dark-teal/40 text-teal'
                    : 'border-gray-750 bg-transparent text-gray-550 hover:border-gray-650 hover:text-light-cream/80'
            }`}
        >
            {children}
        </button>
    );
}

function LanguageDot({ language }: { language: string }) {
    return (
        <span className="inline-flex items-center" title={language}>
            <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: languageColor(language) }} />
            <span className="sr-only">{language}</span>
        </span>
    );
}

function ProjectRow({ project }: { project: AgentsProject }) {
    return (
        <li>
            <Link
                href={`/agents-md/${project.slug}`}
                className="group grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-gray-750/50 px-2 py-5 transition-colors hover:bg-medium-gray/40 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-baseline"
            >
                <Image
                    src={logoSrc(project)}
                    alt=""
                    width={40}
                    height={40}
                    className="row-span-2 size-10 rounded-md bg-gray-800 object-cover sm:row-span-1 sm:self-center"
                />

                <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="font-unit-medium text-lg text-light-cream leading-snug transition-colors group-hover:text-teal">
                            {project.name}
                        </span>
                        <span className="font-mono text-xs text-gray-600">
                            {project.owner}/{project.repo}
                        </span>
                    </div>
                    <p className="mt-1 font-roboto text-[15px] text-light-cream/75 leading-relaxed">{project.hook}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {project.patterns.map((pattern) => (
                            <span
                                key={pattern}
                                className="rounded-full border border-gray-750 px-2 py-0.5 font-inter text-[11px] leading-tight text-gray-550"
                            >
                                {PATTERNS_BY_ID[pattern].name}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-gray-550 tabular-nums sm:col-start-3 sm:flex-nowrap sm:justify-end sm:gap-5">
                    <span className="flex sm:w-6 sm:justify-end">
                        <LanguageDot language={project.language} />
                    </span>
                    <span className="sm:w-14 sm:text-right">{formatStars(project.stars)}</span>
                    <span className="sm:w-12 sm:text-right">{project.file.lines}</span>
                    <span className="sm:w-16 sm:text-right">
                        <RelativeTime iso={project.lastCommit.date} />
                    </span>
                </div>
            </Link>
        </li>
    );
}

export function ProjectExplorer({ projects }: { projects: AgentsProject[] }) {
    const [query, setQuery] = useState('');
    const [language, setLanguage] = useState<string>(ALL);
    const [pattern, setPattern] = useState<PatternId | typeof ALL>(ALL);
    const [sort, setSort] = useState<SortId>('stars');
    const [descending, setDescending] = useState(true);

    const languages = useMemo(() => languageFacets(projects), [projects]);
    const patterns = useMemo(() => patternFacets(projects), [projects]);

    const visible = useMemo(() => {
        return projects
            .filter((project) => matchesQuery(project, query))
            .filter((project) => language === ALL || project.language === language)
            .filter((project) => pattern === ALL || project.patterns.includes(pattern))
            .sort((a, b) => compareProjects(a, b, sort, descending));
    }, [projects, query, language, pattern, sort, descending]);

    const filtered = visible.length !== projects.length;

    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-gray-750/50 pb-5">
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search projects"
                        aria-label="Search projects"
                        className="h-9 w-full min-w-0 rounded-md border border-gray-750 bg-gray-850/60 px-3 font-inter text-sm text-light-cream placeholder:text-gray-600 focus:border-teal/70 focus:outline-none sm:w-64"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-inter text-xs text-gray-600">Sort</span>
                        {SORTS.map((option) => (
                            <Chip
                                key={option.id}
                                active={sort === option.id}
                                onClick={() => {
                                    // Re-picking the active column flips direction; a new
                                    // column starts on its own sensible default.
                                    if (sort === option.id) {
                                        setDescending((value) => !value);
                                        return;
                                    }
                                    setSort(option.id);
                                    setDescending(option.id !== 'name');
                                }}
                            >
                                {option.label}
                                {sort === option.id ? <span aria-hidden> {descending ? '↓' : '↑'}</span> : null}
                            </Chip>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-inter text-xs text-gray-600">Language</span>
                    <Chip active={language === ALL} onClick={() => setLanguage(ALL)}>
                        All
                    </Chip>
                    {languages.map((item) => (
                        <Chip key={item.value} active={language === item.value} onClick={() => setLanguage(item.value)}>
                            <span className="inline-flex items-center gap-1.5">
                                <span
                                    aria-hidden
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: languageColor(item.value) }}
                                />
                                {item.value} <span className="text-gray-600">{item.count}</span>
                            </span>
                        </Chip>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-inter text-xs text-gray-600">Technique</span>
                    <Chip active={pattern === ALL} onClick={() => setPattern(ALL)}>
                        All
                    </Chip>
                    {patterns.map((item) => (
                        <Chip key={item.id} active={pattern === item.id} onClick={() => setPattern(item.id)}>
                            {item.name} <span className="text-gray-600">{item.count}</span>
                        </Chip>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between py-3">
                <p className="font-inter text-xs text-gray-550">
                    {visible.length} {visible.length === 1 ? 'project' : 'projects'}
                    {filtered ? ` of ${projects.length}` : ''}
                </p>
                {filtered ? (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setLanguage(ALL);
                            setPattern(ALL);
                        }}
                        className="font-inter text-xs text-teal hover:underline"
                    >
                        Clear filters
                    </button>
                ) : null}
            </div>

            <div
                aria-hidden
                className="hidden border-y border-gray-750/50 px-2 py-2 font-inter text-[11px] uppercase tracking-wider text-gray-600 sm:grid sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:gap-x-4"
            >
                <span />
                <span>Project</span>
                <span className="flex gap-5">
                    <span className="w-6 text-right">Lang</span>
                    <span className="w-14 text-right">Stars</span>
                    <span className="w-12 text-right">Lines</span>
                    <span className="w-16 text-right">Updated</span>
                </span>
            </div>

            {visible.length === 0 ? (
                <p className="border-t border-gray-750/50 py-16 text-center font-roboto text-base text-gray-550">
                    Nothing matches those filters.
                </p>
            ) : (
                <ul>
                    {visible.map((project) => (
                        <ProjectRow key={project.slug} project={project} />
                    ))}
                </ul>
            )}
        </div>
    );
}

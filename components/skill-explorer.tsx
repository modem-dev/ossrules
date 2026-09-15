'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef } from 'react';
import type { SkillContributions } from '@/lib/skill-contributors';
import { skillListing } from '@/lib/skill-list';
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
    const { query, project, resources, visible, pageCount, page, start, pageEntries } = skillListing(entries, search, projectOnly);
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
            <div className="directory-toolbar">
                <label className="directory-search">
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
                {!projectOnly ? (
                    <label className="directory-filter">
                        <span className="sr-only">Filter by project</span>
                        <select
                            value={project}
                            onChange={(event) => {
                                remember({ project: event.target.value === 'all' ? '' : event.target.value });
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
                            remember({ resources: event.target.checked ? '1' : '' });
                        }}
                        className="accent-teal"
                    />
                    With supporting files
                </label>
            </div>
            <div ref={resultsRef} tabIndex={-1} className="flex scroll-mt-6 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-4">
                <p role="status" className="font-mono text-[11px] text-gray-600">
                    {visible.length ? `${start + 1}–${start + pageEntries.length} of ` : ''}
                    {visible.length} {visible.length === 1 ? 'skill' : 'skills'}
                    {visible.length !== entries.length ? ` · ${entries.length} total` : ''}
                </p>
                {pagination()}
            </div>
            {visible.length ? (
                <ul className="grid gap-x-10 md:grid-cols-2">
                    {pageEntries.map((entry) => (
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
                                    <Link href={entry.project.href} className="inline-flex items-center gap-2 text-teal hover:underline">
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
                            remember({ q: '', project: '', resources: '' });
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

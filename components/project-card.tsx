/**
 * One project in the /agents-md list.
 *
 * The card carries the three things that let someone skip a file they do not
 * need: what the project is, how big the file is, and the one thing it does
 * that the others do not.
 */

import Link from 'next/link';
import type { AgentsProject } from './agents-md-data';
import { formatStars } from './agents-md-data';
import { LineBar, PatternBadge } from './primitives';

export function ProjectCard({ project }: { project: AgentsProject }) {
    return (
        <li>
            <Link
                href={`/agents-md/${project.slug}`}
                className="group block rounded-xl border border-gray-750/70 bg-medium-gray/30 p-5 transition-colors hover:border-dark-teal/70 hover:bg-medium-gray/50 sm:p-6"
            >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-unit-medium text-xl text-light-cream leading-snug transition-colors group-hover:text-teal">
                        {project.name}
                    </h3>
                    <span className="font-mono text-xs text-gray-600">
                        {project.owner}/{project.repo}
                    </span>
                </div>

                <p className="mt-1.5 font-roboto text-[15px] text-light-cream/70 leading-relaxed">{project.tagline}</p>

                <p className="mt-3 font-roboto text-[15px] text-light-cream/90 leading-relaxed">{project.hook}</p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-inter text-xs text-gray-550">
                    <span className="tabular-nums">{formatStars(project.stars)} stars</span>
                    <span aria-hidden className="text-gray-750">
                        /
                    </span>
                    <span>{project.language}</span>
                    <span aria-hidden className="text-gray-750">
                        /
                    </span>
                    <span className="tabular-nums">{(project.file.bytes / 1024).toFixed(1)}kB AGENTS.md</span>
                </div>

                <div className="mt-3">
                    <LineBar lines={project.file.lines} />
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.patterns.map((pattern) => (
                        <PatternBadge key={pattern} pattern={pattern} />
                    ))}
                </div>
            </Link>
        </li>
    );
}

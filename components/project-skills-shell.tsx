import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { type AgentsProject, logoSrc, repoUrl } from './agents-md-data';
import { ProjectTabs } from './project-tabs';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function ProjectSkillsShell({ project, count, children }: { project: AgentsProject; count?: number; children: ReactNode }) {
    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <SiteHeader />
            <main id="main" className="page-shell flex-1">
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-gray-600">
                    <Link href="/" className="text-teal hover:underline">
                        Projects
                    </Link>
                    <span aria-hidden>/</span>
                    <a href={repoUrl(project)} target="_blank" rel="noopener noreferrer" className="break-all hover:text-teal">
                        {project.owner}/{project.repo} ↗
                    </a>
                </nav>
                <header className="project-heading">
                    <div className="min-w-0">
                        <div className="flex items-center gap-4">
                            <Image
                                src={logoSrc(project)}
                                alt=""
                                width={56}
                                height={56}
                                className="size-14 shrink-0 rounded-xl bg-gray-800 object-cover"
                            />
                            <h1 className="page-title">{project.name}</h1>
                        </div>
                        <p className="mt-4 max-w-2xl text-gray-550 text-sm leading-relaxed">{project.tagline}</p>
                    </div>
                </header>
                <ProjectTabs slug={project.slug} skills={count} active="skills" />
                {children}
                <section className="mt-16 border-gray-750 border-t pt-10">
                    <h2 className="section-title">Context your instructions cannot carry</h2>
                    <p className="prose-copy mt-3 max-w-3xl">
                        Instructions describe how a codebase works. Modem keeps customer context current and attaches it to the work.
                    </p>
                    <a href="https://modem.dev" target="_blank" rel="noopener noreferrer" className="action-link action-primary mt-6">
                        Try Modem <span aria-hidden>↗</span>
                    </a>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}

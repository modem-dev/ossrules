import Link from 'next/link';
import type { ReactNode } from 'react';
import { type AgentsProject, repoUrl } from './agents-md-data';
import { ModemSponsor } from './modem-sponsor';
import { ProjectTabs } from './project-tabs';
import { ProjectTitle } from './project-title';
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
                    <ProjectTitle project={project} section="Agent Skills" />
                </header>
                <ProjectTabs project={project} skills={count} active="skills" />
                {children}
                <ModemSponsor>
                    Instructions describe how a codebase works. Modem keeps customer context current and attaches it to the work.
                </ModemSponsor>
            </main>
            <SiteFooter />
        </div>
    );
}

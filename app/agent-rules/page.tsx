import Image from 'next/image';
import Link from 'next/link';
import { AgentPrompt } from '@/components/agent-prompt';
import { logoSrc, PATTERNS } from '@/components/agents-md-data';
import { JsonLd } from '@/components/json-ld';
import { PatternIcon } from '@/components/pattern-icons';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getAgentsProjects, projectsWithPattern } from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { collectionPageSchema } from '@/lib/schema';

const title = 'Rule Patterns';
const description = 'Recurring patterns from AGENTS.md and CLAUDE.md files, with examples from the projects that use them.';

export const metadata = {
    title,
    description,
    alternates: { canonical: '/agent-rules' },
    openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl('Rule Patterns'), width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl('Rule Patterns')],
    },
};

export default function PatternsPage() {
    const projects = getAgentsProjects();

    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <JsonLd
                data={collectionPageSchema({
                    title,
                    description,
                    path: '/agent-rules',
                    items: PATTERNS.map((pattern) => ({ name: pattern.name, path: `/agent-rules/${pattern.id}` })),
                })}
            />
            <SiteHeader />

            <main id="main" className="page-shell flex-1">
                <header className="prompt-masthead brand-masthead modem-surface">
                    <p className="eyebrow">{PATTERNS.length} patterns</p>
                    <h1 className="page-title mt-5">Agent rule patterns from real projects.</h1>
                    <p className="mt-5 max-w-2xl text-gray-550 text-base leading-relaxed">See how each pattern works in practice.</p>
                    <AgentPrompt variant="rules" />
                </header>

                <details className="pattern-jump mt-8">
                    <summary className="text-gray-550 text-sm">Jump to a pattern</summary>
                    <nav aria-label="Patterns" className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {PATTERNS.map((pattern) => (
                            <a
                                key={pattern.id}
                                href={`#${pattern.id}`}
                                className="flex items-center gap-2 py-2 text-gray-500 text-xs hover:text-teal"
                            >
                                <PatternIcon pattern={pattern.id} className="size-4" />
                                {pattern.name} <span aria-hidden>↗</span>
                            </a>
                        ))}
                    </nav>
                </details>

                <div className="mt-8 grid items-start gap-5 md:grid-cols-2">
                    {PATTERNS.map((pattern, index) => {
                        const used = projectsWithPattern(pattern.id);
                        return (
                            <Link
                                key={pattern.id}
                                id={pattern.id}
                                href={`/agent-rules/${pattern.id}`}
                                aria-labelledby={`${pattern.id}-title`}
                                className="pattern-card group block transition-colors hover:border-teal"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-gray-600">
                                    <span className="inline-flex items-center gap-2 text-teal">
                                        <PatternIcon pattern={pattern.id} className="size-4" />
                                        {String(index + 1).padStart(2, '0')} / PATTERN
                                    </span>
                                    <span>
                                        {used.length} of {projects.length} projects
                                    </span>
                                </div>
                                <h2 id={`${pattern.id}-title`} className="section-title mt-5 group-hover:text-teal">
                                    {pattern.name}
                                </h2>
                                <p className="mt-3 text-gray-500 text-sm leading-relaxed">{pattern.summary}</p>
                                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                    <ul className="flex gap-1.5" aria-label="Example projects">
                                        {used.slice(0, 5).map((project) => (
                                            <li key={project.slug}>
                                                <Image
                                                    src={logoSrc(project)}
                                                    alt={project.name}
                                                    title={project.name}
                                                    width={28}
                                                    height={28}
                                                    className="size-7 rounded-md bg-gray-800 object-cover"
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                    <span className="inline-flex min-h-9 items-center text-teal text-xs group-hover:underline">
                                        Read pattern & examples
                                        <span aria-hidden className="ml-1.5">
                                            →
                                        </span>
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
                <p className="mt-8 font-mono text-[11px] text-gray-600">
                    Ordered roughly from easiest to adopt to more specialized patterns.
                </p>
            </main>

            <SiteFooter />
        </div>
    );
}

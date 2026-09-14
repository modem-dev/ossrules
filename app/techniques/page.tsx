import Image from 'next/image';
import Link from 'next/link';
import { formatStars, logoSrc, PATTERNS } from '@/components/agents-md-data';
import CTAButton from '@/components/cta-button';
import { JsonLd } from '@/components/json-ld';
import { PatternBackground } from '@/components/pattern-background';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TechniqueIcon } from '@/components/technique-icons';
import { getAgentsProjects, projectsWithPattern } from '@/lib/agents-md';
import { ogImageUrl } from '@/lib/og';
import { collectionPageSchema } from '@/lib/schema';

const title = 'AGENTS.md techniques | Modem';
const description =
    'The techniques that recur across AGENTS.md files: hard prohibitions, router files, verification by change type, ratchets, scope layering, and more, with the projects that use each one.';

export const metadata = {
    title,
    description,
    alternates: { canonical: '/techniques' },
    openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl('AGENTS.md techniques'), width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl('AGENTS.md techniques')],
    },
};

export default function TechniquesPage() {
    const projects = getAgentsProjects();

    return (
        <div className="min-h-screen bg-dark-gray flex flex-col">
            <JsonLd
                data={collectionPageSchema({
                    title,
                    description,
                    path: '/techniques',
                    items: PATTERNS.map((pattern) => ({ name: pattern.name, path: `/techniques#${pattern.id}` })),
                })}
            />
            <SiteHeader />
            <PatternBackground fade />

            <main className="relative z-10 flex-1">
                <div className="max-w-container mx-auto px-6 sm:px-12 pt-32 pb-24">
                    <div className="max-w-5xl mx-auto">
                        <Link href="/agents-md" className="font-inter text-sm text-teal hover:underline">
                            AGENTS.md directory
                        </Link>

                        <header className="mt-6">
                            <h1 className="font-unit-medium text-4xl sm:text-5xl text-light-cream leading-tight tracking-tight">
                                Techniques
                            </h1>
                            <p className="mt-4 font-roboto text-lg text-light-cream/70 leading-relaxed">
                                These files disagree about almost everything, including how long an AGENTS.md should be. Ghostty gets it
                                done in 39 lines; herdr takes 317. But the same moves keep turning up, and those are the transferable part:
                                one file teaches you about one repo, these apply to yours.
                            </p>
                            <p className="mt-4 font-roboto text-lg text-light-cream/70 leading-relaxed">
                                Roughly easiest to adopt first. Each one lists the projects in the directory that use it.
                            </p>
                        </header>

                        <nav aria-label="Techniques" className="mt-10 flex flex-wrap gap-2 border-y border-gray-750/50 py-5">
                            {PATTERNS.map((pattern) => (
                                <a
                                    key={pattern.id}
                                    href={`#${pattern.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-750 px-3 py-1.5 font-inter text-xs leading-none text-gray-550 transition-colors hover:border-teal/70 hover:text-teal"
                                >
                                    <TechniqueIcon pattern={pattern.id} className="size-3.5" />
                                    {pattern.name}
                                </a>
                            ))}
                        </nav>

                        <div className="mt-14 grid gap-4 md:grid-cols-2">
                            {PATTERNS.map((pattern) => {
                                const used = projectsWithPattern(pattern.id);
                                const shown = used.slice(0, 6);
                                const remaining = used.length - shown.length;
                                return (
                                    <section
                                        key={pattern.id}
                                        id={pattern.id}
                                        className="scroll-mt-28 rounded-xl border border-gray-750/70 bg-medium-gray/30 p-5 sm:p-6"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 shrink-0 rounded-md border border-dark-teal/50 bg-dark-teal/20 p-1.5 text-teal">
                                                <TechniqueIcon pattern={pattern.id} className="size-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <h2 className="font-unit-medium text-lg text-light-cream leading-snug">{pattern.name}</h2>
                                                <p className="mt-1 font-roboto text-[15px] text-light-cream/80 leading-relaxed">
                                                    {pattern.summary}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-3 font-inter text-sm text-gray-550 leading-relaxed">{pattern.detail}</p>

                                        <p className="mt-5 font-inter text-xs uppercase tracking-wider text-gray-600">
                                            {used.length} of {projects.length} projects
                                        </p>
                                        <ul className="mt-2 border-t border-gray-750/50">
                                            {shown.map((project) => (
                                                <li key={project.slug}>
                                                    <Link
                                                        href={`/${project.slug}`}
                                                        className="group flex items-center gap-2.5 border-b border-gray-750/50 py-2 transition-colors hover:bg-medium-gray/50"
                                                    >
                                                        <Image
                                                            src={logoSrc(project)}
                                                            alt=""
                                                            width={20}
                                                            height={20}
                                                            className="size-5 shrink-0 rounded bg-gray-800 object-cover"
                                                        />
                                                        <span className="min-w-0 flex-1 truncate font-roboto text-sm text-light-cream/85 transition-colors group-hover:text-teal">
                                                            {project.name}
                                                        </span>
                                                        <span className="shrink-0 font-mono text-xs text-gray-600 tabular-nums">
                                                            {formatStars(project.stars)}
                                                        </span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                        {remaining > 0 ? (
                                            <p className="mt-2 font-inter text-xs text-gray-600">and {remaining} more</p>
                                        ) : null}
                                    </section>
                                );
                            })}
                        </div>

                        <section className="mt-20 border-t border-gray-750/50 pt-10">
                            <h2 className="font-unit-medium text-2xl text-light-cream leading-snug tracking-tight">
                                Context your AGENTS.md cannot carry
                            </h2>
                            <p className="mt-3 font-roboto text-base text-light-cream/70 leading-relaxed">
                                These techniques tell an agent how your codebase works. None of them can tell it which bug three customers
                                hit this week. Modem keeps that context current and attaches it to the work.
                            </p>
                            <div className="mt-6">
                                <CTAButton>Try Modem</CTAButton>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}

import Link from 'next/link';

export function ProjectTabs({ slug, skills, active }: { slug: string; skills?: number; active: 'instructions' | 'skills' }) {
    return (
        <nav aria-label="Project sections" className="project-tabs">
            <Link href={`/${slug}`} aria-current={active === 'instructions' ? 'page' : undefined}>
                Instructions
            </Link>
            <Link href={`/${slug}/skills`} aria-current={active === 'skills' ? 'page' : undefined}>
                Skills {skills !== undefined ? <span className="font-mono text-[11px]">{skills}</span> : null}
            </Link>
        </nav>
    );
}

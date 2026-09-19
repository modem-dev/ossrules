export function ProjectLicense({ license, href }: { license?: string; href?: string }) {
    return (
        <section className="my-6 font-mono text-[11px] leading-relaxed text-gray-550 [overflow-wrap:anywhere]" aria-label="License">
            <h2 className="eyebrow mb-2">Project license</h2>
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                    {license ?? 'View repository license'} ↗
                </a>
            ) : (
                <p>{license ?? 'Not recorded in this snapshot.'}</p>
            )}
        </section>
    );
}

import Image from 'next/image';
import { type AgentsProject, logoSrc } from './agents-md-data';

export function ProjectTitle({
    project,
    section,
    name = project.name,
    description = project.tagline,
}: {
    project: AgentsProject;
    section: 'Agent Rules' | 'Agent Skills' | 'Skill';
    name?: string;
    description?: string;
}) {
    return (
        <div className="min-w-0">
            <div className="project-title-row">
                <Image
                    src={logoSrc(project)}
                    alt=""
                    width={56}
                    height={56}
                    className="project-title-logo shrink-0 rounded-xl bg-gray-800 object-cover"
                />
                <h1 className="page-title project-page-title">
                    <span className="project-title-name">{name}</span> <span className="project-title-section">{section}</span>
                </h1>
            </div>
            <p className="mt-4 max-w-2xl text-gray-550 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

import fs from 'node:fs';
import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        localPatterns: [
            { pathname: '/**', search: '' },
            { pathname: '/logos/*', search: '?v=2' },
        ],
    },
    // Server-rendered project pages read the committed corpus from content/.
    outputFileTracingIncludes: {
        '/**': ['./content/**'],
        '/files/*': ['./public/files/**/*'],
        '/og': ['./public/logos/*.png', './public/fonts/*.ttf'],
    },
    async redirects() {
        const directory = path.join(process.cwd(), 'content/projects');
        const projects = fs
            .readdirSync(directory)
            .filter((name) => name.endsWith('.json'))
            .map((name) => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')));
        return projects.flatMap(({ slug, owner, repo }) => {
            const destination = `/${owner}/${repo}`;
            const redirects = [{ source: `/${slug}`, destination, permanent: true }];
            // An actual owner/skills repository takes precedence over an old alias.
            if (
                !projects.some((project) => project.owner.toLowerCase() === slug.toLowerCase() && project.repo.toLowerCase() === 'skills')
            ) {
                redirects.push({ source: `/${slug}/skills/:path*`, destination: `${destination}/skills/:path*`, permanent: true });
            }
            return redirects;
        });
    },
};

export default nextConfig;

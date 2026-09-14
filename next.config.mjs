/** @type {import('next').NextConfig} */
const nextConfig = {
    // Every project page is generated from content/projects at build time.
    outputFileTracingIncludes: {
        '/**': ['./content/**'],
    },
};

export default nextConfig;

// Retro dithered-checker texture. A 2x2 dot tiled on a 4px grid; the site is a
// fixed dark theme, so dots are white.
const patternUrl =
    'url("data:image/svg+xml,%3Csvg%20width%3D%224%22%20height%3D%224%22%20viewBox%3D%220%200%207%207%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M2%200H0V2H2V0Z%22%20fill%3D%22%23ffffff%22/%3E%3C/svg%3E")';

// Fades the texture in below the header and out above the footer so it never
// meets either with a hard edge.
const fadeMask =
    'linear-gradient(to bottom, transparent 0, transparent 88px, #000 320px, #000 calc(100% - 520px), transparent calc(100% - 220px))';

export function PatternBackground({ className = 'fixed inset-0 opacity-[0.07]', fade = false }: { className?: string; fade?: boolean }) {
    const style: React.CSSProperties = { backgroundImage: patternUrl, backgroundRepeat: 'repeat' };
    if (fade) {
        style.maskImage = fadeMask;
        style.WebkitMaskImage = fadeMask;
    }
    return <div aria-hidden className={`pointer-events-none ${className}`} style={style} />;
}

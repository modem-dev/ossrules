import { ImageResponse } from 'next/og';

/** Social card for any page: the site mark plus the page's title. */
export function GET(request: Request) {
    const title = new URL(request.url).searchParams.get('title') ?? 'ossrules.md';

    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#242424',
                padding: '72px',
            }}
        >
            <div style={{ display: 'flex', fontSize: 34, color: '#44bda3', letterSpacing: '-0.5px' }}>ossrules.md</div>
            <div style={{ display: 'flex', fontSize: 68, color: '#fdfdfa', lineHeight: 1.15, letterSpacing: '-1.5px' }}>{title}</div>
            <div style={{ display: 'flex', fontSize: 26, color: '#9e9b94' }}>Agent instructions and skills from open source</div>
        </div>,
        { width: 1200, height: 630 },
    );
}

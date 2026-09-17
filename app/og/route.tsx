import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

const jetbrainsMono = readFile(path.join(process.cwd(), 'public', 'fonts', 'JetBrainsMono-Regular.ttf'));
const inter = readFile(path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'));

/** Only local project icons are accepted; unknown projects keep the text-only card. */
async function projectIcon(slug: string | null): Promise<string | undefined> {
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return undefined;
    try {
        const icon = await readFile(path.join(process.cwd(), 'public', 'logos', `${slug}.png`));
        return `data:image/png;base64,${icon.toString('base64')}`;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
        throw error;
    }
}

/** Social card for any page, with the matching project icon when supplied. */
export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    const title = params.get('title') ?? 'ossrules.md';
    const label = params.get('label');
    const icon = await projectIcon(params.get('project'));

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
                fontFamily: 'Inter',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    fontFamily: label ? 'JetBrains Mono' : 'Inter',
                    fontSize: label ? 28 : 34,
                    color: '#44bda3',
                    letterSpacing: label ? '-0.8px' : '-0.5px',
                }}
            >
                ossrules.md
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                {icon ? (
                    // biome-ignore lint/performance/noImgElement: ImageResponse embeds the original bytes, not a browser image component.
                    <img src={icon} alt="" width={112} height={112} style={{ borderRadius: 16, objectFit: 'contain', flexShrink: 0 }} />
                ) : null}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    {label ? (
                        <div
                            style={{
                                display: 'flex',
                                fontFamily: 'JetBrains Mono',
                                fontSize: 24,
                                lineHeight: 1.45,
                                color: '#44bda3',
                                marginBottom: 16,
                                letterSpacing: '0.3px',
                            }}
                        >
                            {label.toUpperCase()}
                        </div>
                    ) : null}
                    <div
                        style={{
                            display: 'flex',
                            fontFamily: label ? 'JetBrains Mono' : 'Inter',
                            fontSize: label ? 58 : 68,
                            color: '#fdfdfa',
                            lineHeight: label ? 1.22 : 1.15,
                            letterSpacing: label ? '-1.9px' : '-1.5px',
                            overflowWrap: 'anywhere',
                        }}
                    >
                        {title}
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', fontSize: 26, color: '#9e9b94' }}>Agent instructions and skills from open source</div>
        </div>,
        {
            width: 1200,
            height: 630,
            fonts: [
                { name: 'Inter', data: await inter, weight: 400, style: 'normal' },
                ...(label ? [{ name: 'JetBrains Mono', data: await jetbrainsMono, weight: 400 as const, style: 'normal' as const }] : []),
            ],
        },
    );
}

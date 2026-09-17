'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { SkillHeading } from '@/lib/skill-outline';

export function SkillOutline({ headings, readHref }: { headings: SkillHeading[]; readHref?: string }) {
    const [active, setActive] = useState(headings[0]?.id ?? '');
    const mobile = useRef<HTMLDetailsElement>(null);
    const nav = useRef<HTMLElement>(null);

    useEffect(() => {
        const elements = headings.map((heading) => document.getElementById(heading.id));
        let frame = 0;
        function update() {
            frame = 0;
            const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
            const margin = elements[0] ? Number.parseFloat(getComputedStyle(elements[0]).scrollMarginTop) || 0 : 0;
            const top = Math.max((document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 72) + 24, padding + margin + 2);
            let current = headings[0]?.id ?? '';
            elements.forEach((element, index) => {
                if (element && element.getBoundingClientRect().top <= top) current = headings[index].id;
            });
            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
                current = headings.at(-1)?.id ?? current;
            }
            setActive(current);
        }
        function schedule() {
            if (!frame) frame = window.requestAnimationFrame(update);
        }
        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        window.addEventListener('hashchange', schedule);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            window.removeEventListener('hashchange', schedule);
        };
    }, [headings]);

    useEffect(() => {
        const container = nav.current;
        const link = container?.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`);
        if (!container || !link) return;
        const offset = link.getBoundingClientRect().top - container.getBoundingClientRect().top;
        if (offset < 0 || offset + link.offsetHeight > container.clientHeight) {
            container.scrollTop += offset - container.clientHeight / 2;
        }
    }, [active]);

    const groups: { heading: SkillHeading; children: SkillHeading[] }[] = [];
    for (const heading of headings) {
        const previous = groups.at(-1);
        if (previous && heading.depth > previous.heading.depth) previous.children.push(heading);
        else groups.push({ heading, children: [] });
    }
    const activeGroup = groups.find((group) => group.heading.id === active || group.children.some((heading) => heading.id === active));

    function link(heading: SkillHeading, isMobile: boolean) {
        return (
            <a
                href={`#${heading.id}`}
                aria-current={active === heading.id ? 'location' : undefined}
                onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    if (isMobile && mobile.current) mobile.current.open = false;
                    document.getElementById(heading.id)?.focus({ preventScroll: true });
                }}
            >
                {heading.text}
            </a>
        );
    }

    function links(isMobile: boolean) {
        return (
            <nav ref={isMobile ? undefined : nav} aria-label={isMobile ? 'On this page, mobile' : 'On this page'}>
                <ul>
                    {groups.map(({ heading, children }) => (
                        <li key={heading.id}>
                            {link(heading, isMobile)}
                            {children.length ? (
                                <ul hidden={!isMobile && activeGroup?.heading.id !== heading.id}>
                                    {children.map((child) => (
                                        <li key={child.id}>{link(child, isMobile)}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </nav>
        );
    }

    if (!headings.length) {
        return (
            <div className="skill-outline-empty">
                {readHref ? (
                    <Link href={readHref} scroll={false} className="text-teal hover:underline">
                        Read with section navigation →
                    </Link>
                ) : (
                    <p>No section headings in this file.</p>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="skill-desktop-outline">
                <p className="eyebrow mb-3">On this page</p>
                {links(false)}
            </div>
            <details
                ref={mobile}
                className="skill-mobile-outline"
                suppressHydrationWarning
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && mobile.current?.open) {
                        mobile.current.open = false;
                        mobile.current.querySelector('summary')?.focus();
                        event.stopPropagation();
                    }
                }}
            >
                <summary>On this page</summary>
                {links(true)}
            </details>
        </>
    );
}

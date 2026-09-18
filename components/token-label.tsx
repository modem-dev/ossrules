'use client';

import { useEffect, useId, useRef, useState } from 'react';

export function TokenLabel() {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLSpanElement>(null);
    const id = useId();

    useEffect(() => {
        if (!open) return;
        function dismiss(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }
        function onEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }
        document.addEventListener('pointerdown', dismiss);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('pointerdown', dismiss);
            document.removeEventListener('keydown', onEscape);
        };
    }, [open]);

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: The wrapper preserves hover over the tooltip; its button provides keyboard and touch access.
        <span
            ref={root}
            className="token-label"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
            }}
        >
            Tokens
            <button
                type="button"
                className="token-info-button"
                aria-label="How tokens are counted"
                aria-expanded={open}
                aria-describedby={open ? id : undefined}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
            >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v6M12 7v1" />
                </svg>
            </button>
            {open ? (
                <span className="token-info-position">
                    <span id={id} role="tooltip" className="token-info-card">
                        Token count for this saved file using the <code>o200k_base</code> encoding. Counts vary by model and tokenizer.
                        Referenced files and other conversation context aren’t included.
                    </span>
                </span>
            ) : null}
        </span>
    );
}

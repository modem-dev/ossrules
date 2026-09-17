import { Children, type ComponentProps, isValidElement, type ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HighlightedSource } from './highlighted-source';

export function markdownText(children: ReactNode): string {
    return Children.toArray(children)
        .map((child) => (isValidElement<{ children?: ReactNode }>(child) ? markdownText(child.props.children) : String(child)))
        .join('');
}

/** Shared safe Markdown rendering; callers supply snapshot-aware links and anchors. */
export function DocumentMarkdown({
    source,
    components,
    plugins = [],
    className = '',
}: {
    source: string;
    components: Components;
    plugins?: NonNullable<ComponentProps<typeof Markdown>['remarkPlugins']>;
    className?: string;
}) {
    return (
        <div className={`skill-markdown ${className}`}>
            <Markdown
                skipHtml
                remarkPlugins={[remarkGfm, ...plugins]}
                components={{
                    pre: ({ children }) => {
                        const code = Children.toArray(children).find((child) => isValidElement(child));
                        if (!isValidElement<{ className?: string; children?: ReactNode }>(code)) return <pre>{children}</pre>;
                        return (
                            <HighlightedSource
                                source={markdownText(code.props.children).replace(/\n$/, '')}
                                language={code.props.className?.replace('language-', '') ?? 'text'}
                            />
                        );
                    },
                    table: ({ children }) => (
                        <div className="overflow-x-auto">
                            <table>{children}</table>
                        </div>
                    ),
                    ...components,
                }}
            >
                {source}
            </Markdown>
        </div>
    );
}

'use client';

import * as Select from '@radix-ui/react-select';

interface DirectoryOption {
    value: string;
    label: string;
    count?: number;
    color?: string;
}

function Chevron({ up = false }: { up?: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
                d={up ? 'm4 10 4-4 4 4' : 'm4 6 4 4 4-4'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Shared directory filters with keyboard navigation, typeahead, and managed focus. */
export function DirectorySelect({
    label,
    value,
    onValueChange,
    options,
    active = false,
    prefix = '',
}: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: DirectoryOption[];
    active?: boolean;
    prefix?: string;
}) {
    const selected = options.find((option) => option.value === value);
    return (
        <Select.Root value={value} onValueChange={onValueChange}>
            <Select.Trigger className="directory-select-trigger" aria-label={label} data-active={active || undefined}>
                {selected?.color ? (
                    <span className="directory-select-dot" style={{ backgroundColor: selected.color }} aria-hidden="true" />
                ) : null}
                <span className="directory-select-value">
                    <Select.Value>
                        {prefix}
                        {selected?.label ?? value}
                    </Select.Value>
                </span>
                <Select.Icon className="directory-select-chevron">
                    <Chevron />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content className="directory-select-content" position="popper" sideOffset={6} collisionPadding={12}>
                    <Select.ScrollUpButton className="directory-select-scroll">
                        <Chevron up />
                    </Select.ScrollUpButton>
                    <Select.Viewport className="directory-select-viewport">
                        <Select.Group>
                            <Select.Label className="directory-select-label">{label}</Select.Label>
                            {options.map((option) => (
                                <Select.Item
                                    key={option.value}
                                    value={option.value}
                                    textValue={option.label}
                                    className="directory-select-item"
                                >
                                    {option.color ? (
                                        <span
                                            className="directory-select-dot"
                                            style={{ backgroundColor: option.color }}
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                    <Select.ItemText>{option.label}</Select.ItemText>
                                    {option.count !== undefined ? <span className="directory-select-count">{option.count}</span> : null}
                                    <span className="directory-select-check">
                                        <Select.ItemIndicator>
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path
                                                    d="m3 8 3 3 7-7"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </Select.ItemIndicator>
                                    </span>
                                </Select.Item>
                            ))}
                        </Select.Group>
                    </Select.Viewport>
                    <Select.ScrollDownButton className="directory-select-scroll">
                        <Chevron />
                    </Select.ScrollDownButton>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}

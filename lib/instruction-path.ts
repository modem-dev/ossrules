/** Explicit analysis sources may be symlink targets such as .rules or CONTRIBUTING.md. */
export function isInstructionSourcePath(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        !/[\\\0?#:]/.test(value) &&
        value.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
    );
}

/** Discovery remains limited to root and nested instruction entry points. */
export function isInstructionPath(value: unknown): value is string {
    return isInstructionSourcePath(value) && /(^|\/)(AGENTS|CLAUDE)\.md$/.test(value);
}

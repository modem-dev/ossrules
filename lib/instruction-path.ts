/** Instruction entry points can live at the root, in agent folders, or beside a package. */
export function isInstructionPath(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        !/[\\\0?#]/.test(value) &&
        value.split('/').every((part) => part !== '' && part !== '.' && part !== '..') &&
        /(^|\/)(AGENTS|CLAUDE)\.md$/.test(value)
    );
}

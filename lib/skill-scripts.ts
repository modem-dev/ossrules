import type { SkillFile } from './skill-schema';

// Identify available code files, not documentation, config, images, or archives.
const CODE_EXTENSION =
    /\.(?:py|pyw|sh|bash|zsh|fish|js|mjs|cjs|jsx|ts|mts|cts|tsx|rb|php|pl|pm|lua|r|ps1|psm1|bat|cmd|go|rs|c|h|cpp|hpp|cc|cs|java|kt|kts|swift|ex|exs|erl|escript|clj|cljs|scala|sc|sql)$/i;

export function hasSkillScripts(files: Pick<SkillFile, 'path' | 'text' | 'mode' | 'omitted'>[]): boolean {
    return files.some((file) => {
        if (file.omitted || !file.text || file.mode === '120000') return false;
        if (CODE_EXTENSION.test(file.path)) return true;
        const name = file.path.split('/').at(-1) ?? '';
        return file.mode === '100755' && !name.includes('.') && !/^(?:LICENSE|NOTICE|COPYING|README|CHANGELOG)$/i.test(name);
    });
}

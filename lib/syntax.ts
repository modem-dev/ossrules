import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const languages = {
    markdown: () => import('shiki/langs/markdown.mjs'),
    javascript: () => import('shiki/langs/javascript.mjs'),
    typescript: () => import('shiki/langs/typescript.mjs'),
    tsx: () => import('shiki/langs/tsx.mjs'),
    jsx: () => import('shiki/langs/jsx.mjs'),
    bash: () => import('shiki/langs/bash.mjs'),
    json: () => import('shiki/langs/json.mjs'),
    yaml: () => import('shiki/langs/yaml.mjs'),
    python: () => import('shiki/langs/python.mjs'),
    rust: () => import('shiki/langs/rust.mjs'),
    go: () => import('shiki/langs/go.mjs'),
    css: () => import('shiki/langs/css.mjs'),
    html: () => import('shiki/langs/html.mjs'),
    toml: () => import('shiki/langs/toml.mjs'),
    diff: () => import('shiki/langs/diff.mjs'),
    sql: () => import('shiki/langs/sql.mjs'),
    cpp: () => import('shiki/langs/cpp.mjs'),
    c: () => import('shiki/langs/c.mjs'),
    jsonc: () => import('shiki/langs/jsonc.mjs'),
    powershell: () => import('shiki/langs/powershell.mjs'),
    mermaid: () => import('shiki/langs/mermaid.mjs'),
    zig: () => import('shiki/langs/zig.mjs'),
};
const aliases: Record<string, string> = {
    'c++': 'cpp',
    console: 'bash',
    ps1: 'powershell',
    md: 'markdown',
    mdx: 'markdown',
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    shellscript: 'bash',
    yml: 'yaml',
    py: 'python',
    rs: 'rust',
    patch: 'diff',
    htm: 'html',
};
let highlighter: ReturnType<typeof createHighlighterCore> | undefined;
const loading = new Map<string, Promise<void>>();

export async function highlight(source: string, language: string) {
    const name = language.toLowerCase();
    const declared = aliases[name] ?? name;
    // Extensionless executables often identify their language only in a shebang.
    // Keep an explicit, supported grammar authoritative (including Markdown).
    const nodeShebang = /^#!\s*(?:\/[^\s]*\/env\s+(?:-S\s+)?node|\/[^\s]*\/node)(?=\s|$)/.test(source.split('\n', 1)[0]);
    const lang = Object.hasOwn(languages, declared) ? declared : nodeShebang ? 'javascript' : declared;
    if (!Object.hasOwn(languages, lang)) return undefined;
    highlighter ??= createHighlighterCore({
        themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
        langs: [],
        engine: createJavaScriptRegexEngine(),
    });
    const instance = await highlighter;
    if (!loading.has(lang)) {
        loading.set(
            lang,
            languages[lang as keyof typeof languages]().then((grammar) => instance.loadLanguage(grammar)),
        );
    }
    await loading.get(lang);
    return instance.codeToTokensWithThemes(source, { lang, themes: { light: 'github-light', dark: 'github-dark' } });
}

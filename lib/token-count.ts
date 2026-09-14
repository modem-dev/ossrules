import 'server-only';

import { Tiktoken } from 'js-tiktoken/lite';
import o200kBase from 'js-tiktoken/ranks/o200k_base';

let tokenizer: Tiktoken | undefined;

/** Count the pinned file at build time; tokenizer data never goes to the browser. */
export function countSourceTokens(source: string | undefined): number | undefined {
    if (source === undefined) return undefined;
    tokenizer ??= new Tiktoken(o200kBase);
    // Token-looking strings in source are literal text, not prompt delimiters.
    return tokenizer.encode(source, [], []).length;
}

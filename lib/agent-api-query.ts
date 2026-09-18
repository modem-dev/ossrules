import { SITE_URL } from './schema';

export class ApiQueryError extends Error {}

export function parseListQuery(url: URL, filters: string[]) {
    const allowed = new Set(['limit', 'offset', ...filters]);
    for (const key of url.searchParams.keys()) {
        if (!allowed.has(key)) throw new ApiQueryError(`Unknown parameter: ${key}. Allowed: ${[...allowed].join(', ')}.`);
        if (url.searchParams.getAll(key).length > 1) throw new ApiQueryError(`Duplicate parameter: ${key}.`);
    }
    const integer = (key: string, fallback: number, min: number, max: number) => {
        const value = url.searchParams.get(key);
        if (value === null) return fallback;
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) {
            throw new ApiQueryError(`${key} must be an integer between ${min} and ${max}.`);
        }
        return Number(value);
    };
    for (const key of filters) {
        if ((url.searchParams.get(key)?.length ?? 0) > 200) throw new ApiQueryError(`${key} must be at most 200 characters.`);
    }
    return {
        limit: integer('limit', 10, 1, 50),
        offset: integer('offset', 0, 0, Number.MAX_SAFE_INTEGER),
        filter: (key: string) => (url.searchParams.get(key) ?? '').trim().toLowerCase(),
    };
}

export function pageItems<T>(items: T[], url: URL, query: { limit: number; offset: number }) {
    const { limit, offset } = query;
    const page = items.slice(offset, offset + limit);
    const link = (start: number) => {
        const next = new URL(url.pathname + url.search, SITE_URL);
        next.searchParams.set('offset', String(start));
        next.searchParams.set('limit', String(limit));
        return next.href;
    };
    return {
        version: 1,
        total: items.length,
        limit,
        offset,
        items: page,
        nextUrl: offset + page.length < items.length ? link(offset + limit) : null,
        previousUrl:
            offset > 0 && items.length > 0
                ? link(Math.min(Math.max(0, offset - limit), Math.floor((items.length - 1) / limit) * limit))
                : null,
    };
}

export function listResponse(request: Request, build: (url: URL) => unknown) {
    try {
        return Response.json(build(new URL(request.url)));
    } catch (error) {
        if (error instanceof ApiQueryError) return Response.json({ error: error.message }, { status: 400 });
        throw error;
    }
}

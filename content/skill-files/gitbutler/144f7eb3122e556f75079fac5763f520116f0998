---
name: lite-render-perf
description: Use when working on React code in `apps/lite` that derives values during render, adds or consumes a context, subscribes to the redux store or a query, or renders lists of row components — and whenever the lite UI is reported slow, laggy, or re-rendering too much. React Compiler does not prevent these regressions; load this skill BEFORE writing such code, not only when debugging it.
---

The recurring render-performance failure in this app is accidental
over-re-rendering: one interaction re-renders every row instead of the few
affected ones. Repositories can have hundreds of branch rows, so this turns
single-digit-millisecond interactions into triple-digit ones. The compiler
makes it easy to cause by accident because it silently stops memoizing
exactly where you assume it won't.

## The three mechanisms behind past regressions

### 1. Whether the compiler memoizes a derivation is not predictable from the source

The compiler only caches what it can prove safe to cache, and it declines
more often than you would guess. Two derivations in this app are both
module-level functions that call imported helpers, and they compile
differently: `buildOutlineNavigationIndex` in `WorkspacePage.tsx` gets a
memo block keyed on its inputs, while `getDiffView` in `Details.tsx` got
none and re-ran on every render of a component that re-renders whenever the
file selection changes.

Unmemoized inputs are contagious. `getDiffView` was called with values
built by `Match` pipes that the compiler had not memoized either; feeding
it stable values instead was enough to make the memo block appear. So the
churn spreads outward from whichever value first fails to get a scope,
which is why one unmemoized derivation can quietly cost far more than
itself.

Either way the effect is the same: the derivation re-runs and returns fresh
identities even when its data never changed, and everything keyed on those
identities — context values, props, effect deps — churns with it.

What to do instead:

- Derive query data inside the query's `select`. react-query caches the
  result on `(data, select function identity)`, and the compiler DOES
  memoize the closure on its captures — so the closure's identity becomes
  exactly the dependency key you want. Extra inputs are simply captured by
  the closure. Precedent: `useBranchesOutline.ts`. `useQueries` /
  `useSuspenseQueries` give you the same lever in `combine` — precedent:
  `lineStats` in `OutlineTree/UncommittedChangesRow.tsx`, which folds the
  results down inside `combine` instead of mapping them out and deriving in
  render the way `Details.tsx` does. Check what the closure captures:
  capture a value that is itself rebuilt each render and you have only
  moved the churn one level up.
- For redux-derived collections, use `createSelector` (see
  `projects/project.ts`), never a plain function returning a fresh array or
  object.
- Never conclude from the source that something is or is not memoized —
  read the compiler's output. A compiled function imports
  `react/compiler-runtime` and allocates slots with `const $ = _c(n)`; a
  memoized value is assigned inside an `if ($[i] !== dep)` block, and its
  dependencies are exactly the values that block tests. A derivation
  sitting outside every such block runs on every render. Two ways to look:
  fetch the vite-transformed module from the running app
  (`fetch('/src/path/to/file.ts').then(r => r.text())` over CDP — see
  below), or run the plugin offline on any file, which needs no app:

```js
// Resolve both from node_modules/.pnpm — pnpm does not hoist them. There is
// no @babel/preset-typescript here, so strip types via parserOpts instead.
await babel.transformAsync(source, {
	filename: file,
	parserOpts: { plugins: ["typescript", "jsx"] },
	plugins: [["babel-plugin-react-compiler", { target: "19" }]],
	configFile: false,
	babelrc: false,
});
```

### 2. Context re-renders every consumer; it has no selector

`use(SomeContext)` re-renders the component whenever the context value's
identity changes — there is no way to subscribe to a slice, and neither the
compiler nor `React.memo` can bail a context read out. Note this is a
different failure from mechanism 1: when the value's content legitimately
changed, fixing identities cannot help — the only cure is consumers
subscribing to something narrower than the whole value.

What to do instead:

- Context is for values that change rarely relative to their consumers.
- Per-row state must be a narrow `useAppSelector` returning a primitive
  (usually a boolean). Redux subscriptions only re-render when the selected
  value changes, so a selection change re-renders two rows, not all of them:

```tsx
const isSelected = useAppSelector((state) => {
	const stored = projectSlice.selectors.selectPrimaryOutlineSelection(state, projectId);
	return stored !== null && operandEquals(stored, operand);
});
```

For the current shape, see `useIsSelected` in `BranchesList.tsx` and the
`selectIsSelectedOutline` subscription in `OutlineTree/ItemRow.tsx`.

- If rows need a value that requires resolution against a big object,
  resolve it once at the top and store the resolved form, rather than
  letting every row resolve independently.

### 3. Identity discipline in the store and in query results

- Reducers must early-return when the update is a no-op, otherwise they
  produce a new state identity and wake every subscriber.
- Reading store data inside an event callback needs no subscription at all —
  take `const store = useAppStore()` at the top and call `store.getState()`
  in the callback, instead of subscribing with `useAppSelector` to a value
  only the callback reads.
- Destructure `useMutation` results (`const { isPending, mutate } = ...`) —
  the top-level result object is a new identity every render
  (`@tanstack/query` `no-unstable-deps`).
- Hook call order can change what the compiler memoizes; moving plain
  `useQuery` calls above a `useQueries` call has fixed memoization here
  before. If the compiled output shows a value outside every memo slot for
  no visible reason, try reordering the hooks around it.

## Driving the dev app over CDP

`pnpm dev` in `apps/lite` starts vite (port 5173) and Electron with
`--remote-debugging-port=9222`. The first run compiles a helper binary with
cargo and takes minutes; `Port 5173 is already in use` means an instance is
already running — reuse it, or `lsof -ti tcp:5173 | xargs kill`. React and
Redux DevTools are auto-installed in dev builds.

`curl http://127.0.0.1:9222/json` lists debug targets. Pick the entry with
`"type": "page"` whose URL is on 5173 — the others are extension service
workers. Its `webSocketDebuggerUrl` speaks the Chrome DevTools Protocol; a
few lines of Node (global `WebSocket`) are enough to drive it:

```js
// Usage: node cdp.mjs eval "<expr>"   or:   node cdp.mjs shot out.png
const page = (await (await fetch("http://127.0.0.1:9222/json")).json()).find(
	(t) => t.type === "page" && t.url.includes("5173"),
);
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params) =>
	new Promise((res) => {
		pending.set(++id, res);
		ws.send(JSON.stringify({ id, method, params }));
	});
ws.onmessage = (e) => {
	const m = JSON.parse(e.data);
	pending.get(m.id)?.(m.result);
};
await new Promise((res) => (ws.onopen = res));
const [mode, arg] = process.argv.slice(2);
if (mode === "eval")
	console.log(
		JSON.stringify(
			await send("Runtime.evaluate", {
				expression: arg,
				awaitPromise: true,
				returnByValue: true,
			}),
		),
	);
else if (mode === "shot") {
	const { data } = await send("Page.captureScreenshot", { format: "png" });
	(await import("node:fs")).writeFileSync(arg, Buffer.from(data, "base64"));
}
process.exit(0);
```

Useful from `Runtime.evaluate`:

- The whole preload API is callable: `window.lite.branchList(projectId)`
  etc. — the fastest way to inspect real API payloads and sizes.
- Interact by dispatching events on DOM nodes found via `aria-label`s;
  screenshot to verify visually.

Gotchas:

- Repeated evaluates share one top-level scope: wrap every expression in a
  `{ ... }` block or `const x` collides with the previous call
  ("Identifier 'x' has already been declared").
- Synthetic `MouseEvent`s do not move real focus; behavior wired to
  `onFocus` (selection scopes) needs an explicit `.focus()` or real input.
- Renderer edits arrive via HMR, but edits to store/redux modules trigger a
  full page reload that wipes `window.*` state — re-arm any probes after.
  Electron main-process edits are only compiled at startup: restart
  `pnpm dev`.

## Measuring: prove it, in both directions

React DevTools being installed means its hook is available in-page:

1. Arm a commit logger and interact:

```js
const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
window.__log = [];
const orig = hook.onCommitFiberRoot.bind(hook);
hook.onCommitFiberRoot = (id, root, ...rest) => {
	window.__log.push({ dur: root.current.actualDuration });
	return orig(id, root, ...rest);
};
```

2. Judge by `actualDuration` per commit: an interaction should cost
   single-digit milliseconds and re-render O(affected rows). A commit whose
   duration scales with total row count is the signature of a blast.
3. To find WHY, read the compiled module (mechanism 1 above). To watch a
   specific context value's identity across commits, extend the logger to
   walk `root.current` for the provider fiber (its `type` is the context
   object, so match on `type.displayName`) and compare `memoizedProps.value`
   against the previous commit's. Do NOT add `window.*` probe writes inside
   components or hooks to trace identities — that mutation makes the
   compiler bail out of the whole function and destroys the very memoization
   you are measuring.
4. Restore `onCommitFiberRoot` when done; measure before and after the fix.

## Review checklist

- Any non-trivial derivation in render: is its result's identity
  load-bearing (context value, prop to many children, effect dep)? Move it
  into `select`/`combine`/`createSelector`, or read the compiled output to
  prove it harmless — do not assume the compiler handled it.
- Any new context: how often does its value change, and how many consumers?
- Any `useAppSelector`: does it return a primitive or a stored reference,
  not a fresh object?
- Any new reducer: does it no-op cleanly when the value is unchanged?

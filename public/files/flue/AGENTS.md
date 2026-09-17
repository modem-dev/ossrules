# Flue

Flue is a TypeScript framework for building autonomous AI agents and running them anywhere. An agent is a plain exported function: hooks in its body compose its capabilities — model (`useModel`), tools, skills, sandboxes, state — and its return value is its instruction. Agents live in durable conversations: accepted input survives crashes, restarts, and redeploys, and interrupted work recovers to a deterministic state. Applications build with Vite (the `flue()` plugin plus an explicit `app.ts` route map) and deploy to Node.js or Cloudflare Workers from the same source, with persistence adapters (SQLite, Postgres, MySQL, MongoDB, Redis, and more), channels that turn provider webhooks (Slack, GitHub, Telegram, ...) into agent conversations, and clients — the Flue Agent SDK (`@flue/sdk`), `@flue/react`, and the `flue` CLI — for driving conversations over HTTP or from code. The model layer is [Pi](https://pi.dev)'s provider protocol, used directly.

## Contributing

See `CONTRIBUTING.md` for the full picture. In short:

- **Bug reports** → https://github.com/withastro/flue/issues
- **Feature requests** → https://github.com/withastro/flue/discussions
- **Pull requests** are not accepted; they are automatically closed and converted into one of the two contribution types above.

## Terminology

```
Agent                         — a capitalized, exported plain function; Flue Hooks in its body attach
                                tools, instructions, and state, and its returned string is its
                                instruction; the function name (or its `agentName` string-literal
                                static) is the agent's durable identity
Agent module                  — a source file whose first statement is the `'use agent'` directive;
                                every capitalized exported function in it is an agent
└─ AgentInstance              — URL `<id>`; the agent's durable identity, independent of authoring
   └─ Harness                 — runtime-initialized agent environment; defaults to name `"default"`
      └─ Session              — one `harness.session(name?)`; defaults to `"default"`
         └─ Operation        — one `session.prompt` / `skill` / `task` / `shell` call
            └─ Turn          — one LLM round-trip inside pi-agent-core
```

There are no workflows or runs: conversations are the only durable unit, and a bounded code job is a tool with `harness: true`. Direct HTTP agent prompts and dispatched agent inputs operate within persistent sessions; `dispatch(...)` is identified by its `submissionId`.

Routing is explicit: `app.ts` is the application's route map, mounting each HTTP-reachable agent (`app.route('/agents/<name>', createAgentRouter(AgentFn))`) and channel (`app.route('/channels/<x>', channel.route())`). Registration comes from the `'use agent'` scan, not from mounting.

A blueprint is a Markdown implementation guide returned by `flue add`; its kind is `sandbox`, `database`, `channel`, or `tooling`.

## Project Structure

- `packages/runtime/` — Runtime library (`@flue/runtime`): sessions, agent harnesses, tools, sandbox plumbing, and the `/config` loader for `flue.config.ts`.
- `packages/vite/` — The `flue()` Vite plugin (`@flue/vite`): `'use agent'` scan/transform, generated bootstraps, Node dev/build, and the Cloudflare target adapter.
- `packages/cli/` — CLI (`@flue/cli`): `flue run` transport-free local execution, `init`, blueprint `add`/`update`, and offline `docs`.
- `examples/` — Integration examples for channels, databases, sandboxes, and deployment targets.
- `demo/` — Standalone Vite+React chat SPA that connects to any running Flue example server.
- `apps/docs/` — The documentation site; its content is the source of truth for user-facing docs.

No tests exist in the repo.

## Development

```
pnpm install
pnpm build          # turbo build across the workspace
pnpm check:types    # typecheck (excludes apps-www)
pnpm format         # format your work
```

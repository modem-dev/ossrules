## Introduction

Agents are Pydantic AI's primary interface for interacting with LLMs.

In some use cases a single Agent will control an entire application or component,
but multiple agents can also interact to embody more complex workflows.

The [`Agent`][pydantic_ai.Agent] class has full API documentation, but conceptually you can think of an agent as a container for:

| **Component**                                             | **Description**                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [Instructions](#instructions)                             | A set of instructions for the LLM written by the developer.                                               |
| [Function tool(s)](tools.md) and [toolsets](toolsets.md)  | Functions that the LLM may call to get information while generating a response.                           |
| [Structured output type](output.md)                       | The structured datatype the LLM must return at the end of a run, if specified.                            |
| [Dependency type constraint](dependencies.md)             | Dynamic instruction functions, tools, and output functions may all use dependencies when they're run.          |
| [LLM model](api/models/base.md)                           | Optional default LLM model associated with the agent. Can also be specified when running the agent.       |
| [Model Settings](#additional-configuration)               | Optional default model settings to help fine tune requests. Can also be specified when running the agent. |
| [Capabilities](capabilities/overview.md)                           | Reusable bundles of tools, hooks, instructions, and model settings that extend agent behavior.            |

While each of these can be configured individually, [capabilities](capabilities/overview.md) let you bundle related behavior into reusable units that are easier to compose, share, and [load from configuration files](agent-spec.md).

In typing terms, agents are generic in their dependency and output types, e.g., an agent which required dependencies of type `#!python Foobar` and produced outputs of type `#!python list[str]` would have type `Agent[Foobar, list[str]]`. In practice, you shouldn't need to care about this, it should just mean your IDE can tell you when you have the right type, and if you choose to use [static type checking](#static-type-checking) it should work well with Pydantic AI.

Here's a toy example of an agent that simulates a roulette wheel:

```python {title="roulette_wheel.py"}
from pydantic_ai import Agent, RunContext

roulette_agent = Agent(  # (1)!
    'openai:gpt-5.2',
    deps_type=int,
    output_type=bool,
    system_prompt=(
        'Use the `roulette_wheel` function to see if the '
        'customer has won based on the number they provide.'
    ),
)


@roulette_agent.tool
async def roulette_wheel(ctx: RunContext[int], square: int) -> str:  # (2)!
    """check if the square is a winner"""
    return 'winner' if square == ctx.deps else 'loser'


# Run the agent
success_number = 18  # (3)!
result = roulette_agent.run_sync('Put my money on square eighteen', deps=success_number)
print(result.output)  # (4)!
#> True

result = roulette_agent.run_sync('I bet five is the winner', deps=success_number)
print(result.output)
#> False
```

1. Create an agent, which expects an integer dependency and produces a boolean output. This agent will have type `#!python Agent[int, bool]`.
2. Define a tool that checks if the square is a winner. Here [`RunContext`][pydantic_ai.tools.RunContext] is parameterized with the dependency type `int`; if you got the dependency type wrong you'd get a typing error.
3. In reality, you might want to use a random number here e.g. `random.randint(0, 36)`.
4. `result.output` will be a boolean indicating if the square is a winner. Pydantic performs the output validation, and it'll be typed as a `bool` since its type is derived from the `output_type` generic parameter of the agent.

!!! tip "Agents are designed for reuse, like FastAPI Apps"
    You can instantiate one agent and use it globally throughout your application, as you would a small [FastAPI][fastapi.FastAPI] app or an [APIRouter][fastapi.APIRouter], or dynamically create as many agents as you want. Both are valid and supported ways to use agents.

## Running Agents

There are five ways to run an agent:

1. [`agent.run()`][pydantic_ai.agent.AbstractAgent.run] — an async function which returns a [`RunResult`][pydantic_ai.agent.AgentRunResult] containing a completed response.
2. [`agent.run_sync()`][pydantic_ai.agent.AbstractAgent.run_sync] — a plain, synchronous function which returns a [`RunResult`][pydantic_ai.agent.AgentRunResult] containing a completed response (internally, this just calls `loop.run_until_complete(self.run())`).
3. [`agent.run_stream()`][pydantic_ai.agent.AbstractAgent.run_stream] — an async context manager which returns a [`StreamedRunResult`][pydantic_ai.result.StreamedRunResult], which contains methods to stream text and structured output as an async iterable. [`agent.run_stream_sync()`][pydantic_ai.agent.AbstractAgent.run_stream_sync] is a synchronous variation that returns a [`StreamedRunResultSync`][pydantic_ai.result.StreamedRunResultSync] with synchronous versions of the same methods.
4. [`agent.run_stream_events()`][pydantic_ai.agent.AbstractAgent.run_stream_events] — an async context manager which yields an async iterator over [`AgentStreamEvent`s][pydantic_ai.messages.AgentStreamEvent] ending with an [`AgentRunResultEvent`][pydantic_ai.run.AgentRunResultEvent] containing the final run result.
5. [`agent.iter()`][pydantic_ai.agent.Agent.iter] — a context manager which returns an [`AgentRun`][pydantic_ai.agent.AgentRun], an async iterable over the nodes of the agent's underlying [`Graph`][pydantic_graph.graph_builder.Graph].

Here's a simple example demonstrating the first four:

```python {title="run_agent.py"}
from pydantic_ai import Agent, AgentRunResultEvent, AgentStreamEvent

agent = Agent('openai:gpt-5.2')

result_sync = agent.run_sync('What is the capital of Italy?')
print(result_sync.output)
#> The capital of Italy is Rome.


async def main():
    result = await agent.run('What is the capital of France?')
    print(result.output)
    #> The capital of France is Paris.

    async with agent.run_stream('What is the capital of the UK?') as response:
        async for text in response.stream_text():
            print(text)
            #> The capital of
            #> The capital of the UK is
            #> The capital of the UK is London.

    collected: list[AgentStreamEvent | AgentRunResultEvent] = []
    async with agent.run_stream_events('What is the capital of Mexico?') as events:
        async for event in events:
            collected.append(event)
    print(collected)
    """
    [
        PartStartEvent(index=0, part=TextPart(content='The capital of ')),
        FinalResultEvent(tool_name=None, tool_call_id=None),
        PartDeltaEvent(index=0, delta=TextPartDelta(content_delta='Mexico is Mexico ')),
        PartDeltaEvent(index=0, delta=TextPartDelta(content_delta='City.')),
        PartEndEvent(
            index=0, part=TextPart(content='The capital of Mexico is Mexico City.')
        ),
        AgentRunResultEvent(
            result=AgentRunResult(output='The capital of Mexico is Mexico City.')
        ),
    ]
    """
```

_(To run this example, ensure `asyncio` is imported and add `asyncio.run(main())`; no other changes are needed.)_

You can also pass messages from previous runs to continue a conversation or provide context, as described in [Messages and Chat History](message-history.md).

### Streaming Events and Final Output

As shown in the example above, [`run_stream()`][pydantic_ai.agent.AbstractAgent.run_stream] makes it easy to stream the agent's final output as it comes in.
It also takes an optional `event_stream_handler` argument that you can use to gain insight into what is happening during the run before the final output is produced.
During a realtime session, the same handler stream can also contain realtime-only [`RealtimeEvent`][pydantic_ai.realtime.RealtimeEvent] members.

The example below shows how to stream events and text output. You can also [stream structured output](output.md#streaming-structured-output).

!!! note
    The `run_stream()` and `run_stream_sync()` methods will consider the first output that matches the [output type](output.md#structured-output) (which could be text, an [output tool](output.md#tool-output) call, or a [deferred](deferred-tools.md) tool call) to be the final output of the agent run, even when the model generates (additional) tool calls after this "final" output.

	These "dangling" tool calls will not be executed unless the agent's [`end_strategy`][pydantic_ai.agent.Agent.end_strategy] is set to `'graceful'` or `'exhaustive'`, and even then their results will not be sent back to the model as the agent run will already be considered completed. In short, if the model returns both tool calls and text, and the agent's output type is `str`, **the tool calls will not run** in streaming mode with the default setting.

    If you want to always keep running the agent when it performs tool calls, and stream all events from the model's streaming response and the agent's execution of tools,
    use [`agent.run_stream_events()`][pydantic_ai.agent.AbstractAgent.run_stream_events] or [`agent.iter()`][pydantic_ai.agent.AbstractAgent.iter] instead, as described in the following sections.

```python {title="run_stream_event_stream_handler.py"}
import asyncio
from collections.abc import AsyncIterable
from datetime import date

from pydantic_ai import (
    Agent,
    AgentStreamEvent,
    FinalResultEvent,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    PartDeltaEvent,
    PartStartEvent,
    RunContext,
    TextPartDelta,
    ThinkingPartDelta,
    ToolCallPartDelta,
)

weather_agent = Agent(
    'openai:gpt-5.2',
    system_prompt='Providing a weather forecast at the locations the user provides.',
)


@weather_agent.tool
async def weather_forecast(
    ctx: RunContext,
    location: str,
    forecast_date: date,
) -> str:
    return f'The forecast in {location} on {forecast_date} is 24°C and sunny.'


output_messages: list[str] = []

async def handle_event(event: AgentStreamEvent):
    if isinstance(event, PartStartEvent):
        output_messages.append(f'[Request] Starting part {event.index}: {event.part!r}')
    elif isinstance(event, PartDeltaEvent):
        if isinstance(event.delta, TextPartDelta):
            output_messages.append(f'[Request] Part {event.index} text delta: {event.delta.content_delta!r}')
        elif isinstance(event.delta, ThinkingPartDelta):
            output_messages.append(f'[Request] Part {event.index} thinking delta: {event.delta.content_delta!r}')
        elif isinstance(event.delta, ToolCallPartDelta):
            output_messages.append(f'[Request] Part {event.index} args delta: {event.delta.args_delta}')
    elif isinstance(event, FunctionToolCallEvent):
        output_messages.append(
            f'[Tools] The LLM calls tool={event.part.tool_name!r} with args={event.part.args} (tool_call_id={event.part.tool_call_id!r})'
        )
    elif isinstance(event, FunctionToolResultEvent):
        output_messages.append(f'[Tools] Tool call {event.tool_call_id!r} returned => {event.part.content}')
    elif isinstance(event, FinalResultEvent):
        output_messages.append(f'[Result] The model starting producing a final result (tool_name={event.tool_name})')


async def event_stream_handler(
    ctx: RunContext,
    event_stream: AsyncIterable[AgentStreamEvent],
):
    async for event in event_stream:
        await handle_event(event)

async def main():
    user_prompt = 'What will the weather be like in Paris on Tuesday?'

    async with weather_agent.run_stream(user_prompt, event_stream_handler=event_stream_handler) as run:
        async for output in run.stream_text():
            output_messages.append(f'[Output] {output}')


if __name__ == '__main__':
    asyncio.run(main())

    print(output_messages)
    """
    [
        "[Request] Starting part 0: ToolCallPart(tool_name='weather_forecast', tool_call_id='0001')",
        '[Request] Part 0 args delta: {"location":"Pa',
        '[Request] Part 0 args delta: ris","forecast_',
        '[Request] Part 0 args delta: date":"2030-01-',
        '[Request] Part 0 args delta: 01"}',
        '[Tools] The LLM calls tool=\'weather_forecast\' with args={"location":"Paris","forecast_date":"2030-01-01"} (tool_call_id=\'0001\')',
        "[Tools] Tool call '0001' returned => The forecast in Paris on 2030-01-01 is 24°C and sunny.",
        "[Request] Starting part 0: TextPart(content='It will be ')",
        '[Result] The model starting producing a final result (tool_name=None)',
        '[Output] It will be ',
        '[Output] It will be warm and sunny ',
        '[Output] It will be warm and sunny in Paris on ',
        '[Output] It will be warm and sunny in Paris on Tuesday.',
    ]
    """
```

_(This example is complete, it can be run "as is")_

### Streaming All Events

Like `agent.run_stream()`, [`agent.run()`][pydantic_ai.agent.AbstractAgent.run_stream] takes an optional `event_stream_handler`
argument that lets you stream all events from the model's streaming response and the agent's execution of tools.
Unlike `run_stream()`, it always runs the agent graph to completion even if text was received ahead of tool calls that looked like it could've been the final result.
During a realtime session, an event stream handler can also receive realtime-only [`RealtimeEvent`][pydantic_ai.realtime.RealtimeEvent] members.

For convenience, a [`agent.run_stream_events()`][pydantic_ai.agent.AbstractAgent.run_stream_events] method is also available as a wrapper around `run(event_stream_handler=...)`. It is an async context manager that yields an async iterator over [`AgentStreamEvent`s][pydantic_ai.messages.AgentStreamEvent] ending with an [`AgentRunResultEvent`][pydantic_ai.run.AgentRunResultEvent] carrying the final run result.

!!! note
    As they return raw events as they come in, the `run_stream_events()` and `run(event_stream_handler=...)` methods require you to piece together the streamed text and structured output yourself from the `PartStartEvent` and subsequent `PartDeltaEvent`s.

    To get the best of both worlds, at the expense of some additional complexity, you can use [`agent.iter()`][pydantic_ai.agent.AbstractAgent.iter] as described in the next section, which lets you [iterate over the agent graph](#iterating-over-an-agents-graph) and [stream both events and output](#streaming-all-events-and-output) at every step. See [Making structured responses appear faster](output.md#making-structured-responses-appear-faster) for a focused example using validated structured output.

```python {title="run_events.py" requires="run_stream_event_stream_handler.py"}
import asyncio

from pydantic_ai import AgentRunResultEvent

from run_stream_event_stream_handler import handle_event, output_messages, weather_agent


async def main():
    user_prompt = 'What will the weather be like in Paris on Tuesday?'

    async with weather_agent.run_stream_events(user_prompt) as events:
        async for event in events:
            if isinstance(event, AgentRunResultEvent):
                output_messages.append(f'[Final Output] {event.result.output}')
            else:
                await handle_event(event)

if __name__ == '__main__':
    asyncio.run(main())

    print(output_messages)
    """
    [
        "[Request] Starting part 0: ToolCallPart(tool_name='weather_forecast', tool_call_id='0001')",
        '[Request] Part 0 args delta: {"location":"Pa',
        '[Request] Part 0 args delta: ris","forecast_',
        '[Request] Part 0 args delta: date":"2030-01-',
        '[Request] Part 0 args delta: 01"}',
        '[Tools] The LLM calls tool=\'weather_forecast\' with args={"location":"Paris","forecast_date":"2030-01-01"} (tool_call_id=\'0001\')',
        "[Tools] Tool call '0001' returned => The forecast in Paris on 2030-01-01 is 24°C and sunny.",
        "[Request] Starting part 0: TextPart(content='It will be ')",
        '[Result] The model starting producing a final result (tool_name=None)',
        "[Request] Part 0 text delta: 'warm and sunny '",
        "[Request] Part 0 text delta: 'in Paris on '",
        "[Request] Part 0 text delta: 'Tuesday.'",
        '[Final Output] It will be warm and sunny in Paris on Tuesday.',
    ]
    """
```

_(This example is complete, it can be run "as is")_

### Custom Events

Alongside the framework's own events, a tool or code driving [`agent.iter()`](#iterating-over-an-agents-graph) can emit its own [`CustomEvent`][pydantic_ai.messages.CustomEvent]s into the same stream. This is useful for surfacing progress updates, intermediate results, or status information from long-running work to whoever is consuming the stream, without adding anything to the model's context.

#### Which event type do I use? {#which-event-type}

Pydantic AI has two families of user-defined events. They ride the same stream and are defined the same way, but which one you define is decided by **who owns the code doing the emitting**, and that split is enforced at runtime: emitting the wrong family raises a [`UserError`][pydantic_ai.exceptions.UserError].

| | [`CustomEvent`][pydantic_ai.messages.CustomEvent] | [`CapabilityEvent`][pydantic_ai.messages.CapabilityEvent] |
|---|---|---|
| **Use it when** | your application wants to tell its own stream consumer or frontend something | your [capability](capabilities/overview.md) wants to tell other capabilities and the host application something |
| **Emit from** | an application tool, an [output validator](output.md#output-validator-functions), a [hook](hooks.md), an `event_stream_handler`, or [`AgentRun.emit()`][pydantic_ai.run.AgentRun.emit] | a [capability](capabilities/custom.md) hook or a tool the capability contributes |
| **Naming** | flat and process-wide, like `progress` | namespaced, like `workspace.file_read` |
| **Reaches the frontend** | yes, via the [AG-UI](ui/ag-ui.md) and [Vercel AI](ui/vercel-ai.md) adapters | no, it is an internal signal; re-publish it as a `CustomEvent` if the frontend needs it |
| **Can carry a decision** | no | yes, with `dispatch='immediate'` |

If you are writing a **capability**, define [`CapabilityEvent`][pydantic_ai.messages.CapabilityEvent]s, as described in [Capability events](capabilities/overview.md#capability-events): its events are part of its contract with the rest of the run, and the namespace is what keeps two capabilities from colliding on a name. If you are writing an **application**, define `CustomEvent`s. To surface a capability's event to your frontend, listen for it with [`@agent.on_event`](hooks.md#listening-without-a-hooks-capability) and emit your own `CustomEvent` carrying the public payload.

#### Defining and emitting an event

Define an event as a dataclass subclass of `CustomEvent` — its fields are the payload, and consumers can use an `isinstance` check against the class. Await [`ctx.emit()`][pydantic_ai.tools.RunContext.emit] with an event instance from any of your application's async code that receives a [`RunContext`][pydantic_ai.tools.RunContext]; code driving `agent.iter()` uses [`AgentRun.emit()`][pydantic_ai.run.AgentRun.emit] instead. Sync tools cannot emit events; write async tools when they need to emit events. When emitted from within a tool call, the event's [`tool_call_id`][pydantic_ai.messages.CustomEvent.tool_call_id] and [`tool_name`][pydantic_ai.messages.CustomEvent.tool_name] are stamped automatically so consumers can attribute it to the originating call. The event reaches the `event_stream_handler`, `run_stream_events()`, `agent.iter()` streaming, and the [AG-UI](ui/ag-ui.md) and [Vercel AI](ui/vercel-ai.md) UI adapters.

```python {title="custom_events.py"}
from collections.abc import AsyncIterator
from dataclasses import dataclass

from pydantic_ai import Agent, CustomEvent, RunContext
from pydantic_ai.messages import ModelMessage, ToolReturnPart
from pydantic_ai.models.function import (
    AgentInfo,
    DeltaToolCall,
    DeltaToolCalls,
    FunctionModel,
)


@dataclass(kw_only=True)
class SyncProgressEvent(CustomEvent):
    done: int
    total: int


async def model_function(
    messages: list[ModelMessage], info: AgentInfo
) -> AsyncIterator[DeltaToolCalls | str]:
    if any(
        isinstance(part, ToolReturnPart)
        for message in messages
        for part in message.parts
    ):
        yield 'All 3 files synchronized.'
    else:
        yield {
            0: DeltaToolCall(
                name='sync_files', json_args='{"count": 3}', tool_call_id='sync'
            )
        }


agent = Agent(FunctionModel(stream_function=model_function))
progress: list[str] = []


@agent.on_event(SyncProgressEvent)
async def record_progress(ctx: RunContext, event: SyncProgressEvent) -> None:
    progress.append(
        f'{event.done}/{event.total} from {event.tool_name} ({event.tool_call_id})'
    )


@agent.tool
async def sync_files(ctx: RunContext, count: int) -> str:
    for i in range(1, count + 1):
        # Do some long-running work, emitting a progress event after each step.
        await ctx.emit(SyncProgressEvent(done=i, total=count))
    return f'Synchronized {count} files.'


async def main():
    await agent.run('Synchronize my files')
    print(progress)
    """
    [
        '1/3 from sync_files (sync)',
        '2/3 from sync_files (sync)',
        '3/3 from sync_files (sync)',
    ]
    """
```

_(This example is complete, it can be run "as is" — you'll need to add `asyncio.run(main())` to run `main`)_

Any consumer of the run's events sees them: an [`@agent.on_event`](hooks.md#listening-without-a-hooks-capability) listener as above, an [event hook](hooks.md#event-stream-hooks), an `event_stream_handler=`, [`run_stream_events()`][pydantic_ai.agent.AbstractAgent.run_stream_events], `agent.iter()` streaming, and the [AG-UI](ui/ag-ui.md) and [Vercel AI](ui/vercel-ai.md) adapters. Payload fields can hold any object, but to flow through [durable execution](durable_execution/overview.md) and the UI adapters they need to be serializable by pydantic.

The payload cannot use the field names the envelope needs for itself: `data`, `tool_call_id`, `tool_name`, and `event_kind` are rejected when the class is defined, so pick another name (`payload`, `call_id`) for a field that would collide.

Emitting only works while the run is in progress and only from the family the emitting code owns, so each of these raises a [`UserError`][pydantic_ai.exceptions.UserError]: emitting a `CustomEvent` from a capability, emitting a [`CapabilityEvent`][pydantic_ai.messages.CapabilityEvent] from application code, and calling [`AgentRun.emit()`][pydantic_ai.run.AgentRun.emit] after the run has finished. Events emitted with `AgentRun.emit()` reach consumers that stream the run's nodes with `node.stream(run.ctx)`, as shown in [Streaming All Events and Output](#streaming-all-events-and-output); a bare `async for node in run` does not consume any event stream, so nothing surfaces.

An event is delivered to stream consumers as soon as it is emitted, so a progress event surfaces while the emitting tool is still running rather than at its return. Events emitted from tools running concurrently interleave in emission order (best-effort ordering).

Events that share fields can share a base. Give the base its own `@dataclass` decorator — an undecorated one contributes no fields, which is rejected rather than left to surface as a payload quietly missing them — and mark it `abstract=True` so it stays out of the event registry and can't be emitted itself:

```python {title="shared_event_base.py" noqa="F841"}
from dataclasses import dataclass

from pydantic_ai import CustomEvent


@dataclass(kw_only=True)
class AppEvent(CustomEvent, abstract=True):
    request_id: str


@dataclass(kw_only=True)
class ReindexProgressEvent(AppEvent):
    done: int
    total: int
```

[`CapabilityEvent`](capabilities/overview.md#capability-events) bases work the same way, and a base is the natural place to put the family's `namespace=`.

Custom event names are derived from the class name by removing `Event` and converting the rest to snake case, so `SyncProgressEvent` uses `sync_progress`. Override the name with a class argument, for example `class SyncProgressEvent(CustomEvent, name='sync_status')`. Names are registered when the class is defined and must be unique within the process; re-executing the same class definition (as when re-running a notebook cell) replaces the registration.

The name is the event's wire identifier, not just a label: it's what a serialized event carries, so renaming the class renames the tag along with it. A rename is a compatibility break wherever events outlive the process that emitted them — [durable execution](durable_execution/overview.md) histories and caches, persisted event logs, a frontend matching on the name. Pass an explicit `name=` to pin the tag when you want the class free to be renamed.

Spell the name out as well when the tag has to match something you don't control. It's the identifier the UI adapters put on the wire, as the AG-UI event's `name` and the Vercel AI chunk's `data-{name}` type, and derivation only ever produces snake case: a frontend that already expects `data-indexProgress` or a dotted `ui.progress` needs `name='indexProgress'` or `name='ui.progress'` rather than a class renamed to suit it.

Events round-trip through [`AgentStreamEvent`][pydantic_ai.messages.AgentStreamEvent] serialization as their original class. If an event is deserialized before its class is registered, it becomes an [`UnknownCustomEvent`][pydantic_ai.messages.UnknownCustomEvent], with its payload preserved in `data`, and a `UserWarning` is emitted. Import the module that defines your event before creating the adapter that deserializes it; each pydantic `TypeAdapter` captures the event classes registered when it is created. A registered event's payload schema follows the same compatibility expectations as [message](message-history.md) types: a payload that no longer validates against the local class fails loudly rather than degrading, so keep the serializing and deserializing sides on compatible versions of the module that defines the event.

Event names share one application-wide registry, and defining a second class with an already-registered name raises immediately. Custom events belong to the application, so a library that emits events into agent runs should define [capability events](capabilities/overview.md#capability-events) on a capability, which are namespaced. Only a library that reaches the run outside a capability -- a bare tool it hands the user to register -- can emit application-level events at all, and it should then register them under a dotted prefix (`name='mylib.progress'`) so they can't collide with the application's own event names.

UI adapters get the frontend payload by calling [`CustomEvent.to_payload()`][pydantic_ai.messages.CustomEvent.to_payload], which defaults to the event's own fields; override it when the UI should receive a different payload.

Custom events are forwarded to the frontend by default, as the application that emits them is also the one serving that frontend. An event that exists only for server-side consumers — metrics, an audit log, an `event_stream_handler` of your own — opts out with `ui=False`, and then reaches every in-process consumer while the [AG-UI](ui/ag-ui.md) and [Vercel AI](ui/vercel-ai.md) adapters skip it:

```python {title="internal_custom_event.py" noqa="F841"}
from dataclasses import dataclass

from pydantic_ai import CustomEvent


@dataclass(kw_only=True)
class IndexProgressEvent(CustomEvent, ui=False):
    done: int
    total: int
```

Subclasses inherit the setting, and because the check happens before the protocol-specific handler, adapters for other protocols honor it too. To send a *different* payload rather than nothing, override `to_payload()` instead — returning `None` from it sends an event with a null payload, which is how you send a name-only signal.

The flag lives on the class rather than on the wire, so an event deserialized where its defining module hasn't been imported arrives as an [`UnknownCustomEvent`][pydantic_ai.messages.UnknownCustomEvent] whose `ui` says nothing about what the application declared. Those aren't forwarded either, so an event crossing a process boundary can't leak a payload its class had opted out of. If events reach your frontend from another process — a [durable execution](durable_execution/overview.md) workflow, a queue, a websocket fan-out, as in [encoding events without a request](ui/overview.md#encoding-events-without-a-request) — import the modules that define them there, or none of your custom events will reach the frontend.

### Iterating Over an Agent's Graph

Under the hood, each `Agent` in Pydantic AI uses **pydantic-graph** to manage its execution flow. **pydantic-graph** is a generic, type-centric library for building and running finite state machines in Python. It doesn't actually depend on Pydantic AI — you can use it standalone for workflows that have nothing to do with GenAI — but Pydantic AI makes use of it to orchestrate the handling of model requests and model responses in an agent's run.

In many scenarios, you don't need to worry about pydantic-graph at all; calling `agent.run(...)` simply traverses the underlying graph from start to finish. However, if you need deeper insight or control — for example to inject your own logic at specific stages — Pydantic AI exposes the lower-level iteration process via [`Agent.iter`][pydantic_ai.agent.Agent.iter]. This method returns an [`AgentRun`][pydantic_ai.agent.AgentRun], which you can async-iterate over, or manually drive node-by-node via the [`next`][pydantic_ai.agent.AgentRun.next] method. Once the agent's graph returns an [`End`][pydantic_graph.basenode.End], you have the final result along with a detailed history of all steps.

#### `async for` iteration

Here's an example of using `async for` with `iter` to record each node the agent executes:

```python {title="agent_iter_async_for.py"}
from pydantic_ai import Agent

agent = Agent('openai:gpt-5.2')


async def main():
    nodes = []
    # Begin an AgentRun, which is an async-iterable over the nodes of the agent's graph
    async with agent.iter('What is the capital of France?') as agent_run:
        async for node in agent_run:
            # Each node represents a step in the agent's execution
            nodes.append(node)
    print(nodes)
    """
    [
        UserPromptNode(
            user_prompt='What is the capital of France?',
            instructions_functions=[],
            system_prompts=(),
            system_prompt_functions=[],
            system_prompt_dynamic_functions={},
        ),
        ModelRequestNode(
            request=ModelRequest(
                parts=[
                    UserPromptPart(
                        content='What is the capital of France?',
                        timestamp=datetime.datetime(...),
                    )
                ],
                timestamp=datetime.datetime(...),
                run_id='...',
                conversation_id='...',
            )
        ),
        CallToolsNode(
            model_response=ModelResponse(
                parts=[TextPart(content='The capital of France is Paris.')],
                usage=RequestUsage(
                    cost=Decimal('0.000196'), input_tokens=56, output_tokens=7
                ),
                model_name='gpt-5.2',
                timestamp=datetime.datetime(...),
                run_id='...',
                conversation_id='...',
            )
        ),
        End(data=FinalResult(output='The capital of France is Paris.')),
    ]
    """
    print(agent_run.result.output)
    #> The capital of France is Paris.
```

_(To run this example, ensure `asyncio` is imported and add `asyncio.run(main())`; no other changes are needed.)_

- The `AgentRun` is an async iterator that yields each node (`BaseNode` or `End`) in the flow.
- The run ends when an `End` node is returned.

#### Using `.next(...)` manually

You can also drive the iteration manually by passing the node you want to run next to the `AgentRun.next(...)` method. This allows you to inspect or modify the node before it executes or skip nodes based on your own logic, and to catch errors in `next()` more easily:

```python {title="agent_iter_next.py"}
from pydantic_ai import Agent
from pydantic_graph import End

agent = Agent('openai:gpt-5.2')


async def main():
    async with agent.iter('What is the capital of France?') as agent_run:
        node = agent_run.next_node  # (1)!

        all_nodes = [node]

        # Drive the iteration manually:
        while not isinstance(node, End):  # (2)!
            node = await agent_run.next(node)  # (3)!
            all_nodes.append(node)  # (4)!

        print(all_nodes)
        """
        [
            UserPromptNode(
                user_prompt='What is the capital of France?',
                instructions_functions=[],
                system_prompts=(),
                system_prompt_functions=[],
                system_prompt_dynamic_functions={},
            ),
            ModelRequestNode(
                request=ModelRequest(
                    parts=[
                        UserPromptPart(
                            content='What is the capital of France?',
                            timestamp=datetime.datetime(...),
                        )
                    ],
                    timestamp=datetime.datetime(...),
                    run_id='...',
                    conversation_id='...',
                )
            ),
            CallToolsNode(
                model_response=ModelResponse(
                    parts=[TextPart(content='The capital of France is Paris.')],
                    usage=RequestUsage(
                        cost=Decimal('0.000196'), input_tokens=56, output_tokens=7
                    ),
                    model_name='gpt-5.2',
                    timestamp=datetime.datetime(...),
                    run_id='...',
                    conversation_id='...',
                )
            ),
            End(data=FinalResult(output='The capital of France is Paris.')),
        ]
        """
```

1. We start by grabbing the first node that will be run in the agent's graph.
2. The agent run is finished once an `End` node has been produced; instances of `End` cannot be passed to `next`.
3. When you call `await agent_run.next(node)`, it executes that node in the agent's graph, updates the run's history, and returns the _next_ node to run.
4. You could also inspect or mutate the new `node` here as needed.

_(To run this example, ensure `asyncio` is imported and add `asyncio.run(main())`; no other changes are needed.)_

#### Accessing usage and final output

You can retrieve usage statistics (tokens, requests, etc.) at any time from the [`AgentRun`][pydantic_ai.agent.AgentRun] object via `agent_run.usage`. This property returns a [`RunUsage`][pydantic_ai.usage.RunUsage] object containing the usage data.

[`RunUsage.cost`][pydantic_ai.usage.RunUsage.cost] additionally holds a best-effort estimate of the run's total cost in USD, calculated from each request's usage with [genai-prices](https://github.com/pydantic/genai-prices). Requests to models or providers that genai-prices doesn't have pricing data for don't contribute to the total. See [keeping model prices up to date](#keeping-model-prices-up-to-date) for how to price models released after your install.

Once the run finishes, `agent_run.result` becomes an [`AgentRunResult`][pydantic_ai.agent.AgentRunResult] object containing the final output (and related metadata).

#### Streaming All Events and Output

Here is an example of streaming an agent run in combination with `async for` iteration:

```python {title="streaming_iter.py"}
import asyncio
from dataclasses import dataclass
from datetime import date

from pydantic_ai import (
    Agent,
    FinalResultEvent,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    PartDeltaEvent,
    PartStartEvent,
    RunContext,
    TextPartDelta,
    ThinkingPartDelta,
    ToolCallPartDelta,
)


@dataclass
class WeatherService:
    async def get_forecast(self, location: str, forecast_date: date) -> str:
        # In real code: call weather API, DB queries, etc.
        return f'The forecast in {location} on {forecast_date} is 24°C and sunny.'

    async def get_historic_weather(self, location: str, forecast_date: date) -> str:
        # In real code: call a historical weather API or DB
        return f'The weather in {location} on {forecast_date} was 18°C and partly cloudy.'


weather_agent = Agent[WeatherService, str](
    'openai:gpt-5.2',
    deps_type=WeatherService,
    output_type=str,  # We'll produce a final answer as plain text
    system_prompt='Providing a weather forecast at the locations the user provides.',
)


@weather_agent.tool
async def weather_forecast(
    ctx: RunContext[WeatherService],
    location: str,
    forecast_date: date,
) -> str:
    if forecast_date >= date.today():
        return await ctx.deps.get_forecast(location, forecast_date)
    else:
        return await ctx.deps.get_historic_weather(location, forecast_date)


output_messages: list[str] = []


async def main():
    user_prompt = 'What will the weather be like in Paris on Tuesday?'

    # Begin a node-by-node, streaming iteration
    async with weather_agent.iter(user_prompt, deps=WeatherService()) as run:
        async for node in run:
            if Agent.is_user_prompt_node(node):
                # A user prompt node => The user has provided input
                output_messages.append(f'=== UserPromptNode: {node.user_prompt} ===')
            elif Agent.is_model_request_node(node):
                # A model request node => We can stream tokens from the model's request
                output_messages.append('=== ModelRequestNode: streaming partial request tokens ===')
                async with node.stream(run.ctx) as request_stream:
                    final_result_found = False
                    async for event in request_stream:
                        if isinstance(event, PartStartEvent):
                            output_messages.append(f'[Request] Starting part {event.index}: {event.part!r}')
                        elif isinstance(event, PartDeltaEvent):
                            if isinstance(event.delta, TextPartDelta):
                                output_messages.append(
                                    f'[Request] Part {event.index} text delta: {event.delta.content_delta!r}'
                                )
                            elif isinstance(event.delta, ThinkingPartDelta):
                                output_messages.append(
                                    f'[Request] Part {event.index} thinking delta: {event.delta.content_delta!r}'
                                )
                            elif isinstance(event.delta, ToolCallPartDelta):
                                output_messages.append(
                                    f'[Request] Part {event.index} args delta: {event.delta.args_delta}'
                                )
                        elif isinstance(event, FinalResultEvent):
                            output_messages.append(
                                f'[Result] The model started producing a final result (tool_name={event.tool_name})'
                            )
                            final_result_found = True
                            break

                    if final_result_found:
                        # Once the final result is found, we can call `AgentStream.stream_text()` to stream the text.
                        # A similar `AgentStream.stream_output()` method is available to stream structured output.
                        async for output in request_stream.stream_text():
                            output_messages.append(f'[Output] {output}')
            elif Agent.is_call_tools_node(node):
                # A handle-response node => The model returned some data, potentially calls a tool
                output_messages.append('=== CallToolsNode: streaming partial response & tool usage ===')
                async with node.stream(run.ctx) as handle_stream:
                    async for event in handle_stream:
                        if isinstance(event, FunctionToolCallEvent):
                            output_messages.append(
                                f'[Tools] The LLM calls tool={event.part.tool_name!r} with args={event.part.args} (tool_call_id={event.part.tool_call_id!r})'
                            )
                        elif isinstance(event, FunctionToolResultEvent):
                            output_messages.append(
                                f'[Tools] Tool call {event.tool_call_id!r} returned => {event.part.content}'
                            )
            elif Agent.is_end_node(node):
                # Once an End node is reached, the agent run is complete
                assert run.result is not None
                assert run.result.output == node.data.output
                output_messages.append(f'=== Final Agent Output: {run.result.output} ===')


if __name__ == '__main__':
    asyncio.run(main())

    print(output_messages)
    """
    [
        '=== UserPromptNode: What will the weather be like in Paris on Tuesday? ===',
        '=== ModelRequestNode: streaming partial request tokens ===',
        "[Request] Starting part 0: ToolCallPart(tool_name='weather_forecast', tool_call_id='0001')",
        '[Request] Part 0 args delta: {"location":"Pa',
        '[Request] Part 0 args delta: ris","forecast_',
        '[Request] Part 0 args delta: date":"2030-01-',
        '[Request] Part 0 args delta: 01"}',
        '=== CallToolsNode: streaming partial response & tool usage ===',
        '[Tools] The LLM calls tool=\'weather_forecast\' with args={"location":"Paris","forecast_date":"2030-01-01"} (tool_call_id=\'0001\')',
        "[Tools] Tool call '0001' returned => The forecast in Paris on 2030-01-01 is 24°C and sunny.",
        '=== ModelRequestNode: streaming partial request tokens ===',
        "[Request] Starting part 0: TextPart(content='It will be ')",
        '[Result] The model started producing a final result (tool_name=None)',
        '[Output] It will be ',
        '[Output] It will be warm and sunny ',
        '[Output] It will be warm and sunny in Paris on ',
        '[Output] It will be warm and sunny in Paris on Tuesday.',
        '=== CallToolsNode: streaming partial response & tool usage ===',
        '=== Final Agent Output: It will be warm and sunny in Paris on Tuesday. ===',
    ]
    """
```

_(This example is complete, it can be run "as is")_

### Cancelling a Run

A run in flight can be cancelled entirely -- e.g. when a user hits a "stop" button. Create a [`CancellationToken`][pydantic_ai.CancellationToken], pass it to the run, and call `cancel()` from the stop handler. Cancellation raises [`RunCancelled`][pydantic_ai.exceptions.RunCancelled] with the completed message history and usage so you can persist and resume the conversation:

```python {title="run_cancel.py"}
import asyncio

from pydantic_ai import Agent, CancellationToken, RunCancelled

agent = Agent('test')
tool_started = asyncio.Event()


@agent.tool_plain
async def slow_lookup() -> str:
    tool_started.set()
    await asyncio.sleep(10)
    return 'result'


async def main():
    token = CancellationToken()
    run = asyncio.create_task(
        agent.run('Look something up', cancellation_token=token)
    )
    await tool_started.wait()
    token.cancel()  # (1)!

    try:
        await run
    except RunCancelled as exc:
        messages = exc.all_messages()
        print(f'Cancelled after {len(messages)} messages')
        #> Cancelled after 3 messages
        await agent.run(message_history=messages)  # (2)!
```

1. `cancel()` is idempotent and thread-safe. One token may govern multiple concurrent runs, cancelling all of them. A token is single-use: once cancelled it stays cancelled, and passing an already-cancelled token to a run prevents that run from starting (which also closes the "cancel raced ahead of the run" gap). So mint a fresh token per run or per stop gesture -- reusing one token across a session would cancel every run after the first before it starts.
2. [`RunCancelled.all_messages()`][pydantic_ai.exceptions.RunCancelled.all_messages] contains everything completed before cancellation, including completed tool results. Any dangling tool call is [repaired automatically](message-history.md#making-histories-provider-valid) when the history is resumed.

[UI adapter](ui/overview.md) users can persist this resumable history with the `on_cancel` callback.

_(To run this example, ensure `asyncio` is imported and add `asyncio.run(main())`; no other changes are needed.)_

[`agent.run_sync()`][pydantic_ai.agent.AbstractAgent.run_sync] accepts the same token. Calling `token.cancel()` from another thread is the only way to interrupt a synchronous run while it is blocked.

!!! note "Which mechanism, and which exception"
    A [`CancellationToken`][pydantic_ai.CancellationToken] is the one to reach for by default -- it's the only surface that works from outside the run, from another thread, and against `run_sync()`, and one token can govern several runs at once. The others exist for where a token can't reach:

    | Where you are when you cancel | Use | Run ends with |
    | --- | --- | --- |
    | Outside the run (a "stop" button, another thread) | [`CancellationToken`][pydantic_ai.CancellationToken] | [`RunCancelled`][pydantic_ai.exceptions.RunCancelled] |
    | Inside a tool, `event_stream_handler`, or capability hook | [`RunContext.cancel()`][pydantic_ai.tools.RunContext.cancel] | [`RunCancelled`][pydantic_ai.exceptions.RunCancelled] |
    | Consuming [`run_stream_events()`][pydantic_ai.agent.AbstractAgent.run_stream_events] | [`AgentRunEvents.cancel()`][pydantic_ai.agent.AgentRunEvents.cancel] on the yielded handle | [`RunCancelled`][pydantic_ai.exceptions.RunCancelled] |
    | Driving the graph yourself via [`agent.iter()`][pydantic_ai.agent.Agent.iter] | [`AgentRun.cancel()`][pydantic_ai.run.AgentRun.cancel] | [`RunCancelled`][pydantic_ai.exceptions.RunCancelled] |
    | The environment cancelled you (`asyncio.timeout()`, a [`TaskGroup`][asyncio.TaskGroup], shutdown) | *(you don't call anything)* | [`CancelledError`][asyncio.CancelledError] |

    The first four are **first-party**: Pydantic AI stops the run itself and raises `RunCancelled`, an ordinary catchable exception carrying the resumable history. The last is **external**: the `CancelledError` keeps propagating unchanged -- so `asyncio.timeout()` still raises `TimeoutError`, a `TaskGroup` still tears down, and Temporal still ends the workflow *Cancelled* -- with the same history *attached* for [`RunCancelled.from_cancellation()`][pydantic_ai.exceptions.RunCancelled.from_cancellation]. Pydantic AI can't turn an external `CancelledError` into `RunCancelled` without breaking those semantics; that's why cancellation has two kinds, covered next.

When the surrounding environment cancels the run -- for example through `asyncio.timeout()`, a [`TaskGroup`][asyncio.TaskGroup], or application shutdown -- the [`CancelledError`][asyncio.CancelledError] remains unchanged. [`RunCancelled.from_cancellation()`][pydantic_ai.exceptions.RunCancelled.from_cancellation] provides the attached run state:

```python {title="run_external_cancel.py"}
import asyncio

from pydantic_ai import Agent, RunCancelled

agent = Agent('test')
tool_started = asyncio.Event()


@agent.tool_plain
async def slow_lookup() -> str:
    tool_started.set()
    await asyncio.sleep(10)
    return 'result'


async def main():
    task = asyncio.create_task(agent.run('Look something up'))
    await tool_started.wait()
    task.cancel()  # (1)!

    try:
        await task
    except asyncio.CancelledError as exc:
        cancelled = RunCancelled.from_cancellation(exc)  # (2)!
        assert cancelled is not None
        messages = cancelled.all_messages()
        print(f'Cancelled after {len(messages)} messages')
        #> Cancelled after 3 messages
        await agent.run(message_history=messages)  # (3)!
```

1. This demonstrates cancellation imposed by the surrounding asyncio environment. For application stop gestures, prefer a `CancellationToken`.
2. External cancellation is never converted: `asyncio.timeout()`, [`TaskGroup`][asyncio.TaskGroup], and [Temporal](durable_execution/temporal.md) cancellation semantics are preserved. The run state rides along on the original `CancelledError`.
3. [`RunCancelled.all_messages()`][pydantic_ai.exceptions.RunCancelled.all_messages] contains everything completed before cancellation, including completed tool results. Any dangling tool call is [repaired automatically](message-history.md#making-histories-provider-valid) when the history is resumed.

_(To run this example, ensure `asyncio` is imported and add `asyncio.run(main())`; no other changes are needed.)_

On Python 3.10, asyncio recreates `CancelledError` across an `await task` boundary, but chains the original exception -- carrying the attached run state -- via `__context__`, which `from_cancellation()` traverses. The chain is attached only to the first `await` of the cancelled task, so later awaits of the same task see an unchained exception; [`capture_run_messages()`][pydantic_ai.agent.capture_run_messages] is the fallback when only history is needed.

When consuming [`run_stream_events()`][pydantic_ai.agent.AbstractAgent.run_stream_events], the yielded [`AgentRunEvents`][pydantic_ai.agent.AgentRunEvents] handle offers a first-party alternative that needs no task juggling: [`AgentRunEvents.cancel()`][pydantic_ai.agent.AgentRunEvents.cancel] is safe to call from another task (e.g. a UI's "stop" handler) and surfaces as `RunCancelled` on continued iteration:

```python {title="run_cancel_stream_events.py"}
from pydantic_ai import Agent, RunCancelled

agent = Agent('test')


async def main():
    async with agent.run_stream_events('Write a long essay about Python') as events:
        try:
            async for _event in events:
                events.cancel()  # (1)!
        except RunCancelled as exc:
            print(f'Cancelled after {len(exc.all_messages())} messages')
            #> Cancelled after 2 messages
```

1. Idempotent, a no-op once the run has finished, and callable before the first iteration to prevent the run from starting at all.

_(To run this example, ensure `asyncio` is imported and add `asyncio.run(main())`; no other changes are needed.)_

Externally cancelling the consuming task works here too: the background run tears down, the propagating `CancelledError` carries the run state for `from_cancellation()`, and the handle's `all_messages()` and `usage` remain accessible afterwards.

To request cancellation from a tool, an `event_stream_handler`, or a capability hook, call [`RunContext.cancel()`][pydantic_ai.tools.RunContext.cancel]. This requests first-party cancellation, so the run ends with [`RunCancelled`][pydantic_ai.exceptions.RunCancelled] rather than an external `CancelledError`. `cancel()` itself returns normally — the cancellation is delivered at the calling code's next `await`, and the tool's return value is discarded — so a tool can still run cleanup after requesting it:

```python {title="run_cancel_from_tool.py"}
from pydantic_ai import Agent, RunCancelled, RunContext

agent = Agent('test')


@agent.tool
async def stop(ctx: RunContext) -> str:
    ctx.cancel()
    return 'discarded'  # cancel() returned; this value is never sent to the model


async def main():
    try:
        await agent.run('Stop now')
    except RunCancelled as exc:
        print(f'Cancelled after {len(exc.all_messages())} messages')
        #> Cancelled after 2 messages
```

!!! note "Cancellation is cooperative"
    Pydantic AI requests cancellation of in-flight work, discards results that arrive after cancellation, and closes the resources it owns. Async tools receive `CancelledError` at a suspension point. A synchronous (`def`) tool runs in a worker thread, which Python cannot safely terminate; depending on the run mode, cancellation may wait for the worker or let it finish in the background. Either way, its result is discarded, but any side effects are not rolled back. Cancelling provider-side model generation is best-effort and depends on the provider.

You may not control which way cancellation will arrive: a caller wraps `agent.run()` in a task for a stop gesture, while a tool -- perhaps from another library -- calls `ctx.cancel()` internally. Handle each on its own terms -- consume the first-party `RunCancelled`, but let an external `CancelledError` keep propagating so timeouts and task groups still tear down correctly, capturing its state first if you need it:

```python {title="run_cancel_either_way.py"}
import asyncio

from pydantic_ai import Agent, RunCancelled, RunContext

agent = Agent('test')


@agent.tool
async def imported_tool(ctx: RunContext) -> str:
    ctx.cancel()  # (1)!
    return 'discarded'


async def main():
    task = asyncio.create_task(agent.run('Go'))
    try:
        await task
    except RunCancelled as exc:  # (2)!
        print(f'Cancelled after {len(exc.all_messages())} messages')
        #> Cancelled after 2 messages
    except asyncio.CancelledError as exc:  # (3)!
        cancelled = RunCancelled.from_cancellation(exc)
        if cancelled is not None:
            ...  # persist cancelled.all_messages() before re-raising
        raise
```

1. Here the tool cancels first-party, so `await task` raises `RunCancelled`. Had a stop button called `task.cancel()` instead, `await task` would raise `CancelledError` and the second handler would run.
2. First-party cancellation is a `RunCancelled` you can consume: the run stopped because your own code asked it to, so returning normally is fine.
3. External cancellation stays `CancelledError`, and a stop button's `task.cancel()` is indistinguishable from a timeout or a [`TaskGroup`][asyncio.TaskGroup] tearing down -- so re-raise it (swallowing it would break those teardowns), reaching for [`from_cancellation()`][pydantic_ai.exceptions.RunCancelled.from_cancellation] only to capture the partial state first. It returns `None` when nothing is attached, e.g. an application shutdown unrelated to this run.

_(To run this example, ensure `asyncio` is imported and add `asyncio.run(main())`; no other changes are needed.)_

!!! note "Why two exception types?"
    Cancellation can originate from two different places, and only one of them is Pydantic AI's to name:

    - **Your application** decides to stop the run, through one of the dedicated cancellation methods. Pydantic AI issued that cancellation itself, so it can consume it before asyncio interprets it and raise `RunCancelled` instead: the run ends with an ordinary, catchable application error.
    - **The asyncio environment** cancels the task the run happens to be on: `asyncio.Task.cancel()`, `asyncio.timeout()` expiring, a [`TaskGroup`][asyncio.TaskGroup] tearing down after a sibling failed, a server shutting down, workflow cancellation under [durable execution](durable_execution/overview.md). All of these deliver the very same `CancelledError` signal, so Pydantic AI cannot tell a stop button from a timeout -- and the exception's type is load-bearing for everything built on it: `asyncio.timeout()` only produces `TimeoutError`, a `TaskGroup` only treats the task as cleanly cancelled, and Temporal only ends the workflow as *Cancelled* if `CancelledError` itself keeps propagating. Raising `RunCancelled` in its place would silently break each of those. So the run state is *attached to* the propagating `CancelledError` for [`from_cancellation()`][pydantic_ai.exceptions.RunCancelled.from_cancellation], rather than replacing it.

Cancellation is terminal: capability hooks may observe it and clean up, but cannot recover the run to success — on Python 3.11+ this holds even if user code absorbs the delivered cancellation; on Python 3.10 it is best-effort. When first-party and external cancellation race, external cancellation wins. On Python 3.10, that race cannot be distinguished, so first-party cancellation wins instead.

For fine-grained control over the agent graph, call [`AgentRun.cancel()`][pydantic_ai.run.AgentRun.cancel] on the handle returned by [`agent.iter()`][pydantic_ai.agent.Agent.iter]:

```python {title="run_cancel_iter.py"}
from pydantic_ai import Agent, RunCancelled

agent = Agent('test')


async def main():
    try:
        async with agent.iter('Write a long essay about Python') as agent_run:
            async for node in agent_run:
                if Agent.is_call_tools_node(node):
                    agent_run.cancel()  # (1)!
    except RunCancelled as exc:
        print(f'Cancelled after {len(exc.all_messages())} messages')  # (2)!
        #> Cancelled after 2 messages
```

1. `AgentRun.cancel()` is safe to call from another task and is a no-op once the run has finished.
2. Inside the `agent.iter()` block, cancellation surfaces as `asyncio.CancelledError`; after the context exits, first-party cancellation raises `RunCancelled` with a detached state snapshot.

_(To run this example, ensure `asyncio` is imported and add `asyncio.run(main())`; no other changes are needed.)_

#### Message History After Cancellation

When a stream is cancelled mid-generation, the response is recorded with `state='interrupted'` in the message history. The history includes any partial content that was received before cancellation:

```python {title="stream_cancel_history.py"}
from pydantic_ai import Agent

agent = Agent('openai:gpt-5.2')


async def main():
    async with agent.run_stream('Tell me about Python') as result:
        async for text in result.stream_text(delta=True):
            break
        await result.cancel()

    messages = result.all_messages()  # (1)!
    print(messages[-1].state)  # (2)!
    #> interrupted
```

1. The message history includes the interrupted response with any partial content that was received before cancellation.
2. The interrupted response state lets your application decide whether to keep, inspect, or discard the partial response before reusing the history.

_(To run this example, ensure `asyncio` is imported and add `asyncio.run(main())`; no other changes are needed.)_

!!! note "Reusing interrupted history"
    Interrupted history can be passed directly into another run. Before the next model request, Pydantic AI [repairs the transcript](message-history.md#making-histories-provider-valid): any tool call that never received a result — including one whose arguments were cut off mid-stream — is answered with a synthesized [`ToolReturnPart`][pydantic_ai.messages.ToolReturnPart] telling the model it was interrupted.

!!! info "Usage tracking for cancelled streams"
    Token usage reported by `usage` after cancellation is partial and provider-dependent. Pydantic AI stops pulling from the stream immediately, so final usage events may never arrive; some provider SDKs may also continue generation server-side after the local stream is closed. Do not rely on cancelled-stream usage for cost-critical accounting.
    For OpenAI chat completions, [`openai_continuous_usage_stats`][pydantic_ai.models.openai.OpenAIChatModelSettings] can improve in-stream usage reporting by requesting cumulative usage data with each chunk, but cancelled-stream usage is still best-effort.

#### Cancellation and sub-agents

Cancellation is **run-scoped**: `cancel()` cancels the run its `RunContext` belongs to, and a `CancellationToken` cancels the runs it's attached to. This matters when you use [agent delegation](multi-agent-applications.md#agent-delegation) — a tool that runs another agent with `await sub_agent.run(...)`:

- **A sub-agent cancelling itself does not cancel the parent** — when it's `await`ed inside a tool body. If the sub-agent (or one of its tools) calls `ctx.cancel()`, that cancels the *sub-agent's* run. The delegate tool sees a [`RunCancelled`][pydantic_ai.exceptions.RunCancelled], which — if it isn't caught — surfaces to the parent as a *failed tool return* the parent's model can react to, not as a cancellation of the parent run. This isolation is specific to tool bodies: a sub-agent `await`ed from an `event_stream_handler`, an [output validator](output.md#output-validator-functions), or a [capability](capabilities/overview.md) hook runs directly on the parent's task, so its `cancel()` *does* surface as the parent's own `RunCancelled`.
- **To cancel the parent too, opt in from the delegate tool** by catching `RunCancelled` and calling `ctx.cancel()` on the parent's context (or re-raising a different error).
- **To cancel a whole tree of runs at once, share one `CancellationToken`** across the parent and its sub-agents — cancelling it stops all of them. A parent cancelled this way (or by an external `asyncio.CancelledError`) also tears down any sub-agent run it is `await`ing inline, since they run on the same task.

### Additional Configuration

#### Keeping model prices up to date

Pydantic AI bundles model prices at release time. To estimate costs for models released after you installed it, download updated prices when your app starts:

```python
from pydantic_ai import prices

updater = prices.update_in_background()

try:
    ...  # run your app
finally:
    updater.stop()
```

The price list updates immediately and then hourly in a background thread. Failed downloads leave the most recent prices in use.

For a custom URL or update interval, use [`genai_prices.UpdatePrices`](https://github.com/pydantic/genai-prices/blob/main/packages/python/README.md#updateprices), which shares the same background task.

#### Usage Limits

Pydantic AI offers a [`UsageLimits`][pydantic_ai.usage.UsageLimits] structure to help you limit your
usage (tokens, requests, tool calls, and cost) on model runs.

You can apply these settings by passing the `usage_limits` argument to the `run{_sync,_stream}` functions.

Consider the following example, where we limit the number of output tokens:

```py
from pydantic_ai import Agent, UsageLimitExceeded, UsageLimits

agent = Agent('anthropic:claude-sonnet-4-6')

result_sync = agent.run_sync(
    'What is the capital of Italy? Answer with just the city.',
    usage_limits=UsageLimits(output_tokens_limit=10),
)
print(result_sync.output)
#> Rome
print(result_sync.usage)
#> RunUsage(cost=Decimal('0.000201'), input_tokens=62, output_tokens=1, requests=1)

try:
    result_sync = agent.run_sync(
        'What is the capital of Italy? Answer with a paragraph.',
        usage_limits=UsageLimits(output_tokens_limit=10),
    )
except UsageLimitExceeded as e:
    print(e)
    """
    Exceeded the output_tokens_limit of 10 (output_tokens=32). Consider raising the limit, or see the docs on usage limits for budget-aware patterns: https://pydantic.dev/docs/ai/core-concepts/agent/#usage-limits
    """
```

Restricting the number of requests can be useful in preventing infinite loops or excessive tool calling:

```py
from typing_extensions import TypedDict

from pydantic_ai import Agent, ModelRetry, UsageLimitExceeded, UsageLimits


class NeverOutputType(TypedDict):
    """
    Never ever coerce data to this type.
    """

    never_use_this: str


agent = Agent(
    'anthropic:claude-sonnet-4-6',
    retries={'tools': 3},
    output_type=NeverOutputType,
    system_prompt='Any time you get a response, call the `infinite_retry_tool` to produce another response.',
)


@agent.tool_plain(retries=5)  # (1)!
def infinite_retry_tool() -> int:
    raise ModelRetry('Please try again.')


try:
    result_sync = agent.run_sync(
        'Begin infinite retry loop!', usage_limits=UsageLimits(request_limit=3)  # (2)!
    )
except UsageLimitExceeded as e:
    print(e)
    """
    The next request would exceed the request_limit of 3. Consider raising the limit, or see the docs on usage limits for budget-aware patterns: https://pydantic.dev/docs/ai/core-concepts/agent/#usage-limits
    """
```

1. This tool has the ability to retry 5 times before erroring, simulating a tool that might get stuck in a loop.
2. This run will error after 3 requests, preventing the infinite tool calling.

##### Capping tool calls

If you need a limit on the number of successful tool invocations within a single run, use `tool_calls_limit`:

```py
from pydantic_ai import Agent
from pydantic_ai.exceptions import UsageLimitExceeded
from pydantic_ai.usage import UsageLimits

agent = Agent('anthropic:claude-sonnet-4-6')

@agent.tool_plain
def do_work() -> str:
    return 'ok'

try:
    # Allow at most one executed tool call in this run

# Changelog

## Unreleased

## [0.9.0] - 2026-09-07

### Added
- Manage Local and saved SSH machines from one Herdr window, with a combined agent list, machine-scoped navigation, notifications, and automatic reconnects. Add and manage connections with `herdr machine`; a disconnected machine does not interrupt the others. (#3670)
- Multiple clients can now view different workspaces and tabs independently. Different tabs fit their viewing clients; when clients share a tab, the last one to interact with it controls its size. (#3526)
- Added Muse agent detection for idle, working, approval, and question states. (#2489, thanks @ohk)
- Sidebar text and metadata tokens can now change color, boldness, and dimming based on their values, using ordered text or numeric rules. (#3693)
- Custom themes can now define separate light and dark color overrides when automatic theme switching is enabled. (#2324, thanks @aneym)
- `ui.pane_borders = "always"` can now frame a single pane when outer borders are enabled. `"auto"` keeps split-only borders, `"off"` hides them, and existing boolean values keep working. (#3234, thanks @rsmdt)

### Changed
- Client updates can now leave compatible servers and their running agents untouched. Missing server features disable only the affected action instead of preventing connection. Servers older than endpoint generation 1 need a one-time upgrade. Replacing a remote server asks before stopping its pane processes, with No as the default answer; experimental handoff remains opt-in. (#3509)
- The terminal UI now runs in each client, reducing redraw work in busy multi-client sessions and keeping themes, menus, copy mode, and other presentation settings local to the viewing machine. (#3487)
- Idle terminal scrollback now uses less memory without reducing retained history or changing reads and resizing. (#3556)
- Pane images and the graphics API are now enabled by default in compatible terminals. Set `terminal.kitty_graphics = false` to disable them; the old `experimental.kitty_graphics` setting remains accepted.
- Closing a primary workspace with open worktree workspaces now requires explicit group intent: `workspace close --group` or `workspace.close` with `close_group: true`. Otherwise the whole group stays open. (#2874)
- New lifecycle event subscriptions now start with live events rather than replaying retained history. API clients should subscribe before taking their initial snapshot to avoid missing changes. (#1270)

### Fixed
- Mouse selections now stay visible and copyable while terminal output continues, including with automatic copying disabled. Ctrl+C and Cmd+C copy a selection even before a delayed mouse release, and a failed copy no longer interrupts the agent. Selection highlights also remain visible when host colors are unavailable. (#3100, #2708, #3684, thanks @moret and @Pimpmuckl)
- Wayland clipboard copies no longer freeze Herdr while `wl-copy` serves the selection. (#3014)
- Live handoff now preserves mouse forwarding for running pane applications. (#3000, thanks @xkrogen)
- Interrupted pane exits during host shutdown no longer replace the saved session with an empty session or a new default workspace. (#3415)
- SSH clients whose terminal disappears now detach instead of resizing running panes to a fallback size and triggering expensive history reflow. (#3519)
- Focusing a workspace now scrolls the sidebar to keep it visible. (#3554)
- Removing a background worktree workspace no longer changes focus to its parent. Windows worktrees can also be removed while their agent panes are running, without a replacement shell locking the checkout again. (#3098, #3532)
- Worktree commands can now trust a verified repository for one request with `--trust-repository`, including accessible Windows repositories owned by another SID, without changing global Git configuration. (#3044)
- Oversized Kitty images no longer prevent smaller images from appearing, and image replacements no longer redraw or disappear one row at a time. Direct graphics stay bound to the client that owns them. (#3033, #3166, #3549, thanks @kataokatsuki)
- Pixel mouse coordinates remain correct when pane applications reassert SGR mouse reporting. (#3295)
- Prefix bindings such as `prefix+|` now recognize characters produced by macOS Option and custom keyboard layouts, while exact chords keep priority. Arrow navigation also works when terminals such as Alacritty attach text to special-key reports. (#3079, #3328, thanks @vlcinsky)
- Direct terminal attaches now honor `ui.mouse_capture` and preserve multiline pastes as one paste instead of submitting each line separately. (#2992, #3054)
- `agent prompt` now reliably sends the prompt and Enter before reporting successful submission. With `--wait`, prompts sent to a non-working agent require observed working or blocked activity, so unrelated state changes cannot complete the wait. Pending submissions fail cleanly if the terminal exits. (#3506, #3685)
- Long Codex prompts on Windows now wait long enough for the text to arrive before submitting Enter. Expired queued submissions are rejected before typing starts. (#3187)
- Recent pane reads now include output that has not yet scrolled off the viewport, instead of returning empty text. (#3444)
- `pane report-agent` and `pane report-agent-session` now accept options before the pane ID and `--option=value` arguments. (#2926)
- `herdr agent explain --file` now reports unreadable files as structured JSON rather than raw Rust errors. (#3022)
- Running named servers now pick up detection manifests downloaded by another server without needing a restart. (#2711)
- Agents that set their terminal title or progress once at startup no longer lose that detection signal when first recognized. (#3326, thanks @aneym)
- Claude Code now recognizes visible turn and background-agent activity when terminal titles are unavailable, and remains working while background MCP tasks continue. An idle prompt with only a background shell running no longer stays working. (#1630, #3090, #3414)
- Claude Code MCP questions and Bash approval prompts now stay blocked while waiting for an answer, including different option layouts and cursor positions. (#3283, #3383, #2650, #3615, thanks @caner-akca)
- Claude Code hooks now ignore Cursor's Claude-compatible events, preventing Cursor sessions from being saved as Claude sessions. (#2832)
- Codex no longer appears blocked because earlier output quotes a confirmation prompt, and its startup update dialog now correctly reports blocked. Explicitly resumed sessions are saved before the first prompt, so they survive a server restart. (#3301, #3632, #3517)
- GitHub Copilot CLI now stays working while it waits for background agents. (#3291, #3403, thanks @LaneBirmingham)
- Oh My Pi now stays working through already-scheduled continuations instead of briefly reporting idle and ending `agent wait` early. (#2851, #3122, thanks @caner-akca and @taoeffect)
- OpenCode child-agent permission and question prompts no longer leave the parent pane stuck as blocked after work continues. (#3669, thanks @markjaquith)
- Foreground working-directory reads now follow the foreground process-group leader rather than a descendant, keeping new panes in the intended directory. (#3270, #3386, thanks @caner-akca)
- Oversized or unreadable Git ref files no longer cause repeated heavy status reads or make workspaces use stale ref data. (#3343, #3373, thanks @caner-akca)
- Tab bar status commands no longer display stray ANSI escape fragments, and host palette replies are applied together to avoid redundant updates. (#3001, #3580)
- Unix plugin panes now keep `PWD` aligned with their requested working directory unless explicitly overridden. Windows plugin panes now resolve relative commands from the plugin root and handle launch paths correctly. (#2984, #3024)
- Plugin link handlers now receive matching OSC 8 `file://` clicks; unmatched file links still do not launch the system URL opener. (#2941)
- Windows panes now preserve non-US shifted text, physical modified keys, Ctrl+/, and dead-key composition in Kitty keyboard applications. (#3045, #2954, #3546, #3503)
- Windows OpenSSH sessions now receive mouse input reliably without dropped reports or escape fragments leaking into panes. Remote and LF-only multiline pastes retain their newlines and order. (#2810, #3459, #3209, #3172)
- Windows panes now keep Cursor and bundled Pi launches detected, and PowerShell agent shims accept native arguments. Codex no longer inherits Windows Terminal identity that caused excessive repainting and scroll jumps during resume. (#3032, #3205, #3455, #3127, thanks @Pimpmuckl)
- Antigravity hooks now run correctly on Windows, and Devin integration setup uses the correct Windows config directory. (#3348, #2724)
- Windows installations no longer need a separately installed Visual C++ runtime. Installer paths remain discoverable in OpenSSH sessions, and malformed inherited environment values are rejected safely. (#3089, #3611, #3430)
- Windows users whose endpoint security blocks fileless PowerShell installation can use a local `install.cmd` bootstrap with checksum-verified downloads. (#2751)
- WSL remote sessions can now paste images from the Windows clipboard. (#3376)
- Nix installations now fetch crates through the static CDN, avoiding download failures from the previous endpoint. (#3505)
- The Unix installer now explains that Android/Termux is unsupported instead of installing a Linux binary that cannot run there. (#3571)

### Removed
- Removed the single-process `--no-session` mode. All terminal UI launches now attach to a background server; detach leaves panes running, while `server stop` ends the session.

## [0.8.2] - 2026-08-19

### Added
- CLI help now points coding agents to Herdr's plain-text guide, documentation index, and built-in control skill.
- Added Qwen Code detection for idle, working, and user-confirmation states, plus optional native session restore. (#2730, #2743)
- Herdr now keeps the outer terminal window title in sync with the session through `ui.window_title`, so window managers and terminal tab bars show the active workspace and the host the panes actually run on. (#2627, thanks @dhh)
- The desktop tab bar now has configurable right-aligned status entries for zoom state, hostname, date/time, literal text, and asynchronously refreshed command output.
- Optional `keys.move_tab_previous` and `keys.move_tab_next` bindings now reorder the active tab in place, wrapping at either end. (#2561, thanks @dhh)
- Optional `keys.resize_pane_left`, `keys.resize_pane_down`, `keys.resize_pane_up`, and `keys.resize_pane_right` bindings now resize the focused pane in one keystroke without entering resize mode. (#2558, thanks @dhh)
- Windows clients can now use `herdr --remote` to attach to Herdr servers on Linux and macOS. (#2329)
- Cursor Agent CLI, MastraCode, Hermes Agent, and Grok CLI integrations now install and run natively on Windows.
- Panes can now route normal right-click gestures to mouse-reporting applications through the pane menu, `herdr pane input`, `pane.input.set`, or the `pane split --right-click pane` launch option.
- `ui.pane_outer_borders` can now keep or hide the outside edges of split-pane borders independently from internal dividers. (#2535, thanks @dhh)
- `theme.custom.sidebar_bg` can now give the desktop sidebar its own background without changing built-in theme defaults.
- Settings and `ui.status_indicators = "symbols"` can now use distinct static shapes for blocked, working, done, idle, and unknown agent states. (#2260)
- Navigate-mode selection rows now use a dedicated per-theme cursor color, customizable via `theme.custom.selection_bg`, so the cursor stays distinguishable from the active Space and Agent highlight.
- Copy mode now supports `B`, `E`, and `W` motions over whitespace-delimited big words. (#2270, thanks @jplew)
- The plugin marketplace now discovers valid manifests at repository roots and subdirectories, groups multiple plugins under each repository, and publishes their versions and exact default-branch commits.

### Changed
- Windows support is now generally available through stable releases and uses the stable update channel by default. Existing preview installs stay on preview until explicitly switched.
- Headless servers now use a configurable 120×40 virtual terminal instead of 80×24 when no client is attached, giving newly created panes a practical default size. (#2828)
- Desktop tab labels are now centered in their tabs, so the active-tab highlight has symmetric padding. (#2570, thanks @dhh)
- Experimental pane graphics now support bounded named layers, acknowledged full-RGBA primary-layer direct file frames on audited local terminals, owned BGRA fallback, exact pixel mouse input, and placement-only resize replay.

### Fixed
- Unix CLI commands now exit quietly when a downstream pipe closes instead of panicking with exit 101. (#2994)
- The terminal theme now keeps the active Space row fill visible when the Navigate cursor lands on it, in both expanded and collapsed sidebars. (#2987)
- Busy multi-pane sessions now avoid redundant hidden-pane wakeups and full terminal-state formatting in pane-scaled paths, preventing CPU regressions from high-rate background output, scrollbars, and enhanced keyboard modes. (#2550, #2901, #2962)
- Chinese IME commits now reach panes on macOS when the focused application requests printable key-release events. (#2924)
- Windows now recognizes `Ctrl+1` through `Ctrl+9` keybindings instead of decoding those key records as control characters. (#2910)
- PowerShell panes now keep their process-reported working directory synchronized with the shell's logical location. (#2879, thanks @Pimpmuckl)
- Foreground typing no longer waits behind render cadence consumed by output from panes in hidden tabs. (#2890)
- The Windows ARM64 installer now waits for x64 emulation to release the verified executable before activating the downloaded release. (#2916)
- On Unix, Ctrl-click URL openers are now reaped after they exit, preventing defunct child processes from accumulating on long-running servers. (#2903)
- Windows updates now reuse only verified local packages, avoiding security-tool download blocks while preserving checksum validation. (#2751, #2816, thanks @Pimpmuckl)
- Herdr no longer sends the full OSC 4 palette query burst under WSL, preventing reply fragments from leaking into the shell through ConPTY. (#2440)
- Qwen Code panes now use locale-independent terminal-title states and localized confirmation fallbacks, preventing active or blocked turns from appearing idle. (#2756)
- Claude Code panes now recognize and strip every half-circle title spinner frame, preventing active turns from appearing idle and keeping titles clean. (#2707, #2709, #2760, #2762)
- Copilot prompts now focus the target pane before sending input, so background panes do not silently drop prompts. (#1698, #2734, thanks @xkrogen)
- Agent hooks now invoke the running Herdr binary instead of whichever binary appears first on `PATH`. (#2722, thanks @Pimpmuckl)
- Closing a terminal running `herdr --remote` no longer produces a local client core dump while the remote session stays alive. (#2424)
- Active Space and Agent rows now use dedicated theme colors that remain visible when the host terminal background matches the selected Herdr theme. (#2792)
- `agent prompt` now rejects agents already waiting at approval or question dialogs with `agent_blocked`, without sending text or Enter. (#2788)
- `agent start` now waits for new pane shells and first-run agent prompts to become ready instead of racing them or reporting premature readiness. (#2410, #2537, #2773, #2774, thanks @Pimpmuckl)
- `prefix+e` now preserves logical lines when opening soft-wrapped scrollback in an editor. (#2733)
- Alternate-screen pane reads avoid unnecessary ANSI formatting work, reducing read latency for TUI agents. (#2387, #2426)
- Tab bar clicks are now properly registered when using Ghostty in native fullscreen. (#796, #2736, thanks @HackAttack)
- Prefix keybindings now disambiguate layout-aware shifted punctuation, so a shifted `\` no longer triggers `prefix+|` on keyboard layouts where the same key produces both characters. (#2674)
- Remote clients now continue redrawing at very large terminal sizes instead of freezing when a full ANSI frame exceeds the transport limit. (#2670)
- Windows Git status refreshes now reuse repository configuration instead of repeatedly triggering security scans for WSL repositories. (#2643, #2688, thanks @Pimpmuckl)
- Windows idle agent detection now shares process snapshots across panes, reducing CPU use in sessions with many Git Bash panes. (#2459, #2494, #2642, #2651, thanks @Pimpmuckl)
- Embedded bare repositories now derive the correct repository name and worktree location. (#2657, #2660)
- Root-repository workspaces now retain their saved labels across update restarts. (#2594, #2727)
- Elevated Windows panes no longer expose PowerShell's administrator decoration as the terminal title. (#2632, thanks @Pimpmuckl)
- Modal name inputs now anchor the host IME cursor to the text field instead of the pane behind the dialog. (#1755, #2569, thanks @kataokatsuki)
- Session Navigator movement ignores modified `j`, `k`, and arrow keys instead of consuming unrelated pane input. (#1981, #2377, thanks @atomsbaza)
- OpenCode panes now track the root conversation selected in their own TUI for native restore without adopting activity from attached clients. (#2450)
- Server stop requests now bypass pane and API traffic, preventing busy sessions from blocking shutdown or admitting a client while shutdown is pending. (#2612)
- Fish `Ctrl+Alt` keybindings now work in panes after legacy Alt-prefixed control bytes are decoded with both modifiers. (#2514)
- Windows recent-history reads no longer perform redundant snapshots, restoring `recent` output while reducing read cost. (#962, #2474, thanks @Pimpmuckl)
- The Windows installer now activates releases with an atomic directory swap, preventing interrupted updates from leaving an empty release directory. (#2356, #2530, thanks @Pimpmuckl)
- `herdr config check` now reports unknown built-in theme names instead of silently accepting them. (#2452)
- macOS `herdr --remote` clients now keep the accepted bridge socket blocking, preventing an immediate disconnect after the protocol handshake. (#2478, thanks @mathijshenquet)
- Prefix keybindings now preserve Shift in WezTerm Kitty keyboard mode, so commands such as config reload no longer trigger their unshifted action. (#2435)
- Pane applications now receive modifyOtherKeys releases and shifted alternate reports without dropped releases or leaked Ctrl+Tab sequences. (#2296, #2302, #2303)
- Detaching now restores host keyboard reporting, preventing enhanced keyboard sequences from leaking into the shell after Herdr exits. (#2393, #2395)
- Default mouse reports are decoded instead of leaking escape bytes into the focused pane. (#2309, #2312)
- BEL characters emitted by pane programs now reach the outer terminal so its audible and visual bell settings can react. (#2453)
- Stable direct installs, self-updates, and remote helper downloads now require and verify the SHA-256 digest published for each GitHub release asset.
- `pane read` and `pane wait-output` now accept `--flag=value` and options before or after the pane ID. (#2183, thanks @KyleCo76)
- `pane current`, `pane get`, and `pane layout --current` now resolve the calling pane instead of another client's focused pane. (#2297, #2298)
- Configs containing the retired Herdr-written `ui.agent_panel_scope` setting no longer report it as an unknown key after upgrades. (#2292)
- Claude Code confirmation prompts using `Enter to confirm · Esc to cancel` now report `blocked` instead of `idle`. (#2268)
- Kiro CLI prompts now have positive idle detection instead of remaining in an unknown state. (#2301, thanks @smileynet)
- Cursor's Run Everything footer no longer produces a false blocked state. (#1763, #2220, thanks @Nagi-ovo)
- Versioned Python agent wrappers such as `python3.13` are now detected. (#2188, thanks @plarson)
- Pi state reporting now ignores RPC, JSON, and print-mode helper processes that are not interactive TUI sessions. (#2159, thanks @rhjoh)
- Collapsed workspace and Agent rows keep their status and active indicators visible, including with ten or more workspaces. (#2216, #2239, #2382, thanks @ianks)
- Sidebar agent lists keep scrolling when differently sized clients are attached to the same session. (#2255, thanks @aiworkflowpro)
- The Session Navigator now searches renamed single-tab labels. (#2320)
- New splits return focus to the pane they were opened from. (#2266, thanks @jondkinney)
- Halfwidth Katakana voiced and semi-voiced marks now render in the correct cell. (#2257, thanks @kazunari-kamata)
- Ctrl-clicking a URL no longer forwards its release after the browser takes host focus, preventing duplicate tabs. (#2290, #2291, thanks @kataokatsuki)
- OSC 4 palette overrides now render with the requested color instead of forwarding the palette index. (#2162, thanks @hamidi-dev)
- Host terminal appearance is re-queried when focus returns, keeping automatic light and dark themes current. (#2416, #2417)
- The bundled and installable Herdr agent skill now matches this stable release's CLI and lifecycle behavior. (#2847)
- `pane send-keys` and `agent send-keys` now preserve Shift when sending `shift+tab`, allowing agent permission modes to be cycled programmatically. (#1561, thanks @keinstn and @tomohisa)

## [0.8.0] - 2026-08-03

### Added
- Added `herdr --skill` to print the agent skill bundled with the running Herdr binary.
- Added `ui.pane_scrollbars = false` to hide terminal pane scrollbars and reclaim their reserved column. (#2167)
- Added `ui.tab_bar_position = "bottom"` to place the desktop tab row below terminal panes. (#2117)
- Added live filtering to the keybind help with `/`, Backspace, and `Ctrl+U`. (#1825, #1832, thanks @corrius)
- Added Windows support for `experimental.switch_ascii_input_source_in_prefix` with Korean IMEs. (#1802, #1823, thanks @joonhwan)
- Added Grok CLI session reporting and native restore with `grok --resume <id>`. (#1800, #1807, thanks @carlesso)
- Added Antigravity CLI session reporting and native restore with `agy --conversation <id>`. (#1011, #1571, #2087, thanks @ludoo)
- Added automatic text history reads for idle alternate-screen agents, with the application viewport restored after collection.
- Added `workspace.move_block`, the `workspace.reordered` event, and atomic worktree-group reordering. (#1694)
- Added a Simplified Chinese README. (#1990, thanks @patrick-xin)

### Changed
- Experimental options are no longer exposed in the Settings TUI and remain available through the config file.
- Agent status indicators now use the same static workspace marks across the sidebar, navigator, and mobile views, eliminating continuous spinner rendering while agents work.
- Hidden pane output no longer triggers unnecessary TUI rendering.
- Windows preview downloads now include Herdr and a modern app-local ConPTY runtime in one archive. (#1533, #1644, #1828)
- Worktree parents and children now stay packed together in the sidebar, including while groups are reordered.
- Public documentation now separates stable, preview, and immutable versioned release snapshots.
- Repository and installation links now use `herdrdev/herdr` after the GitHub organization migration.
- Relicensed Herdr from AGPL-3.0-or-later to Apache-2.0.

### Fixed
- Pane applications now receive semantic light/dark query responses and live Mode 2031 updates when the host appearance changes. (#714)
- Remote attach now falls back to `sh` when the login shell cannot perform path discovery. (#1201)
- PTY output continues to be read while pane input is temporarily blocked. (#1295)
- Worktree CLI help and docs no longer advertise the redundant `--json` flag; worktree commands remain JSON-only and continue accepting the flag for compatibility. (#2171)
- OpenCode 2 preview panes now appear as OpenCode agents and use the existing OpenCode status detection. (#2169)
- Pane text copied through VS Code Remote Tunnels now reaches the viewing machine's clipboard instead of overwriting the remote host clipboard. (#2015)
- Windows agent detection now follows Git Bash-launched agents across emulated `exec` process boundaries. (#2107)
- Detached Windows servers and pane processes now survive logout from the OpenSSH session that started them. (#2008)
- Windows `agent start` now launches agents without native arguments instead of timing out on an invalid empty PowerShell argument list. (#2072)
- Headless servers now resume restored agent sessions without waiting for a TUI client to attach. (#2064)
- Vibe and other Kitty-keyboard pane applications now receive shifted letters and punctuation when they request associated text. (#2020)
- Kitty-keyboard pane applications now receive printable key releases without duplicate text input. (#1746)
- Kitty graphics remain visible during host repaints. (#1628)
- Pane applications now receive correct XTWINOPS terminal and cell-size query responses. (#835)
- WSL clients query the host cell size when the terminal ioctl reports no pixels, keeping graphics sharp instead of using the 8x16 fallback. (#2146, #2160, thanks @WakaTaira)
- Linux runtimes without terminal foreground process groups can opt into child-group agent detection with `HERDR_PROCESS_DETECTION=child-groups`. (#1982)
- Installing the Herdr agent skill with the `skills` CLI no longer copies the entire repository. (#2022)
- Nix builds now include the bundled agent skill required by `herdr --skill`. (#1889, #1890, thanks @olafkfreund)
- Agent prompts now wait briefly after sending text before pressing Enter, preventing prompts from remaining in agent composers without starting a turn. (#1878)
- Empty clipboard writes from pane applications no longer erase existing clipboard contents or show a copied confirmation. (#1893)
- Plain mouse movement no longer triggers continuous full renders while preserving Herdr menu hover and pane application mouse tracking. (#1865)
- Extended-button drags now preserve Herdr hover state while applications receive the drag.
- `ui.copy_on_select = false` now retains drag and double-click word selections without copying; `Ctrl+C`, or `Cmd+C` when the host terminal forwards it, copies and clears the selection. (#1782)
- Pane and agent read responses now report `truncated: true` when older terminal rows were omitted. (#1717)
- Pane applications that query OSC 4 palette colors now inherit the host terminal palette. (#1752)
- Ctrl-clicking a pane URL no longer forwards an unmatched mouse release to alternate-screen applications, preventing duplicate browser tabs. (#1761)
- Known-agent integrations now leave pane ownership to confirmed process exit, so restarting Pi with the same saved session restores lifecycle state even with custom working UI. (#1648, #1792)
- Nested or ephemeral Codex sessions no longer replace the owning pane's resumable session. (#1789, #1927, thanks @Pimpmuckl)
- Pi RPC, JSON, and print processes no longer claim pane lifecycle state intended for Pi TUI sessions. (#2159, thanks @rhjoh)
- Hermes state now comes from screen detection while its plugin reports resumable session identity, avoiding stale lifecycle authority from incomplete hooks.
- OMP integration install, status, and uninstall now respect `PI_CONFIG_DIR` when `PI_CODING_AGENT_DIR` is not set, and installation refuses extension-directory collisions with Pi. (#1696)
- OMP integrations now preserve Windows absolute session paths for native restore. (#2092, thanks @art-wiedzmin)
- Claude integration updates preserve existing settings key order and formatting. (#2066)
- Physical Escape key records on native Windows now bypass raw VT report framing, so pane applications receive Escape immediately and reliably. (#1736)
- Native Windows key presses, grouped repeats, and releases now preserve their physical lifecycle and stay with the pane that received the initial press. (#2077)
- Windows `pane send-keys` and `agent send-keys` now deliver semantic Escape as a complete key tap, preventing a following key from being interpreted as an Alt chord.
- Shift+Enter now reaches native Windows pane applications with its modifier intact. (#1743, #1909, thanks @Pimpmuckl)
- Ctrl+_ input bytes now decode as Ctrl+_ instead of Ctrl+-. (#2164, #2165, thanks @Sertug17)
- Prefix and navigate modes now recognize non-US shifted keybindings while retaining legacy US punctuation support. (#1870)
- Closing a non-focused workspace no longer changes the focused workspace. (#1328, #1877, thanks @yianL)
- A background workspace that closes after its last pane exits no longer moves focus or hides the current workspace. (#1621, #1912, thanks @season179)
- Directional pane focus now keeps Navigate mode active. (#1850, #1993, thanks @we11adam)
- Closing a workspace's last tab through the CLI or API now closes the workspace like the TUI does. (#1760, #1899, thanks @season179)
- Linked worktree workspaces retain their labels during Git metadata refreshes.
- Clients repaint after transient terminal resizes instead of leaving stale or missing rows.
- Repeated workspace Git discovery and foreground-cwd checks no longer block rendering or API handling. (#1838, #2206)
- Relative plugin commands now resolve from the plugin root. (#1949)
- Windows installation preserves inherited `PATH` and related environment variables. (#1947)
- Windows agent process discovery preserves the owning parent agent across wrapper processes. (#1514)
- The Rose Pine `surface_dim` color remains visible when the outer terminal uses a matching theme. (#1946, #2002, thanks @brabli)
- CLI socket commands now report a clear `server_not_running` error instead of a raw I/O error. (#1941, #1963, thanks @season179)
- Non-UTF-8 CLI arguments now produce a usage error instead of panicking. (#2207, thanks @VialFlorian)
- Copy-mode `e` now crosses long soft-wrapped CJK lines when a read window ends on a wide glyph. (#2145, thanks @kiakiraki)
- Clients restore terminal state when they receive SIGHUP or SIGTERM. (#2041, thanks @MattJColes)
- Windows now shows `system` notifications and completes MP3 notification sounds without leaving PowerShell players waiting for a timeout. (#1330)

## [0.7.5] - 2026-07-21

### Breaking Changes
- Installed and linked plugins, including their enabled state, are now global to the current user instead of isolated by Herdr session. Plugins installed only in a named session on Herdr 0.7.3 must be installed or linked again. (#1174)

### Added
- Added a live-agent CLI facade with named `start`, atomic `prompt`, logical `send-keys`, and server-owned `wait` workflows. Agent startup targets an existing pane without changing topology, validates the requested interactive agent kind and strict agent name, and accepts native arguments after `--`.
- Added transient declarative Agent view queries through `agent.view.set/clear`; filtered and sorted views now define sidebar, mobile, mouse, and agent-keybind navigation order.
- Added one-shot plugin `[[startup]]` hooks for restoring plugin-owned state after server startup and live handoff.
- Added per-token foreground, bold, and dim styling to expanded Space and Agent sidebar row layouts.
- Added `ui.sidebar_start_collapsed` to launch Herdr with the sidebar collapsed. (#1463)
- Added `ui.prompt_new_workspace_name` to ask for a workspace name before interactive TUI creation.
- Added macOS support for the `HERDR_AGENT=<agent>` foreground-process hint, allowing agents hidden behind host-visible wrappers such as `nono` to use the named agent's screen manifest. (#679)

### Changed
- Agent commands now accept only a unique live agent name or the pane ID currently hosting that agent. Names are cleared when the occupant exits, is released, or is replaced. The old top-level `wait` commands were replaced by `agent wait` and `pane wait-output`, and `agent send` was replaced by `agent send-keys`.
- The session navigator now uses connected tree glyphs, groups matches by workspace, and automatically selects the first result when a search begins. (#1611)

### Fixed
- CLI requests now return a machine-readable `protocol_mismatch` error when the client and server protocols differ, while recovery commands remain available. (#1435)
- Linux sound notifications now terminate and reap audio players that do not exit, preventing unavailable audio from leaving CPU-bound `mpg123` processes behind. (#1622)
- Oversized bracketed text pastes are now rejected with a client-local notification instead of disconnecting the client. (#1665)
- Agent prompt waits now report `agent_prompt_stalled` after five seconds without an observed state change instead of waiting indefinitely after an ineffective submission.
- `herdr config check` now reports unknown config keys with their full paths instead of treating ignored typos as valid configuration. (#1573)
- Codex panes with customized static terminal titles now fall back to the live working footer instead of remaining idle, while OSC activity remains preferred. (#1563)
- Grok panes now preserve working and blocked state from terminal signals and pinned background-work status instead of falling back to idle mid-turn.
- OpenCode lifecycle reports are now serialized so out-of-order plugin events cannot leave an idle pane marked working. (#1519)
- Kimi question prompts now report blocked until the user answers or dismisses them.
- Pi lifecycle reporting now uses settled events, preventing transient message boundaries from publishing an idle state mid-turn.
- The Pi, OMP, OpenCode, and Kilo Code integrations can now be installed on Windows and report lifecycle state and native session identity through Herdr's named-pipe API. (#1531)
- Named agent prompts now honor live bracketed-paste mode before sending Enter, preserving OpenCode text such as `A != B` instead of triggering shell mode. (#1525)
- New panes, tabs, layouts, and workspaces using `new_cwd = "follow"` now inherit the foreground process-group leader's working directory instead of an unrelated helper process directory. (#1472)
- Cached pane working directories no longer trigger repeated filesystem checks, avoiding slow sidebar rendering on network filesystems such as Ceph. (#1603)
- Windows foreground-process snapshots are now shared across panes, reducing idle CPU use in sessions with many panes. (#1158)
- Terminal diff streams now batch contiguous writes, reducing the visible wave effect while scrolling pane history. (#283)
- A standalone Escape arriving beside another key is now preserved as its own input instead of being combined into a fabricated Alt chord. (#541)
- Pane viewports that were following live output now continue following after a resize.
- Mouse selections now remain visible when `ui.copy_on_select = false` while clipboard writes stay disabled. (#1471)
- Workspace close confirmation now shows the current workspace name instead of a stale or unrelated label. (#1364)
- Plugin command arrays now preserve whitespace-only arguments. (#1594, #1613)
- Plugins can now be installed or linked while no Herdr server is running. (#1670)
- Remote attach now discovers Herdr installed in mise's canonical tool path before offering to install a sidecar binary. (#1201)
- Noninteractive update, plugin, integration, sound, custom-command, and Git subprocesses no longer flash console windows on Windows. (#1468)
- Live handoff now preserves installed plugins and no longer lets the next plugin installation overwrite the existing registry. (#893)
- `herdr agent wait` now returns `agent_not_running` promptly when its target pane closes instead of waiting for the full timeout. (#1439)
- Pane graphics streams now shut down cleanly when a client disconnect races stream teardown.

## [0.7.4] - 2026-07-15

### Added
- Added session-modal popup floating terminal panes for `type = "popup"` custom command keybindings and plugin panes, with optional cell or percentage sizing and no changes to the tiled tab layout. (#1125)
- Added `ui.copy_on_select` to disable automatic clipboard copying after mouse selection while keeping the selection visible.
- Added configurable row layouts for expanded Space and Agent sidebar entries, including built-in display tokens, per-agent overrides, custom metadata tokens, and pane/workspace metadata reporting through the CLI and socket API.
- Added independent `row_gap` settings for expanded Space and Agent sidebar entries.
- Copy mode now supports literal smart-case search with `/` and `?`, repeating with `n` and `N`, match highlighting, and tmux-style cross-line `w`/`b`/`e` word motions. (#1230)
- Added Maki agent support. (#1301, #1302, thanks @tontinton)
- Added a searchable, version-matched configuration reference and a troubleshooting guide covering duplicate terminal key events, modified-arrow shell bindings, updates, remote access, and logs. (#1116, #1370)

### Changed
- Expanded Space and Agent sidebar entries now use a packed layout by default; set the corresponding `row_gap` to `1` to restore the previous spacing.
- Refreshed the bundled Herdr agent skill for current public workspace, tab, and pane ids and the current CLI/API workflow. (#1297)
- Expanded Japanese and Simplified Chinese CLI documentation with shell completion setup and API schema usage. (#1151)

### Fixed
- Collapsed Agent sidebar rows now follow the same ordering and click targets as the expanded panel, and their shortcut numbers are assigned by visible list position instead of repeating across workspaces. (#1168, #1344)
- Shifted indexed bindings such as `prefix+shift+1..9` now match terminals that report the corresponding punctuation characters. (#1184)
- Plugin-driven tab renames now immediately refresh tab-bar geometry and labels. (#1111, #1179, thanks @kovalov)
- New tabs, splits, layouts, and workspaces configured to follow the foreground directory now start from the focused pane's current working directory. (#1245)
- Amp, Codex, and Claude Code detection now recognizes current active-turn UI variants, including reordered Codex title spinners and Claude `/btw` turns. (#1208, #1281, #1366)
- Pi lifecycle state now reanchors after native session replacement, avoiding working panes that remain idle or tied to an abandoned session. (#943, #1189, thanks @dmmulroy)
- OMP lifecycle reports are now retried when startup races drop the first report. (#1310)
- WSL now uses Herdr's drawn cursor by default, matching the native Windows workaround for host cursor flicker. (#930)
- Live handoff now preserves explicit named-session socket paths, waits for slower server shutdowns, and flushes API responses before the old server exits. (#1180, thanks @dvic)
- The Windows installer no longer rewrites an existing config file or creates a duplicate onboarding line during first-run setup. (#1162)
- Config diagnostics now reach CLI-only and attached-client startup paths reliably and clearly identify fallback configuration behavior.
- Detached custom command children are now reaped after exit instead of accumulating zombie processes. (#1360)
- Renamed single tabs now remain visible in the Agents sidebar instead of losing their tab label. (#1369)
- Documentation search results are now scoped to the active locale and stable or preview channel.
- Horizontal wheel and trackpad events now reach pane applications that enable mouse reporting. (#1349)
- Copy mode `$` and End now stop at the final visible character on the row instead of jumping to the pane edge. (#1405)
- Split SGR mouse reports are now reassembled across input reads, and a preceding standalone Escape is preserved instead of being swallowed or leaked as mouse bytes. (#1334, #1382)
- Linux foreground-process discovery now stays within Herdr pane process trees instead of scanning unrelated host processes, reducing CPU use on busy multi-user systems. (#1399)
- Single-codepoint emoji chosen from the Windows emoji picker now reach panes when WezTerm's kitty keyboard support sends them as CSI-u events with associated text. (#1404)
- Outer-terminal focus gained and lost reports now reach the focused pane when its application enables focus reporting, restoring Neovim file autoreload and other focus-aware terminal behavior. (#1337)
- Native Windows servers now detach from the terminal console that launched them, so closing WezTerm, Windows Terminal, or another host terminal no longer stops persistent pane processes. (#1329)
- Windows API clients now remain connected while waiting for initial named-pipe request bytes, so `status server`, `api snapshot`, and other socket commands no longer intermittently fail with BrokenPipe. (#1279)
- `herdr --remote` now installs remote helper binaries without routing the binary stream through a multiline `/bin/sh -c` command, fixing installs for non-POSIX login shells such as xonsh. (#1203, thanks @nhumrich)

## [0.7.3] - 2026-07-08

### Fixed
- The session navigator now keeps the active search query when leaving and re-entering search focus, and its footer now shows shortcuts for the current input mode. (#1115, #1140, thanks @liby)
- Re-focusing an already-focused done agent or pane through the socket API now marks it seen instead of leaving stale done status in API responses.
- Windows foreground-process detection now ignores cyclic process-parent snapshots instead of growing memory until the server aborts. (#1083)
- Terminal redraws now hide the cursor inside synchronized output, reducing focused-pane cursor flicker during active redraws. (#967)
- Headless render streams no longer scan visible plain-text URLs during rendering, reducing redraw work while preserving OSC 8 hyperlink metadata.
- The workspace picker once again honors navigate-mode workspace up/down keys, including custom bindings, after `prefix+w`. (#1149)

## [0.7.2] - 2026-07-07

### Added
- Added MastraCode integration support with lifecycle state reports and native thread restore. (#337, #788, thanks @wardpeet)
- Added `ui.sidebar_collapsed_mode = "hidden"` to make a collapsed sidebar use zero width while keeping the existing compact rail as the default. (#842)
- Added `herdr completion <shell>` / `herdr completions <shell>` to generate shell completion scripts for bash, elvish, fish, PowerShell, and zsh. (#435)
- Added `session.snapshot` to bootstrap client runtime state in one socket API response before subscribing to events.
- Added `herdr api schema` to inspect the bundled socket API schema, with `--json` for the full JSON Schema document and `--output PATH` for file output.
- Added `layout.updated` socket events so protocol clients can keep tab layout snapshots current after pane split, resize, swap, move, zoom, and layout mutations.
- Added pane scroll metrics to pane socket API responses and `pane.scroll_changed` subscriptions for clients that need to show when a pane is scrolled back.
- Added `herdr terminal session observe` for read-only live ANSI terminal streams that bridge processes can consume as newline-delimited JSON.
- Added `herdr terminal session control` for bridge processes that need live ANSI frames plus input, resize, scroll, release, and takeover authority.
- Added `ui.hide_tab_bar_when_single_tab` to hide the tab row when a workspace has one tab. (#448)
- Added Japanese and Simplified Chinese website docs.

### Changed
- The mobile switcher now starts from an agents-first summary and renders worktrees as a tree, making narrow terminals easier to scan.
- macOS prefix input-source switching now runs on the foreground client, so non-Latin input sources are restored reliably after prefix mode. (#774, #1016, thanks @ppggff)
- Nix packaging now uses `xcbuild` instead of custom Apple SDK wrappers for Darwin builds. (#995, thanks @arunoruto)

### Fixed
- Windows clients now send shifted punctuation such as `!`, `?`, and `:` as literal text to Kitty-keyboard-mode pane apps, fixing Kiro CLI TUI prompts while preserving modified key chords. (#1066, #1105)
- Alt-Shift letter chords are now preserved instead of being collapsed into plain uppercase input. (#1088)
- Antigravity background-task waits are now detected even when the UI does not show a `/tasks` hint. (#755)
- `herdr --remote` now prints clean remote attach failures and SSH authentication guidance instead of Rust Debug-formatted I/O errors when SSH authentication is denied. (#1034)
- `herdr server stop` now stops Windows named-pipe servers instead of failing with `named pipes do not support I/O timeouts`. (#1113)
- `herdr server stop` now waits until both server sockets are unreachable before returning, avoiding an immediate first-start failure when restarting right after replacing the binary.
- macOS `herdr --remote` clients now bridge Finder-dropped image files to the remote pane instead of forwarding the local file path as typed text. (#828)
- Grok Build agent detection now tracks the current Grok Build UI: panes report working while responses, tools, and subagents run, and blocked on permission prompts and question dialogs, instead of falling back to idle mid-turn. (#1017, #1055, thanks @TonyxSun)
- GitHub Copilot CLI detection now recognizes the newer Esc interrupt prompt as working. (#1119, #1120, thanks @LaneBirmingham)
- Unix local Herdr clients no longer treat empty bracketed paste as a clipboard-image bridge; `herdr --remote` keeps using it for local-desktop image paste over SSH. (#986)
- Custom command keybindings now run through `cmd.exe /d /c` on Windows instead of `/bin/sh`, so `type = "pane"` and `type = "shell"` bindings can launch native Windows commands. (#1041)
- Plain PageUp/PageDown now reach primary-screen pager apps such as `less -X` and Git diff when they enter application cursor mode, while shell transcripts still use Herdr pane scrollback. (#953)
- Copy mode now supports Ctrl-page navigation, keeps the Herdr prefix key available while copying, and restores the copy context correctly after prefix commands. (#681, #885, #1092, thanks @reobin)
- `prefix+e` scrollback editor panes now open on Windows without trying to run `/bin/sh`; Windows uses `VISUAL`, then `EDITOR`, then `notepad.exe` as the fallback editor. (#914)
- `herdr pane split --current` now resolves to the calling Herdr pane instead of the UI-focused pane when run inside a pane. (#902)
- Native Windows clients running inside Alacritty now preserve mouse reports and `ctrl+j` input instead of leaking mouse escape sequences into panes. `shift+enter` remains dependent on whether the outer terminal reports it as a distinct modified Enter key. (#792)
- Windows clients now preserve bracketed paste, Backspace, modifier-only keys, host cursor drawing, native clipboard copies, recent pane reads, and wait connections across the native input path. (#670, #795, #907, #920, #930, #962, #963, #1067)
- New tabs and workspaces now follow the focused pane's current directory more reliably, including PowerShell panes that report cwd through prompt shell integration on Windows. (#912, #919)
- Pi and OMP integration state now survives internal session reloads, recovers after resumed sessions such as `omp -c`, and reports Ask/tool approval waits as blocked instead of leaving the pane working or stuck on the previous session. (#800, #879, #984, thanks @dmmulroy)
- Pi state socket reports are now retried, reducing stale sidebar state when the report races server startup. (#1049)
- OpenCode now reports subagent permission prompts as blocked and handles object-form `session.status` events. (#838, thanks @soar)
- Remote attach now discovers compatible Homebrew, mise, and Nix profile installs before offering to install a sidecar binary to `~/.local/bin/herdr`. (#840)
- `herdr --remote` sessions now keep the remote server in its own login-independent session and preserve compatible running servers after helper binary updates, so network drops should disconnect only the client instead of killing remote panes.
- `herdr --remote` now reuses one OpenSSH connection across setup probes, installs, server checks, and the final bridge when `[remote].manage_ssh_config` is enabled, so password-based hosts prompt once instead of once per setup command. (#888)
- Foreground agent session reports can now replace stale saved session references, so resumed panes do not stay tied to an older agent session. (#943)
- Kitty graphics panes now repaint streaming image updates reliably and delete replaced host images instead of leaking them. (#947, #948, thanks @DevSrSouza)
- Pane apps that query OSC 12 cursor color now receive a response. (#806)
- ANSI undercurl styles now render in panes. (#895)
- CJK pane border labels, compact keybinding help ranges, and active auto-named tabs now measure by display width, avoiding broken alignment and unreadable labels. (#799, #810, #817, #829)
- Ctrl+/ is now encoded as Ctrl+_, matching terminal expectations for pane apps. (#847)
- PowerShell panes now stay alive after agent Ctrl+C. (#860)
- SGR mouse reports no longer leak into pane input after host-side handling. (#939)
- Wrapped pane links now preserve their target instead of being truncated across soft-wrapped lines. (#1098)
- Linux foreground process-group scans are cached, reducing idle CPU in large sessions. (#936)
- Session autosaves now run off the main loop, reducing UI stalls in busy sessions.
- Worktree removal now focuses the parent workspace after closing the worktree workspace. (#1004)
- Closing a tab from the context menu now exits the menu cleanly. (#945)
- Copy feedback now stays visible above retained pane updates. (#555)
- Windows ARM64 installer fallback now works when the normal checksum path is unavailable. (#897)

## [0.7.1] - 2026-06-24

### Added
- Added `[update].version_check` and `[update].manifest_check` so background Herdr version checks and remote agent-detection manifest checks can be disabled independently. Manual `herdr update` and bundled/local detection manifests still work when the background checks are disabled. (#677)
- Added `HERDR_AGENT=<agent>` as a Linux foreground-process hint for agents hidden behind wrappers such as VMs, Bubblewrap, or `fence`, allowing Herdr to use the named agent's screen manifest when `/proc` cannot expose the real command. (#679)
- Added `ui.pane_borders` and `ui.pane_gaps` to make split pane dividers and spacing configurable. (#271)

### Changed
- Removed the Agents panel workspace/all filter. The panel now always shows all agents, defaults to grouped-by-space ordering, and can switch to priority ordering with `ui.agent_panel_sort = "priority"`. (#318)
- User keybindings now displace conflicting built-in defaults during config load, so overriding a default binding no longer leaves both actions attached to the same key. (#747)
- Worktree creation now checks out an existing local branch when the requested branch already exists instead of failing by trying to create it again. (#729)
- Worktree operations started through the socket API and plugin/UI flows now defer long-running Git work until the app runtime can drive it, keeping clients responsive and preserving plugin lifecycle events for worktree-created panes. (#657, #662, #686)
- OMP, OpenCode, Pi, Devin, and other official hook integrations now scope lifecycle and session reports to the intended root agent process more reliably, reducing stale or cross-process session adoption after restarts, nested commands, and new sessions. (#614, #712, #719, #765)

### Fixed
- Windows Terminal multiline text paste now reaches pane apps as one bracketed paste, so OMP, Pi, and similar prompts no longer submit each pasted line separately. Plain Esc, Shift+Enter, mouse, focus, resize, and Unicode paste handling are preserved on the Windows client path. (#670)
- Local Herdr clients no longer treat raw `Ctrl+V` as a clipboard-image paste trigger, so pane apps such as Vim and Neovim receive block-visual `Ctrl+V` even when the desktop clipboard contains an image. `herdr --remote` keeps `keys.remote_image_paste = "ctrl+v"` by default. (#647)
- Herdr now refreshes cached host terminal colors when terminals report a light/dark color-scheme change, so pane apps that query OSC 10/11 no longer need detach/attach to see updated default colors. Opt-in `[theme].auto_switch` can also switch Herdr's own UI between configured `dark_name` and `light_name` themes. (#675)
- Full-lifecycle hook agents can now recover when an old release/report sequence belongs to a previous agent generation. Herdr keeps process-exit validation active under lifecycle authority and re-anchors hook sequence guards after fresh session references or proven process exits. (#684)
- OMP now reports a native session reference, so an OMP pane reappears in the Agents panel after exiting and rerunning `omp` in the same pane, and Herdr can resume it with `omp --resume=<session>`. Previously the released lifecycle hook stayed suppressed until a server restart. (#614)
- Host terminal color query (OSC 10/11) replies that arrive split at their escape introducer no longer leak as text like `11;rgb:...` into the focused pane, most visible when launching agents that probe terminal colors on startup. (#549)
- Long CJK Git branch names in the sidebar now truncate by display width instead of overflowing or cutting at the wrong cell boundary. (#644)
- Temporary pane commands launched from API flows no longer steal focus from the previously focused pane after they finish. (#658)
- Root agent session restore now ignores child process reports that would otherwise overwrite the saved session for the owning pane. (#712)
- Kitty file-transfer media queries are now answered, allowing pane apps that rely on kitty graphics file support to detect image/file media capability correctly. (#732)
- Idle or slow clients no longer block server writes to other clients while the blocked client is waiting for output. (#726)
- GitHub Copilot CLI `ask_user` accept prompts are now detected as blocked so the Agents panel shows that the pane is waiting for input. (#725)
- Pane reads now skip wide-character spacer cells, avoiding duplicated or malformed output around double-width characters. (#698)
- Split pane border intersections now use the active pane color consistently. (#742, thanks @cullendotdev)
- The Windows installer checksum fallback no longer depends on `Get-FileHash`, improving compatibility with constrained PowerShell environments. (#751)
- Pi launched through npm wrappers on Windows is now detected as Pi instead of a generic wrapped process. (#754)
- Windows builds now force the system ConPTY path through a vendored `portable-pty` patch, avoiding the bundled-path startup failure seen in affected Windows environments. (#761)
- Key release events that fall back to encoded input no longer double-send text into pane apps. (#769)
- Remote clients now allow a longer initial handshake, improving `herdr --remote` startup over high-latency links. (#753)

## [0.7.0] - 2026-06-15

### Added
- Added local plugin v1 support with `plugin.link/list/unlink/enable/disable`, manifest-declared actions, event hooks, managed plugin panes, link handlers, command logs, keybinding integration, and authoring docs under Preview docs.
- Added `herdr plugin install <owner>/<repo>[/subdir...]`, `plugin uninstall`, source metadata in `plugin.list`, offline registry fallback, and a human-readable default `plugin list` with `--json` for scripts.
- Added `herdr plugin config-dir <id>` and automatic plugin config/state directory creation so plugin setup docs can point users at a stable config path.
- Added Devin CLI automatic detection plus `herdr integration install devin` hooks that report session ids for restore with `devin --resume <id>`. Devin state remains screen-detected because Devin hooks do not cover every permission cancellation and user interrupt transition. (#606, #622, thanks @minatoaquaMK2)
- Added supporting plugin host APIs for `pane.current`, `pane.process_info`, `client.window_title.set/clear`, `layout.export/apply`, plugin pane placement, plugin invocation context/env injection, and plugin pane ownership across `pane.move`.
- Added `pane.move` and `herdr pane move` to relocate a running pane into another tab, a new tab, or a new workspace without restarting its terminal process. (#299)
- Tabs containing a zoomed pane are now marked in the tab bar so the zoom state is visible from other tabs.

### Changed
- Bumped the client/server protocol version to 14 for `pane.move` compatibility. (#299)
- Public workspace, tab, and pane ids are now short stable handles such as `w1`, `w1:t1`, and `w1:p1`; closed tab and pane ids no longer retarget later resources. (#569)

### Fixed
- `pane.send_keys` and `pane.send_input.keys` now accept Herdr key-combo strings such as `ctrl+h`, `ctrl+j`, `ctrl+k`, and `ctrl+l`. (#613, thanks @dmmulroy)
- Config startup and reload now warn about unknown top-level table sections, including a `[toast]` hint that points to `[ui.toast]`, instead of silently ignoring them.
- Claude Code session restore now accepts real `/clear`, `/resume`, and compacted session identity changes while still ignoring nested `claude -p` startup sessions that inherit the pane environment. (#620)
- Auto-named tab labels now stay compact after closing, moving, or creating tabs while public tab ids remain stable.
- F1-F4 key presses sent as `ESC[11~` through `ESC[14~` now reach pane apps instead of being dropped. (#574)
- Numeric keypad keys sent through the kitty keyboard protocol now enter their digits and operators instead of being dropped. (#570)
- Pane resize keybindings now shrink panes again instead of only being able to grow them. (#562)
- Windows pane cursor rendering is now stable instead of showing a misplaced or flickering cursor. (#556)
- Tab identity is now preserved across restored sessions.
- Idle panes now poll their PTY less frequently, reducing CPU use while sessions are inactive.
- Captured pane URL clicks, including plugin link handlers, now use Ctrl-click on macOS too because captured terminal mouse reports do not expose Cmd-click separately from plain click. (#307)

## [0.6.10] - 2026-06-11

This is a hotfix release for v0.6.9. See the v0.6.9 notes for the full feature release.

### Fixed
- Lifecycle-authority agent integrations such as Pi and OpenCode no longer trigger a repeated detection reset loop that could flood logs, drive high CPU, and make the UI lag or stop responding. (#560, #565, thanks @dzevs)

## [0.6.9] - 2026-06-10

### Fixed
- Copy mode page scrolling now stops at the same top and bottom boundaries as normal pane scrolling instead of overshooting or getting stuck near the edges. (#459, #460, thanks @reobin)
- Clipboard-copy feedback no longer stays visible after the related selection state has gone stale. (#443)
- The session navigator now uses live workspace labels, so renamed workspaces and cwd-derived labels stay current while navigating. (#377)
- Hermes Agent integration installs now preserve flat plugin-list settings instead of rewriting them into nested lists. (#479)
- Host-terminal focus redraws now stay pending until the client can send them, so panes refresh after focus returns even when redraw delivery was briefly busy.
- Numeric keypad keys that send VT100 application-keypad escape sequences now enter their digits and operators instead of being dropped. (#493)
- Codex panes now stay marked working when the live status header uses reasoning-summary text such as `Investigating code output` instead of the literal `Working` label. (#501)
- Codex blocker detection now ignores stale prompt text outside the live prompt region, reducing false blocked states from old scrollback.
- Native pane URL clicks now use Cmd-click on macOS and Ctrl-click on other platforms. (#307)
- Worktree open, create, and remove actions now work from bare repositories instead of assuming a normal checkout. (#497)
- Pane mouse handling no longer sends empty PTY writes for mouse events that produce no terminal input. (#496)
- Pane output now renders flag emoji and other multi-codepoint grapheme clusters as complete symbols instead of blank cells. (#243)
- Starting Herdr with no restored workspaces, or closing the last workspace, now opens a default workspace instead of leaving the client on an empty screen where direct keybindings such as `cmd+n` were shown but ignored. (#366)
- Resizing restored panes no longer aborts the server when libghostty-vt reflows a terminal whose pre-resize cursor row is past the new height. (#465)
- Full-screen TUIs such as Neovim now receive resize-generated terminal responses after Herdr internal pane resizes, so grown panes redraw without waiting for extra input. (#471)
- Nested agent session reports from child terminals no longer overwrite the owning pane's restored agent session id. (#511)
- Headless servers now avoid repeated scrollback rendering work for inactive panes, reducing CPU in large sessions. (#512)
- Mouse-click handling now respects `ui.prompt_new_tab_name`, so mouse-created tabs follow the same naming prompt setting as keyboard-created tabs. (#521, thanks @imrajyavardhan12)
- Pasting now works in modal text inputs, including rename prompts, command prompts, and worktree dialogs. (#302)
- Linux clipboard image reads now validate image payloads before accepting them, preventing malformed clipboard data from reaching pane image paste flows. (#534)

### Added
- Added remote auto-updates for agent detection manifests, with per-agent validation, local override precedence, `herdr server agent-manifests` diagnostics, and explain output showing remote manifest status.
- Added `herdr server update-agent-manifests` to fetch remote agent detection manifests immediately, reload the running server, and print the updated manifest status.
- Added `herdr agent explain` to show the manifest source, matched rule, evaluated matcher and region evidence, visible evidence flags, skipped-update reason, and idle fallback reason for live panes or saved screen fixtures.
- Added `herdr integration install kimi` for Kimi Code CLI hooks that report lifecycle state and session ids through Herdr's socket API. When native agent session restore is enabled, Herdr can resume Kimi panes with `kimi --session <id>`. (#431, #463, thanks @wbxl2000)
- Added `herdr integration install droid` for Factory Droid hooks that report session ids through Herdr's socket API. When native agent session restore is enabled, Herdr can resume Droid panes with `droid --resume <id>`.
- Added `herdr integration install kilo` for Kilo Code CLI plugins that report lifecycle state and session ids through Herdr's socket API. When native agent session restore is enabled, Herdr can resume Kilo panes with `kilo --session <id>`.
- Added `herdr integration install cursor` for Cursor Agent CLI hooks that report session ids through Herdr's socket API. When native agent session restore is enabled, Herdr can resume Cursor panes with `cursor-agent --resume <id>`. (#506, thanks @udirom)
- Added directional pane swap with `prefix+shift+h/j/k/l`, a pane context-menu swap action, pane layout/neighbor/edge/focus/resize socket APIs, matching CLI commands, and optional `pane split --ratio` support. (#330, #421)
- Added `herdr pane zoom` and the `pane.zoom` socket API to toggle, set, or clear tab-local pane zoom from scripts and integrations.
- Added toast ergonomics controls for delayed agent notifications, in-app toast placement, copied-to-clipboard feedback, and the `notification.show` socket API with `herdr notification show` and optional `none`, `done`, or `request` sounds. (#486)

### Changed
- OpenCode installed with the current Herdr plugin now reports lifecycle state directly instead of relying on screen manifest detection. Kimi Code CLI `0.14.0` or newer now reports full lifecycle state through hooks, including interrupts. Droid and Qoder CLI now report native session identity while leaving lifecycle state to screen manifest detection.

## [0.6.8] - 2026-06-04

This is a hotfix release for v0.6.7, prioritizing a server-crash fix for panes that print complex Unicode or emoji output.

### Fixed
- Fixed a Herdr server crash triggered by pane output containing complex Unicode, emoji, or decomposed accent graphemes. Affected sessions could lose running pane processes or crash again after restore if the same saved pane output was replayed. (#453)
- Direct installs managed by mise now update through the mise install path instead of failing to replace the active binary.
- Claude Code panes that are actively thinking or streaming no longer flicker to blocked because of custom status text. (#409)
- Claude Code panes now detect running shell-command status more reliably.
- OpenCode installed through pnpm is now detected as `opencode` instead of being missed because the packaged executable is named `opencode.exe`. (#447)

### Added
- Added opt-in macOS input-source switching during prefix mode with `experimental.switch_ascii_input_source_in_prefix`, so users typing with a non-Latin IME can run prefix commands through an ASCII-capable input source and return to the previous input source when prefix mode ends. (#400, #434, thanks @sf-jin-ku)

## [0.6.7] - 2026-06-03

### Added

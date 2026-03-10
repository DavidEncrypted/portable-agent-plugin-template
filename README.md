# Portable Agent Plugin Template

A starting point for building plugins that work with both Claude Code and
GitHub Copilot CLI. Fork this repo, replace the example plugin with your own
skills and MCP servers, and distribute it to your team.

## Why this exists

Claude Code and Copilot CLI both support plugins, but they discover and load
them differently. Getting a single repo to work with both tools requires three
manifest files, each serving a different consumer. This template has that
wiring done so you can focus on writing skills and MCP servers instead of
debugging discovery paths.

The two component types that are fully portable across both tools are:

- **Skills** -- markdown files with YAML frontmatter that teach the agent when
  and how to do something. No code runs; the agent reads the instructions.
- **MCP servers** -- external processes that expose tools over the Model Context
  Protocol. The plugin declares how to start them.

Other component types (commands, hooks, agents) have partial or no
cross-tool compatibility and are intentionally left out of this template.

## What is included

The template ships with one example plugin containing:

- A `greeting` skill that responds when you say hello (verifies skill loading).
- An `echo` MCP server that returns whatever you send it (verifies MCP loading).
  Zero dependencies, runs with Node.js.

Both exist only to let you confirm the install worked. Replace them with your
own content.

## Repository structure

```
.claude-plugin/
  marketplace.json              # Claude Code discovers this as a marketplace
.github/
  plugin/
    plugin.json                 # Copilot CLI discovers this as a direct plugin
                                # (MCP servers inlined here for Copilot CLI)
plugins/
  example-plugin/
    .claude-plugin/
      plugin.json               # Plugin manifest (Claude Code reads this via marketplace)
    skills/
      greeting/
        SKILL.md                # Example skill
    mcp-servers/
      echo-server.mjs           # Example MCP server
    .mcp.json                   # MCP server definitions (Claude Code reads this)
    README.md
```

### Why three manifests

| File | Read by | Purpose |
|------|---------|---------|
| `.claude-plugin/marketplace.json` | Claude Code | Registers the repo as a marketplace; points to `./plugins/example-plugin` |
| `.github/plugin/plugin.json` | Copilot CLI | Direct plugin entry point with MCP servers inlined |
| `plugins/example-plugin/.claude-plugin/plugin.json` | Claude Code (via marketplace) | The actual plugin manifest CC loads after resolving the marketplace path |

Claude Code auto-discovers `.mcp.json` next to the plugin manifest, so MCP
servers are not inlined there. Copilot CLI does not do this auto-discovery, so
the root-level `.github/plugin/plugin.json` inlines them.

## Installation

### Option A: Marketplace install

Best for personal or org-wide distribution. One-time setup, persists across
sessions.

**Claude Code:**

```bash
claude plugin marketplace add your-org/portable-agent-plugin-template
claude plugin install example-plugin@portable-agent-plugin-template
```

**Copilot CLI:**

```bash
/plugin marketplace add your-org/portable-agent-plugin-template
/plugin install example-plugin@portable-agent-plugin-template
```

For private repos, the user needs git access configured (SSH keys or `gh auth`).

### Option B: Git submodule

Best when you want the plugin version-locked to a specific project and
reviewable in PRs.

```bash
git submodule add https://github.com/your-org/portable-agent-plugin-template.git vendor/agent-plugins
git commit -m "add agent plugin submodule"
```

**Claude Code** -- add to your project's `.claude/settings.json` and commit it:

```json
{
  "pluginMarketplaces": ["./vendor/agent-plugins"],
  "enabledPlugins": {
    "example-plugin@portable-agent-plugin-template": true
  }
}
```

Teammates who clone with `--recurse-submodules` get prompted to enable the
plugin when they trust the folder. Updates arrive via `git submodule update`.

**Copilot CLI** -- after cloning, run:

```bash
copilot plugin install ./vendor/agent-plugins/plugins/example-plugin
```

This copies the plugin into Copilot CLI's cache. After a submodule update you
need to re-run the install, or use `--plugin-dir` for direct loading:

```bash
copilot --plugin-dir ./vendor/agent-plugins/plugins/example-plugin
```

### Choosing between the two

| Concern | Marketplace install | Git submodule |
|---------|-------------------|---------------|
| Version pinning | Latest from marketplace | Pinned to submodule commit |
| Onboarding friction | Each user runs install once | Clone with `--recurse-submodules`, then install for Copilot |
| Works across all projects | Yes | Only in repos that include the submodule |
| PR-reviewable changes | No | Yes |
| Auto-updates | After `plugin update` | After `git submodule update` (CC only; Copilot needs reinstall) |

Both methods can coexist. If the same skill name appears from multiple sources,
the first one loaded wins. Precedence order: project-level > personal > plugin.

## Verifying the install

1. Start a session in Claude Code or Copilot CLI.
2. Say "hello" -- the agent should respond with the greeting skill message.
3. Ask the agent to use the `echo` tool with any string -- it should echo it back.

If both work, your plugin is loaded correctly.

## Adapting the template

1. Replace `example-plugin` everywhere with your plugin name (kebab-case).
2. Replace the `greeting` skill directory with your own skills. Each skill is a
   directory under `skills/` containing a `SKILL.md` with YAML frontmatter
   (`name` and `description` fields) followed by markdown instructions.
3. Replace `echo-server.mjs` with your own MCP servers. Update the server
   definitions in both `.mcp.json` and `.github/plugin/plugin.json`.
4. Update the `name`, `description`, `author`, and `owner` fields in all three
   manifest files.
5. For MCP server commands, use portable launchers (`node`, `npx`, `uvx`,
   `python`) rather than absolute paths.

### Adding more plugins

Add another directory under `plugins/` and a second entry in
`marketplace.json`. Users install them independently:
`my-other-plugin@your-marketplace`.

## Rules for dual compatibility

**Do:**
- Use `skills/` directories with `SKILL.md` files for teaching the agent.
- Use `.mcp.json` for MCP server definitions (CC) and inline them in
  `.github/plugin/plugin.json` (Copilot).
- Keep `name` fields in kebab-case.
- Keep MCP server commands portable.

**Do not:**
- Use `commands/` (CC-only, Copilot ignores them).
- Use `settings.json` at the plugin root (CC-only).
- Use `${CLAUDE_PLUGIN_ROOT}` in paths (CC-only).
- Rely on auto-discovery without a manifest (Copilot needs `plugin.json`).
- Use hardcoded absolute paths.

## License

MIT

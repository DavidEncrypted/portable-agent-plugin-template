# Portable Agent Plugin Template

A template for packaging skills and MCP servers into a plugin that can be
version-controlled in its own repo and pulled into any project as a git
submodule (or installed from a marketplace).

## The problem

You have skills and MCP servers that you want to reuse across multiple repos.
Dropping them directly into each project's `.claude/` or equivalent folder
means duplicated files, no single source of truth, and no clean way to version
or update them. You cannot add a local skills folder from another repo as a
submodule because the expected directory structure does not allow it.

## The solution

Wrap your skills and MCP servers in the plugin format. Plugins are the
packaging unit that both Claude Code and Copilot CLI understand, and they
have a directory structure that works as a standalone repo. This means you
can store your plugins in a dedicated repo and pull them into projects as a
git submodule, with versioning tied to the submodule commit.

The plugin format also supports marketplace-style installation from a repo
URL, so the same repo works for both distribution methods without changes.

## What is included

This template contains one example plugin with:

- A `greeting` skill -- responds when you say hello (verifies skill loading).
- An `echo` MCP server -- returns whatever you send it (verifies MCP loading).
  Zero dependencies, runs with Node.js.

Both exist only to confirm the install worked. Replace them with your own.

## Repository structure

```
.claude-plugin/
  marketplace.json              # Registers repo as a marketplace (Claude Code)
.github/
  plugin/
    plugin.json                 # Direct plugin entry point (Copilot CLI)
                                # MCP servers are inlined here
plugins/
  example-plugin/
    .claude-plugin/
      plugin.json               # Plugin manifest (Claude Code, via marketplace)
    skills/
      greeting/
        SKILL.md
    mcp-servers/
      echo-server.mjs
    .mcp.json                   # MCP server definitions (Claude Code)
    README.md
```

### Why three manifests

Claude Code and Copilot CLI discover plugins differently. Three files cover
both tools:

| File | Read by | Purpose |
|------|---------|---------|
| `.claude-plugin/marketplace.json` | Claude Code | Registers the repo as a marketplace; points to `./plugins/example-plugin` |
| `.github/plugin/plugin.json` | Copilot CLI | Direct plugin entry point with MCP servers inlined |
| `plugins/example-plugin/.claude-plugin/plugin.json` | Claude Code (via marketplace) | The plugin manifest CC loads after resolving the marketplace path |

Claude Code auto-discovers `.mcp.json` next to the plugin manifest, so MCP
servers are not inlined there. Copilot CLI does not do this, so the root-level
`.github/plugin/plugin.json` inlines them.

This is the cost of dual compatibility. If you only target one tool, you can
drop the manifests for the other.

## Installation

### Git submodule (recommended)

Version-locked to a specific commit, reviewable in PRs, available to anyone
who clones the repo.

```bash
git submodule add https://github.com/DavidEncrypted/portable-agent-plugin-template.git vendor/agent-plugins
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

Anyone who clones with `--recurse-submodules` gets prompted to enable the
plugin. Updates arrive via `git submodule update`.

**Copilot CLI** -- after cloning:

```bash
copilot plugin install ./vendor/agent-plugins/plugins/example-plugin
```

After a submodule update, re-run the install. Alternatively, use
`--plugin-dir` for direct loading (must be passed every launch):

```bash
copilot --plugin-dir ./vendor/agent-plugins/plugins/example-plugin
```

### Marketplace install (alternative)

Better when you want the plugin available across all projects without adding
a submodule to each.

**Claude Code:**

```bash
claude plugin marketplace add DavidEncrypted/portable-agent-plugin-template
claude plugin install example-plugin@portable-agent-plugin-template
```

**Copilot CLI:**

```bash
/plugin marketplace add DavidEncrypted/portable-agent-plugin-template
/plugin install example-plugin@portable-agent-plugin-template
```

For private repos, git access needs to be configured (SSH keys or `gh auth`).

### Tradeoffs

| Concern | Git submodule | Marketplace install |
|---------|---------------|---------------------|
| Version pinning | Pinned to submodule commit | Latest from marketplace |
| PR-reviewable changes | Yes | No |
| Onboarding | Clone with `--recurse-submodules` | Run install once |
| Works across all projects | Only where the submodule is added | Yes |
| Updates | `git submodule update` | `plugin update` |

Both methods can coexist without conflicts. If the same skill name appears
from multiple sources, the first loaded wins (project-level > personal > plugin).

## Verifying the install

1. Start a session in Claude Code or Copilot CLI.
2. Say "hello" -- the agent should respond with the greeting skill message.
3. Ask the agent to use the `echo` tool with any string -- it should echo it back.

If both work, the plugin loaded correctly.

## Adapting the template

1. Replace `example-plugin` everywhere with your plugin name (kebab-case).
2. Replace the `greeting` skill with your own. Each skill is a directory under
   `skills/` containing a `SKILL.md` with YAML frontmatter (`name` and
   `description`) followed by markdown instructions.
3. Replace `echo-server.mjs` with your own MCP servers. Update the definitions
   in both `.mcp.json` and `.github/plugin/plugin.json`.
4. Update `name`, `description`, `author`, and `owner` in all three manifests.
5. Use portable launchers for MCP server commands (`node`, `npx`, `uvx`,
   `python`) -- no absolute paths.

To add more plugins later, create another directory under `plugins/` and add
an entry to `marketplace.json`. They can be installed independently:
`my-other-plugin@your-marketplace`.

## Dual compatibility rules

Skills and MCP servers are the two component types that work identically
across Claude Code and Copilot CLI. Other types (commands, hooks, agents)
have partial or no cross-tool support and are left out of this template.

Things to avoid if you want both tools to work:

- `commands/` directory (Claude Code only)
- `settings.json` at the plugin root (Claude Code only)
- `${CLAUDE_PLUGIN_ROOT}` in paths (Claude Code only)
- Skipping the manifest (Copilot CLI requires `plugin.json`)
- Hardcoded absolute paths

## License

MIT

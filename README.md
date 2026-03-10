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
- A `time` MCP server -- exposes `get_current_time` and `convert_time` tools
  (verifies MCP loading). Uses `mcp-server-time` via uvx.

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
git submodule add https://github.com/DavidEncrypted/portable-agent-plugin-template.git .agent-plugins/portable-agent-plugin-template
git commit -m "add agent plugin submodule"
```

**Claude Code** -- add to your project's `.claude/settings.json` and commit it:

```json
{
  "pluginMarketplaces": ["./.agent-plugins/portable-agent-plugin-template"],
  "enabledPlugins": {
    "example-plugin@portable-agent-plugin-template": true
  }
}
```

Anyone who clones with `--recurse-submodules` gets prompted to enable the
plugin. Updates arrive via `git submodule update`.

**Copilot CLI** -- after cloning:

```bash
copilot plugin install ./.agent-plugins/portable-agent-plugin-template/plugins/example-plugin
```

After a submodule update, re-run the install. Alternatively, use
`--plugin-dir` for direct loading (must be passed every launch):

```bash
copilot --plugin-dir ./.agent-plugins/portable-agent-plugin-template/plugins/example-plugin
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
3. Ask the agent what time it is -- it should use the `get_current_time` tool.

If both work, the plugin loaded correctly.

## Adapting the template

### How naming works

There are three names that matter and they connect like this:

```
claude plugin install <plugin-name>@<marketplace-name>
```

- **Marketplace name** -- the `name` field in `.claude-plugin/marketplace.json`.
  This is also how the repo is identified when added as a marketplace. In this
  template it is `portable-agent-plugin-template`.
- **Plugin name** -- the `name` field in each plugin's
  `.claude-plugin/plugin.json`, and the directory name under `plugins/`. These
  must match. In this template it is `example-plugin`.
- **Skill name** -- the `name` field in each `SKILL.md` frontmatter. Must be
  unique across all installed plugins to avoid collisions.

The `source` field in `marketplace.json` ties the marketplace to the plugin
directory: `"source": "./plugins/example-plugin"`. This path is how Claude Code
finds the plugin after resolving the marketplace.

For Copilot CLI, the `.github/plugin/plugin.json` at the repo root acts as the
entry point. Its `name` field should match the plugin name.

### Renaming the plugin

1. Rename the `plugins/example-plugin/` directory to `plugins/<your-name>/`.
2. Update `name` in these files:
   - `plugins/<your-name>/.claude-plugin/plugin.json`
   - `.github/plugin/plugin.json`
3. Update the `source` path and plugin `name` in `.claude-plugin/marketplace.json`.
4. Update the marketplace `name` if you want a different marketplace identifier
   (typically matches the repo name).

### Writing skills

Each skill is a directory under `plugins/<name>/skills/` containing a
`SKILL.md` file. The format:

```markdown
---
name: my-skill
description: When and why the agent should use this skill. Be specific.
---

# Instructions

The markdown body is loaded into the agent's context when the description
matches the user's task. Write it as instructions the agent should follow.
```

The `description` field is what the agent uses to decide whether to load the
skill, so make it concrete. "Use when deploying services" is better than
"Deployment helper".

You can add a `references/` subdirectory next to `SKILL.md` for supplementary
docs that the skill instructions can point the agent to.

### Adding MCP servers

MCP server definitions need to go in two places:

1. `plugins/<name>/.mcp.json` -- Claude Code reads this automatically.
2. `.github/plugin/plugin.json` under `mcpServers` -- Copilot CLI needs them
   inlined here.

Both must define the same servers. Using package managers (`npx`, `uvx`) to
reference published MCP servers is the simplest approach and works across
all installation methods.

### Adding more plugins to this repo

Create another directory under `plugins/` and add an entry to
`marketplace.json`:

```json
{
  "plugins": [
    {
      "name": "example-plugin",
      "source": "./plugins/example-plugin"
    },
    {
      "name": "another-plugin",
      "source": "./plugins/another-plugin"
    }
  ]
}
```

They can be installed independently: `another-plugin@portable-agent-plugin-template`.

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

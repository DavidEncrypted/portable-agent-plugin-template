# example-plugin

A minimal plugin containing one skill and one MCP server. Its only purpose is to
verify that the plugin installed correctly and both component types load.

## Components

### Skill: greeting

Located in `skills/greeting/SKILL.md`. Triggers when the user says hello. If the
agent responds with the greeting message, the skill is loading correctly.

### MCP server: time

Uses `mcp-server-time` via uvx. Exposes `get_current_time` and `convert_time`
tools. If the agent can tell you the current time, MCP is working correctly.

Requires Python and uvx.

## Testing after install

1. Start a session in Claude Code or Copilot CLI.
2. Say "hello" -- the agent should respond with the greeting skill message.
3. Ask the agent what time it is -- it should use the `get_current_time` tool.

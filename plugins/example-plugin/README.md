# example-plugin

A minimal plugin containing one skill and one MCP server. Its only purpose is to
verify that the plugin installed correctly and both component types load.

## Components

### Skill: greeting

Located in `skills/greeting/SKILL.md`. Triggers when the user says hello. If the
agent responds with the greeting message, the skill is loading correctly.

### MCP server: echo-server

Located in `mcp-servers/echo-server.mjs`. Exposes a single `echo` tool that
returns whatever string you pass it. If the agent can call the `echo` tool and
get a response, MCP is working correctly.

Requires Node.js (no dependencies).

## Testing after install

1. Start a session in Claude Code or Copilot CLI.
2. Say "hello" -- the agent should respond with the greeting skill message.
3. Ask the agent to use the `echo` tool with any string -- it should echo it back.

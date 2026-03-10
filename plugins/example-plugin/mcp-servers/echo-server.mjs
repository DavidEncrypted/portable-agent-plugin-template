#!/usr/bin/env node

// Minimal MCP server over stdio. No dependencies required.
// Exposes a single "echo" tool that returns whatever message you send it.
// Used to verify that MCP server loading works after plugin install.

import { createInterface } from "readline";

const SERVER_INFO = {
  name: "echo-server",
  version: "0.1.0",
};

const ECHO_TOOL = {
  name: "echo",
  description:
    "Returns the message you send it. Use this to verify the MCP server is working.",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The message to echo back.",
      },
    },
    required: ["message"],
  },
};

function handleRequest(request) {
  const { method, params } = request;

  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      };

    case "tools/list":
      return { tools: [ECHO_TOOL] };

    case "tools/call": {
      const toolName = params?.name;
      if (toolName !== "echo") {
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
        };
      }
      const message = params?.arguments?.message ?? "(empty)";
      return {
        content: [{ type: "text", text: message }],
      };
    }

    case "notifications/initialized":
      return null; // no response needed for notifications

    default:
      return {
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

// stdio JSON-RPC transport
const rl = createInterface({ input: process.stdin });
let buffer = "";

process.stdin.setEncoding("utf8");

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch {
    return; // silently ignore malformed input
  }

  const result = handleRequest(request);
  if (result === null) return; // notification, no response

  const response = { jsonrpc: "2.0", id: request.id };
  if (result.error) {
    response.error = result.error;
  } else {
    response.result = result;
  }

  process.stdout.write(JSON.stringify(response) + "\n");
});

# @accesslint/mcp

MCP server for accessible agentic coding — WCAG audit tools for AI coding agents.

## Setup

```json
{
  "mcpServers": {
    "accesslint": {
      "command": "npx",
      "args": ["@accesslint/mcp"]
    }
  }
}
```

## Tools

- **audit_html** — Audit an HTML string for WCAG violations
- **audit_file** — Audit an HTML file for WCAG violations
- **diff_html** — Compare two HTML strings for accessibility changes
- **list_rules** — List available WCAG rules

## License

MIT

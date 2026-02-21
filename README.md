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
- **audit_url** — Fetch a URL and audit the returned HTML for WCAG violations
- **diff_html** — Compare two HTML strings for accessibility changes
- **list_rules** — List available WCAG rules

All audit and diff tools accept an optional `min_impact` parameter to filter results by severity. Valid values, from most to least severe: `critical`, `serious`, `moderate`, `minor`. When set, only violations at that level or above are shown.

## License

MIT

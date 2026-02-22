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

## React Component Auditing

To audit React components (`.jsx`/`.tsx`), the agent uses the `audit-react-component` prompt, which guides it through:

1. Creating a small render script that imports the component and calls `renderToStaticMarkup`
2. Running the script using the project's own transpiler (`tsx`, `node --experimental-strip-types`, `esbuild`, or `tsc`)
3. Passing the HTML output to `audit_html` with `component_mode: true`

No extra runtime dependencies are required — the workflow uses `react-dom/server` (already present in React projects) and whatever transpiler the project has available.

## License

MIT

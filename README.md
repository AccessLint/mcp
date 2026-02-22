# @accesslint/mcp

MCP server for accessible agentic coding — WCAG audit tools for AI coding agents.

## Why use this instead of prompting alone?

AI coding agents can attempt accessibility fixes without any tools, but they work from general knowledge rather than a concrete audit of your code. Both approaches were benchmarked across 25 HTML test cases covering 67 fixable WCAG violations (3 runs each, Claude Opus):

| | With @accesslint/mcp | Agent alone |
|---|---|---|
| **Violations fixed** | 99.5% (200/201) | 93.5% (188/201) |
| **Regressions** | 1.7 / run | 2.0 / run |
| **Cost** | $0.56 / run | $0.62 / run |
| **Duration** | 270s / run | 377s / run |
| **Timeouts** | 0 / 63 tasks | 2 / 63 tasks |

Without tools, the agent has to read the HTML, recall WCAG rules from training data, reason about which rules apply to which elements, and then fix them. The MCP replaces that open-ended reasoning with structured output — specific rule IDs, CSS selectors pointing to exact elements, and concrete fix suggestions like `set-attribute role="navigation"`. The agent skips straight to applying fixes.

This shows up directly in the data: the MCP-assisted path uses 23% fewer output tokens per run (9,815 vs 12,758), meaning roughly 3,000 tokens of "thinking out loud" that the agent no longer needs to do. Fewer reasoning steps = fewer tokens = less time = lower cost. The largest gains are on complex cases like nested landmark structures, where the agent alone timed out in 2 of 3 runs while the MCP-assisted path completed every time.

The same principle applies broadly to tool-augmented agents — a deterministic audit engine running axe-core rules is both faster and more reliable at identifying violations than an LLM reasoning from memory. The agent's strength is understanding context and writing code, not recalling rule specifications.

## Setup

Add to your MCP client configuration:

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

- **audit_html** — Audit an HTML string for WCAG violations. Auto-detects fragments vs full documents.
- **audit_file** — Read an HTML file from disk and audit it.
- **audit_url** — Fetch a URL and audit the returned HTML.
- **diff_html** — Audit new HTML and diff against a previously named audit to verify fixes.
- **list_rules** — List available WCAG rules with optional filters by category, level, fixability, or criterion.
- **storybook_stories** — List stories from a running Storybook instance. Use this to discover components before auditing them.

All audit and diff tools accept an optional `min_impact` parameter to filter results by severity. Valid values, from most to least severe: `critical`, `serious`, `moderate`, `minor`. When set, only violations at that level or above are shown.

Each violation in the audit output includes the rule ID, CSS selector, failing HTML, impact level, and — where available — a concrete fix suggestion, fixability rating, and guidance. When multiple elements break the same rule, shared metadata is printed once to keep output compact.

## Prompts

### React Component Auditing

To audit React components (`.jsx`/`.tsx`), the agent uses the `audit-react-component` prompt, which guides it through:

1. Reading the component source
2. Mentally rendering it to static HTML (acting as `renderToStaticMarkup`)
3. Passing the rendered HTML to `audit_html` with `component_mode: true`

No extra runtime dependencies are required — the agent renders the component itself based on the source code.

### Storybook Auditing

To audit components rendered in Storybook, the agent uses the `audit-storybook` prompt, which orchestrates:

1. Discovering stories via `storybook_stories`
2. Navigating to the story's iframe URL in the browser
3. Extracting the rendered HTML and passing it to `audit_html`
4. After fixes, reloading the story and using `diff_html` to verify

This works with any framework Storybook supports — React, Vue, Svelte, Web Components, etc. Requires a running Storybook instance and browser tools (e.g. Chrome DevTools MCP).

## License

MIT

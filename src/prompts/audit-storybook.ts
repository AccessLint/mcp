import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const argsSchema = {
  component: z
    .string()
    .describe("Component name to search for in Storybook (e.g. 'Button')"),
  url: z
    .string()
    .default("http://localhost:6006")
    .describe("Storybook base URL (default: http://localhost:6006)"),
};

export function registerAuditStorybookPrompt(server: McpServer): void {
  server.prompt(
    "audit-storybook",
    "Audit a component rendered in Storybook for accessibility violations",
    argsSchema,
    ({ component, url }) => {
      const instructions = `## Audit a Storybook component for accessibility

### Step 1: Find the story

Use the \`storybook_stories\` tool to find stories for this component:

\`\`\`
storybook_stories({ url: "${url}", search: "${component}" })
\`\`\`

Pick the most representative story (usually "Default" or "Primary"). If no stories are found, check that Storybook is running at ${url}.

### Step 2: Render the story in the browser

Navigate to the story's iframe URL using \`navigate_page\`:

\`\`\`
navigate_page({ url: "<iframe URL from step 1>", type: "url" })
\`\`\`

Wait for the component to render, then extract the rendered HTML:

\`\`\`
evaluate_script({ function: '() => document.getElementById("storybook-root")?.innerHTML ?? document.getElementById("root")?.innerHTML ?? ""' })
\`\`\`

### Step 3: Audit the HTML

Pass the extracted HTML to \`audit_html\` with component mode and a name for diffing:

\`\`\`
audit_html({ html: "<extracted HTML>", component_mode: true, name: "${component}" })
\`\`\`

### Step 4: Fix and verify

After fixing violations in the component source, reload the story and re-audit. Use \`diff_html\` to see what changed:

\`\`\`
navigate_page({ type: "reload" })
evaluate_script({ function: '() => document.getElementById("storybook-root")?.innerHTML ?? document.getElementById("root")?.innerHTML ?? ""' })
diff_html({ html: "<new HTML>", before: "${component}" })
\`\`\`

### Tips

- **Interactive states:** Use \`hover\` and \`click\` to test hover/focus states, then re-extract and audit.
- **Dark mode:** Use \`emulate({ colorScheme: "dark" })\` to test contrast in dark mode.
- **Multiple variants:** Audit other stories for the same component to cover different states (disabled, error, loading, etc.).`;

      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: instructions },
          },
        ],
      };
    }
  );
}

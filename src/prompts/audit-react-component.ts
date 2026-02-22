import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const argsSchema = {
  path: z.string().describe("Path to the React component file (.jsx or .tsx)"),
};

export function registerAuditReactComponentPrompt(server: McpServer): void {
  server.prompt(
    "audit-react-component",
    "Render a React component to HTML and audit it for accessibility violations",
    argsSchema,
    ({ path }) => {
      const renderScript = [
        `import { renderToStaticMarkup } from "react-dom/server";`,
        `import { createElement } from "react";`,
        `import Component from "./${path}";`,
        `process.stdout.write(renderToStaticMarkup(createElement(Component)));`,
      ].join("\n");

      const instructions = `## Audit a React component for accessibility

### Step 1: Create a render script

Save this script next to the component (e.g. \`render.tsx\`):

\`\`\`tsx
${renderScript}
\`\`\`

Adjust the import path if needed so it resolves correctly relative to where you save the script.

If the component requires props, pass them to \`createElement\` as the second argument:
\`\`\`tsx
renderToStaticMarkup(createElement(Component, { title: "Example" }))
\`\`\`

### Step 2: Run the script

Use whichever transpiler is available in the project, in priority order:

1. **\`npx tsx render.tsx\`** — if \`tsx\` is in devDependencies or globally available
2. **\`node --experimental-strip-types render.tsx\`** — if Node.js 22+
3. **\`npx esbuild render.tsx --bundle --platform=node | node\`** — if esbuild is available
4. **\`npx tsc render.tsx --jsx react-jsx --module nodenext --moduleResolution nodenext --outDir /tmp/render && node /tmp/render/render.js\`** — fallback for any TypeScript project

Check the project's \`package.json\` devDependencies to determine which tool is available.

### Step 3: Audit the HTML output

Pass the captured stdout to the \`audit_html\` tool with \`component_mode: true\`:

\`\`\`
audit_html({ html: "<captured output>", component_mode: true })
\`\`\`

### Step 4: Clean up

Delete the render script after auditing.`;

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

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAuditHtml } from "./tools/audit-html.js";
import { registerAuditFile } from "./tools/audit-file.js";
import { registerAuditUrl } from "./tools/audit-url.js";
import { registerDiffHtml } from "./tools/diff-html.js";
import { registerListRules } from "./tools/list-rules.js";

const server = new McpServer({
  name: "accesslint",
  version: "0.1.0",
});

registerAuditHtml(server);
registerAuditFile(server);
registerAuditUrl(server);
registerDiffHtml(server);
registerListRules(server);

const transport = new StdioServerTransport();
await server.connect(transport);

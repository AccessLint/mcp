import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface StorybookEntry {
  id: string;
  title: string;
  name: string;
  type: string;
}

interface StorybookIndex {
  entries: Record<string, StorybookEntry>;
}

export const storybookStoriesSchema = {
  url: z
    .string()
    .url()
    .default("http://localhost:6006")
    .describe("Storybook base URL (default: http://localhost:6006)"),
  search: z
    .string()
    .optional()
    .describe("Filter stories by substring match on title or name"),
};

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function formatStories(baseUrl: string, entries: StorybookEntry[]): string {
  const grouped = new Map<string, StorybookEntry[]>();
  for (const entry of entries) {
    const group = grouped.get(entry.title) ?? [];
    group.push(entry);
    grouped.set(entry.title, group);
  }

  const lines: string[] = [];
  lines.push(`Found ${entries.length} stories:\n`);

  for (const [title, stories] of grouped) {
    lines.push(`### ${title}\n`);
    for (const story of stories) {
      const iframeUrl = `${baseUrl}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`;
      lines.push(`- **${story.name}** — \`${story.id}\``);
      lines.push(`  iframe: ${iframeUrl}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function registerStorybookStories(server: McpServer): void {
  server.tool(
    "storybook_stories",
    "List stories from a Storybook instance. Use this to discover component stories before auditing them.",
    storybookStoriesSchema,
    async ({ url, search }) => {
      const baseUrl = normalizeUrl(url);
      const indexUrl = `${baseUrl}/index.json`;

      let response: Response;
      try {
        response = await fetch(indexUrl);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown network error";
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Storybook index: ${message}`,
            },
          ],
          isError: true,
        };
      }

      if (!response.ok) {
        const hint =
          response.status === 404
            ? " (index.json requires Storybook 7+)"
            : "";
        return {
          content: [
            {
              type: "text",
              text: `Error fetching Storybook index: HTTP ${response.status} ${response.statusText}${hint}`,
            },
          ],
          isError: true,
        };
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        return {
          content: [
            {
              type: "text",
              text: "Error: Storybook index returned non-JSON response",
            },
          ],
          isError: true,
        };
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("entries" in data) ||
        typeof (data as StorybookIndex).entries !== "object"
      ) {
        return {
          content: [
            {
              type: "text",
              text: "Error: Storybook index is missing the 'entries' field",
            },
          ],
          isError: true,
        };
      }

      const allEntries = Object.values(
        (data as StorybookIndex).entries
      ).filter((e) => e.type === "story");

      let entries = allEntries;
      if (search) {
        const term = search.toLowerCase();
        entries = allEntries.filter(
          (e) =>
            e.title.toLowerCase().includes(term) ||
            e.name.toLowerCase().includes(term)
        );
      }

      if (entries.length === 0) {
        const suffix = search ? ` matching "${search}"` : "";
        return {
          content: [
            { type: "text", text: `No stories found${suffix}.` },
          ],
        };
      }

      return {
        content: [{ type: "text", text: formatStories(baseUrl, entries) }],
      };
    }
  );
}

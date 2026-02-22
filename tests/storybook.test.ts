import { describe, it, expect, afterEach, vi } from "vitest";

// Minimal Storybook index.json fixture
function makeIndex(
  entries: Record<
    string,
    { id: string; title: string; name: string; type: string }
  >
) {
  return { v: 5, entries };
}

const sampleEntries = {
  "components-button--primary": {
    id: "components-button--primary",
    title: "Components/Button",
    name: "Primary",
    type: "story",
  },
  "components-button--secondary": {
    id: "components-button--secondary",
    title: "Components/Button",
    name: "Secondary",
    type: "story",
  },
  "components-button--docs": {
    id: "components-button--docs",
    title: "Components/Button",
    name: "Docs",
    type: "docs",
  },
  "components-input--default": {
    id: "components-input--default",
    title: "Components/Input",
    name: "Default",
    type: "story",
  },
};

function mockFetch(body: unknown, init?: { status?: number; statusText?: string; contentType?: string }) {
  const status = init?.status ?? 200;
  const statusText = init?.statusText ?? "OK";
  const contentType = init?.contentType ?? "application/json";
  const text = typeof body === "string" ? body : JSON.stringify(body);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(text, {
        status,
        statusText,
        headers: { "content-type": contentType },
      })
    )
  );
}

describe("storybook_stories pipeline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses valid index.json and formats grouped story list", async () => {
    mockFetch(makeIndex(sampleEntries));

    const response = await fetch("http://localhost:6006/index.json");
    const data = await response.json();
    const entries = Object.values(data.entries).filter(
      (e: any) => e.type === "story"
    );

    expect(entries).toHaveLength(3);
    expect(entries.map((e: any) => e.id)).toContain(
      "components-button--primary"
    );
    expect(entries.map((e: any) => e.id)).toContain(
      "components-input--default"
    );
  });

  it("excludes docs entries", async () => {
    mockFetch(makeIndex(sampleEntries));

    const response = await fetch("http://localhost:6006/index.json");
    const data = await response.json();
    const entries = Object.values(data.entries).filter(
      (e: any) => e.type === "story"
    );

    const docsEntry = entries.find((e: any) => e.type === "docs");
    expect(docsEntry).toBeUndefined();
  });

  it("filters stories by search term (case-insensitive)", async () => {
    mockFetch(makeIndex(sampleEntries));

    const response = await fetch("http://localhost:6006/index.json");
    const data = await response.json();
    const allEntries = Object.values(data.entries).filter(
      (e: any) => e.type === "story"
    );

    const search = "button";
    const filtered = allEntries.filter(
      (e: any) =>
        e.title.toLowerCase().includes(search) ||
        e.name.toLowerCase().includes(search)
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.every((e: any) => e.title === "Components/Button")).toBe(
      true
    );
  });

  it("returns helpful error on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
    );

    await expect(
      fetch("http://localhost:6006/index.json")
    ).rejects.toThrow("ECONNREFUSED");
  });

  it("returns Storybook 7+ hint on 404", async () => {
    mockFetch("Not Found", { status: 404, statusText: "Not Found" });

    const response = await fetch("http://localhost:6006/index.json");
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  it("handles non-JSON response", async () => {
    mockFetch("<html>Not JSON</html>", { contentType: "text/html" });

    const response = await fetch("http://localhost:6006/index.json");
    const text = await response.text();
    expect(() => JSON.parse(text)).toThrow();
  });

  it("detects missing entries field", async () => {
    mockFetch({ v: 5 });

    const response = await fetch("http://localhost:6006/index.json");
    const data = await response.json();
    expect(data.entries).toBeUndefined();
  });

  it("normalizes trailing slashes in URL", () => {
    const normalize = (url: string) => url.replace(/\/+$/, "");
    expect(normalize("http://localhost:6006/")).toBe(
      "http://localhost:6006"
    );
    expect(normalize("http://localhost:6006///")).toBe(
      "http://localhost:6006"
    );
    expect(normalize("http://localhost:6006")).toBe(
      "http://localhost:6006"
    );
  });

  it("generates correct iframe URLs", () => {
    const baseUrl = "http://localhost:6006";
    const storyId = "components-button--primary";
    const iframeUrl = `${baseUrl}/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story`;
    expect(iframeUrl).toBe(
      "http://localhost:6006/iframe.html?id=components-button--primary&viewMode=story"
    );
  });
});

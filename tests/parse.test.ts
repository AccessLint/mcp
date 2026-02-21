import { describe, it, expect } from "vitest";
import { parseHtml } from "../src/lib/parse.js";

describe("parseHtml", () => {
  it("detects a fragment and wraps it", () => {
    const { document, isFragment } = parseHtml('<img src="photo.jpg">');
    expect(isFragment).toBe(true);
    expect(document.querySelector("img")).not.toBeNull();
    // Wrapper should have lang and title
    expect(document.documentElement.getAttribute("lang")).toBe("en");
    expect(document.title).toBe("Audit");
  });

  it("detects a full document", () => {
    const { document, isFragment } = parseHtml(
      '<!DOCTYPE html><html lang="en"><head><title>Test</title></head><body><p>Hello</p></body></html>'
    );
    expect(isFragment).toBe(false);
    expect(document.querySelector("p")?.textContent).toBe("Hello");
  });

  it("detects <html> tag without doctype as full document", () => {
    const { isFragment } = parseHtml(
      '<html><head></head><body><p>Test</p></body></html>'
    );
    expect(isFragment).toBe(false);
  });

  it("handles empty HTML as fragment", () => {
    const { document, isFragment } = parseHtml("");
    expect(isFragment).toBe(true);
    expect(document.documentElement).not.toBeNull();
  });

  it("handles complex fragments", () => {
    const { document, isFragment } = parseHtml(
      '<div><button>Click</button><a href="#">Link</a></div>'
    );
    expect(isFragment).toBe(true);
    expect(document.querySelector("button")?.textContent).toBe("Click");
    expect(document.querySelector("a")?.getAttribute("href")).toBe("#");
  });
});

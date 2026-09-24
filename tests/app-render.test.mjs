import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

test("home, lesson, map, display and about routes render without a browser or backend", async () => {
  globalThis.window = {
    location: { search: "" },
    matchMedia: () => ({ matches: false }),
  };
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    configurable: true,
  });
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const { default: App } = await vite.ssrLoadModule("/src/App.jsx");
    for (const [query, expected] of [
      ["", "Make the whole term"],
      ["?lesson=14", "The Zero Index"],
      ["?lesson=14&view=map", "Concept map"],
      ["?lesson=14&view=teach", "TEACH DISPLAY"],
      ["?about=1", "Built to make learning"],
    ]) {
      window.location.search = query;
      const html = renderToString(React.createElement(App));
      assert.ok(
        html.includes(expected),
        `route ${query || "/"} should render ${expected}`,
      );
    }
  } finally {
    await vite.close();
    delete globalThis.window;
  }
});

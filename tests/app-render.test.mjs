import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

test("four courses, review flags, maps, models and display render without a backend", async () => {
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
      ["", "Four courses, one connected library"],
      ["?lesson=14", "The Zero Index"], // legacy B7 Maths links still work
      ["?lesson=14&view=map", "Concept map"],
      ["?lesson=14&view=teach", "TEACH DISPLAY"],
      ["?course=b7-science-t1", "States of Matter"],
      ["?course=b7-science-t1&lesson=10", "Editorial review needed"],
      ["?course=b7-science-t1&lesson=20&view=map", "Mapping under review"],
      ["?course=b7-science-t1&lesson=24&view=teach", "Editorial review needed"],
      ["?course=b7-science-t1&lesson=11", "Follow a drop of water"],
      ["?course=b8-math-t1&lesson=20", "See a line change"],
      ["?course=b8-math-t1&lesson=23", "corrected B8 scheme assigns angles"],
      ["?course=b8-math-t1&lesson=24&view=map", "Editorial review needed"],
      ["?course=b8-science-t1&lesson=1", "Ungraded inquiry activity"],
      ["?course=b8-science-t1&lesson=26", "Water and Feed for Animal Growth"],
      ["?about=1", "Built to make learning"],
    ]) {
      window.location.search = query;
      const html = renderToString(React.createElement(App));
      assert.ok(
        html.includes(expected),
        `route ${query || "/"} should render ${expected}`,
      );
      assert.ok(
        !html.includes("markQuiz"),
        `route ${query} leaked a source example quiz`,
      );
      if (
        query.includes("science") &&
        query.includes("lesson=") &&
        !query.includes("view=map")
      ) {
        assert.ok(!html.includes("Connect the model to mathematical language"));
        assert.ok(
          html.includes("Connect the model to key terms for this subject"),
        );
      }
      if (query.includes("b7-science-t1&lesson=10")) {
        assert.ok(html.includes("This recap covers Earth"));
      }
    }
  } finally {
    await vite.close();
    delete globalThis.window;
  }
});

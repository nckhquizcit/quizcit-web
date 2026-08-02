import assert from "node:assert/strict";
import test from "node:test";

import { highlightCode } from "./syntaxHighlight.js";

test("highlights C code while preserving its exact text", async () => {
  const code = '#include <stdio.h>\nint main(void) {\n  printf("Hello World");\n}';
  const result = await highlightCode(code, "c");

  assert.equal(result.tokens.map((line) => line.map((token) => token.content).join("")).join("\n"), code);
  assert.ok(new Set(result.tokens.flat().map((token) => token.color)).size > 1);
});

test("leaves plain text and unknown languages unhighlighted", async () => {
  assert.equal(await highlightCode("hello", "text"), null);
  assert.equal(await highlightCode("hello", "not-a-language"), null);
});

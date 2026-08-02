import assert from "node:assert/strict";
import test from "node:test";

import { richTextSchema } from "./richTextSchema.js";

test("new code blocks default to C syntax highlighting", () => {
  assert.equal(richTextSchema.blockSchema.codeBlock.propSchema.language.default, "c");
});

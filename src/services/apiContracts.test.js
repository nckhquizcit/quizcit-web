import assert from "node:assert/strict";
import test from "node:test";
import {
  RBAC_ENDPOINTS,
  buildAiEstimatePayload,
  buildProfilePayload,
  getDeleteParams,
  mapAiEstimateResponse,
} from "./apiContracts.js";
import { mapUser } from "./mappers.js";

test("hard delete query is always a boolean", () => {
  assert.deepEqual(getDeleteParams(true), { hard: true });
  assert.deepEqual(getDeleteParams(false), { hard: false });
  assert.deepEqual(getDeleteParams(), { hard: false });
});

test("profile payload and user mapper preserve avatarUrl", () => {
  assert.deepEqual(
    buildProfilePayload({
      displayName: "Nguyen Van A",
      avatarUrl: "/api/uploads/avatars/avatar.webp",
    }),
    {
      displayName: "Nguyen Van A",
      avatarUrl: "/api/uploads/avatars/avatar.webp",
    },
  );
  assert.deepEqual(
    buildProfilePayload({
      displayName: "Nguyen Van A",
      avatarUrl: null,
    }),
    {
      displayName: "Nguyen Van A",
      avatarUrl: "",
    },
  );
  assert.deepEqual(
    buildProfilePayload({
      displayName: "Nguyen Van A",
    }),
    {
      displayName: "Nguyen Van A",
    },
  );
  assert.equal(mapUser({ avatar_url: "/avatar.webp" }).avatarUrl, "/avatar.webp");
});

test("RBAC paths match the routes exposed by the current backend", () => {
  assert.deepEqual(RBAC_ENDPOINTS, {
    roles: "/api/users/roles",
    permissions: "/api/users/permissions",
  });
});

test("AI estimate payload uses primary skill weights", () => {
  assert.deepEqual(
    buildAiEstimatePayload(
      [
        { questionId: "q1", correct: true },
        { questionId: "q2", correct: false },
      ],
      [
        {
          questionId: "q1",
          difficultyB: -0.5,
          skills: [{ weight: 0.4 }, { weight: 0.8, primary: true }],
        },
        { questionId: "q2", difficultyB: 1.2, skills: [] },
      ],
    ),
    {
      responses: [1, 0],
      difficulties: [-0.5, 1.2],
      weights: [0.8, 1],
    },
  );
});

test("AI estimate payload rejects incomplete question metadata", () => {
  assert.equal(buildAiEstimatePayload([{ questionId: "q3", correct: true }], []), null);
  assert.equal(buildAiEstimatePayload([], []), null);
});

test("AI estimate response supports both documented and current backend shapes", () => {
  assert.deepEqual(mapAiEstimateResponse({ theta: 0.68, standardError: 0.32 }), {
    theta: 0.68,
    thetaScaled: null,
    standardError: 0.32,
  });
  assert.deepEqual(mapAiEstimateResponse({ theta: 0.68, theta_scaled: 2.34 }), {
    theta: 0.68,
    thetaScaled: 2.34,
    standardError: null,
  });
});

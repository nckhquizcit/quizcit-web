import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatScaledThetaValue,
  getAbilityLevel,
  mapAbilityHistory,
  mapChapter,
  mapQuestion,
  mapSubject,
  mapUserSkillAbility,
  resolveImageUrl,
  scaleThetaForDisplay,
} from "./mappers.js";
import { toPreviewText } from "../components/richtext/richTextUtils.js";

describe("legacy rich-text question mapping", () => {
  it("recovers BlockNote JSON that an older backend marked as plain", () => {
    const content = JSON.stringify([
      {
        id: "legacy-code",
        type: "codeBlock",
        props: { language: "c" },
        content: [{ type: "text", text: "printf(\"Hello World\");", styles: {} }],
        children: [],
      },
      {
        id: "legacy-question",
        type: "paragraph",
        props: {},
        content: [{ type: "text", text: "Đoạn code trên in gì?", styles: {} }],
        children: [],
      },
    ]);

    const question = mapQuestion({ content, contentFormat: "plain" });

    assert.equal(question.contentFormat, "blocknote");
    assert.equal(toPreviewText(question.content, question.contentFormat), 'printf("Hello World"); Đoạn code trên in gì?');
  });

  it("keeps ordinary JSON questions as plain text", () => {
    const content = '[{"type":"example","content":"JSON hợp lệ"}]';

    assert.equal(mapQuestion({ content, contentFormat: "plain" }).contentFormat, "plain");
  });
});

describe("progress skill name mapping", () => {
  it("keeps skillName as display name for ability responses", () => {
    assert.equal(mapUserSkillAbility({ skillId: "skill-1", skillName: "Vòng lặp" }).name, "Vòng lặp");
  });

  it("keeps skillName as display name for history responses", () => {
    assert.equal(mapAbilityHistory({ skillId: "skill-1", skillName: "Vòng lặp" }).name, "Vòng lặp");
  });
});

describe("ability score display", () => {
  it("scales raw theta onto the 0-4 barem", () => {
    assert.equal(scaleThetaForDisplay(-4), 0);
    assert.equal(scaleThetaForDisplay(0), 2);
    assert.equal(scaleThetaForDisplay(4), 4);
    assert.equal(formatScaledThetaValue(0), "2.00");
  });

  it("classifies ability labels from raw theta thresholds", () => {
    assert.equal(getAbilityLevel(-2).label, "Yếu");
    assert.equal(getAbilityLevel(-1).label, "Trung bình");
    assert.equal(getAbilityLevel(0).label, "Trung bình khá");
    assert.equal(getAbilityLevel(1).label, "Khá");
    assert.equal(getAbilityLevel(2).label, "Giỏi");
    assert.equal(getAbilityLevel(2.5).label, "Xuất sắc");
  });
});

describe("subject mapping and image URL resolution", () => {
  it("maps imageUrl properly from camelCase or snake_case", () => {
    assert.equal(
      mapSubject({ subjectId: "s1", imageUrl: "/api/uploads/subjects/test.webp" }).imageUrl,
      "/api/uploads/subjects/test.webp"
    );
    assert.equal(
      mapSubject({ subject_id: "s2", image_url: "/api/uploads/subjects/test2.webp" }).imageUrl,
      "/api/uploads/subjects/test2.webp"
    );
  });

  it("resolves relative and absolute image URLs", () => {
    assert.equal(resolveImageUrl(""), "");
    assert.equal(resolveImageUrl(null), "");
    assert.equal(resolveImageUrl("https://cdn.example.com/img.jpg"), "https://cdn.example.com/img.jpg");
    assert.equal(resolveImageUrl("data:image/png;base64,..."), "data:image/png;base64,...");
    assert.ok(resolveImageUrl("/api/uploads/subjects/img.webp").includes("/api/uploads/subjects/img.webp"));
  });
});

describe("chapter mapping and unlock status", () => {
  it("preserves unlocked: true when chapter is unlocked", () => {
    const chapter = mapChapter({ chapterId: "c1", name: "Chương 1", unlocked: true });
    assert.equal(chapter.unlocked, true);
  });

  it("preserves unlocked: false when chapter is locked due to insufficient theta", () => {
    const chapter = mapChapter({ chapterId: "c2", name: "Chương 2", unlocked: false });
    assert.equal(chapter.unlocked, false);
  });

  it("handles isUnlocked backward compatibility", () => {
    const chapter = mapChapter({ chapter_id: "c3", name: "Chương 3", isUnlocked: false });
    assert.equal(chapter.unlocked, false);
  });

  it("defaults unlocked to true if omitted", () => {
    const chapter = mapChapter({ chapterId: "c4", name: "Chương 4" });
    assert.equal(chapter.unlocked, true);
  });

  it("maps skills with requiredTheta and currentTheta", () => {
    const chapter = mapChapter({
      chapterId: "c5",
      name: "Chương 5",
      skills: [
        { skillId: "s1", name: "Kỹ năng 1", requiredTheta: 0.5, currentTheta: 1.2 },
        { skillId: "s2", name: "Kỹ năng 2", required_theta: -0.5, current_theta: null },
        { skillId: "s3", name: "Kỹ năng 3" },
      ],
    });
    assert.equal(chapter.skills.length, 3);
    assert.equal(chapter.skills[0].requiredTheta, 0.5);
    assert.equal(chapter.skills[0].currentTheta, 1.2);
    assert.equal(chapter.skills[1].requiredTheta, -0.5);
    assert.equal(chapter.skills[1].currentTheta, null);
    assert.equal(chapter.skills[2].requiredTheta, 0);
    assert.equal(chapter.skills[2].currentTheta, null);
  });

  it("maps questionCount, theoryCount and chapterName aliases", () => {
    const chapter = mapChapter({
      chapterId: "c6",
      chapterName: "Chương 6",
      questionCount: 15,
      theoryCount: 3,
    });
    assert.equal(chapter.name, "Chương 6");
    assert.equal(chapter.questionCount, 15);
    assert.equal(chapter.theoryCount, 3);
  });
});


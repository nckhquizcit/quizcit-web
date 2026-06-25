# QuizCit API Contract Audit

This frontend pass normalizes backend responses through `src/services/mappers.js`.
Components should consume mapped domain objects instead of raw backend payloads.

## Confirmed Shapes

- `Subject`: `subjectId`, `courseCode`, `name`, `description`, `createdAt`.
- `Chapter`: `chapterId`, `subjectId`, `name`, `createdAt`.
- `Theory`: `theoryId`, `chapterId`, `content`, `createdAt`.
- `Question`: `questionId`, `subjectId`, `chapterId`, `content`, `explanation`, `difficultyB`, `options`, `correctOptionId`, `skills`.
- `Question.options`: array of objects with `optionId`, `content`, `corrected`.
- `Quiz`: `quizId`, `subjectId`, `chapterId`, `name`, `type`, `totalQuestion`, `duration`. The UI treats `duration` as minutes.
- `QuizResult` / `Attempt`: `attemptId`, `quizId`, `rawScore`, `totalQuestion`, `overallTheta`, `skillResults`.
- `SkillResult`: `skillId`, `theta`, `standardError`.
- `UserSkillAbility`: `id`, `userId`, `skillId`, `theta`, `standardError`, `updatedAt`.

## Known Mismatches

- Attempt history currently may not include `quizName`, `subjectName`, or `submittedAt`; the UI falls back to IDs/placeholders.
- Backend has no save/resume attempt API; quiz-taking uses `sessionStorage` as a frontend-only draft.
- USER self profile/password APIs appear admin-only in backend; USER profile is read-only in this frontend pass.
- Forgot/verify/reset password and update-email APIs are missing.
- List APIs do not expose server pagination/filter/sort.
- Admin stats API is missing; dashboard aggregates list APIs where feasible.

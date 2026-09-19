export function shuffleArray(array) {
  if (!Array.isArray(array)) return array;
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function shuffleQuestionsOptions(questions) {
  if (!Array.isArray(questions)) return questions;
  return questions.map(q => ({
    ...q,
    options: Array.isArray(q.options) ? shuffleArray(q.options) : q.options
  }));
}

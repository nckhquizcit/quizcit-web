import { codeBlockOptions } from "@blocknote/code-block";

const highlighterPromiseKey = Symbol.for("blocknote.shikiHighlighterPromise");

const getLanguageId = (value) => {
  const language = String(value ?? "").toLowerCase();
  return Object.entries(codeBlockOptions.supportedLanguages).find(
    ([id, config]) => id === language || config.aliases?.includes(language),
  )?.[0];
};

const getHighlighter = () => {
  globalThis[highlighterPromiseKey] ||= codeBlockOptions.createHighlighter();
  return globalThis[highlighterPromiseKey];
};

export async function highlightCode(code, language) {
  const languageId = getLanguageId(language);
  if (!languageId || languageId === "text") return null;

  const highlighter = await getHighlighter();
  if (!highlighter.getLoadedLanguages().includes(languageId)) {
    await highlighter.loadLanguage(languageId);
  }

  return highlighter.codeToTokens(String(code ?? ""), {
    lang: languageId,
    theme: "github-dark",
  });
}

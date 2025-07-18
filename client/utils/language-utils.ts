/**
 * Detects and returns the best matching language from a list of supported languages
 * based on the browser's language settings.
 * @param supportedLanguages - List of supported language codes (e.g., ['en', 'fr-FR'])
 * @param defaultLanguage - Fallback language if no match is found
 * @returns The matched language from supportedLanguages or the default
 */
function getPreferredLanguage(
  supportedLanguages: string[] = [],
  defaultLanguage: string = 'en'
): string {
  if (typeof navigator === 'undefined') return defaultLanguage;

  const normalize = (lang: string) => lang.toLowerCase().trim();
  const normalizedSupported = supportedLanguages.map(normalize);

  /**
   * Attempts to find a match in normalizedSupported given a browser-provided language.
   * Prioritizes exact match of both language and region (eg. 'en-GB'), falls back to base-language match (eg. 'en').
   */
  const findMatch = (inputLang: string): string | undefined => {
    const normalizedLang = normalize(inputLang);

    const exactMatchIndex = normalizedSupported.indexOf(normalizedLang);
    if (exactMatchIndex !== -1) return supportedLanguages[exactMatchIndex];

    const baseLanguage = normalizedLang.split('-')[0];
    const partialMatchIndex = normalizedSupported.findIndex(
      (lang) => lang === baseLanguage || lang.startsWith(`${baseLanguage}-`)
    );
    if (partialMatchIndex !== -1) return supportedLanguages[partialMatchIndex];

    // eslint-disable-next-line consistent-return
    return undefined;
  };

  // Try navigator.languages list first
  if (Array.isArray(navigator.languages)) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < navigator.languages.length; i++) {
      const match = findMatch(navigator.languages[i]);
      if (match) return match;
    }
  }

  // Fallback to navigator.language
  if (navigator.language) {
    const match = findMatch(navigator.language);
    if (match) return match;
  }

  return defaultLanguage;
}

export default getPreferredLanguage;

/**
 * Checks if the user's OS is macOS based on the user agent string.
 */
export const isMac = (): boolean =>
  navigator.userAgent.toLowerCase().includes('mac');

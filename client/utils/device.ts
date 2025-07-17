/**
 * Checks if the user's OS is macOS based on the user agent string.
 * This is the preferred method over navigator.platform, which is now deprecated:
 *   - see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform
 */
export function isMac(): boolean {
  if (!navigator || typeof navigator.userAgent !== 'string') {
    return false;
  }

  return navigator.userAgent.toLowerCase().includes('mac');
}

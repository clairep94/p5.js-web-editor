/**
 * Internal function to retrieve env vars, with no error handling.
 * @param key - The environment variable key to fetch.
 * @returns Value of env variable or undefined if not found.
 */
function _getConfig(key: string): string | undefined {
  const env: Record<string, string | undefined> =
    (typeof global !== 'undefined' ? global : window)?.process?.env || {};

  return env[key];
}

function isTestEnvironment(): boolean {
  return _getConfig('NODE_ENV') === 'test';
}

type GetConfigOptions = {
  warn?: boolean,
  returnEmptyIfMissing?: boolean
};

/**
 * Returns a string config value from environment variables.
 * Logs a warning if the value is missing and `warn` is not explicitly disabled.
 *
 * @param key - The environment variable key to fetch.
 * @param options - Optional settings:
 *   - `warn`: whether to warn if the value is missing (default true unless in test).
 *   - `returnEmptyIfMissing`: if true, returns '' instead of undefined when missing.
 *
 * @returns String value of the env var, or ''/undefined if missing.
 */
function getConfig(
  key: string,
  options: GetConfigOptions = {}
): string | undefined {
  if (!key) {
    throw new Error('"key" must be provided to getConfig()');
  }

  const { warn = !isTestEnvironment(), returnEmptyIfMissing = false } = options;

  const value = _getConfig(key);

  if (value == null) {
    if (warn) {
      console.warn(`getConfig("${key}") returned null or undefined`);
    }
    return returnEmptyIfMissing ? '' : undefined;
  }

  return value;
}

export default getConfig;

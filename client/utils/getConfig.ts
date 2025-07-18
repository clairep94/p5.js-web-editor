/**
 * Internal function to retrieve env vars, with no error handling.
 * @param key - The environment variable key to fetch.
 * @returns String value of env variable or undefined if not found.
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
  nullishString?: boolean,
  parseType?: 'number' | 'boolean' | 'string'
};

/**
 * Parses a string into a number. Returns undefined if parsing fails.
 */
function parseNumber(str: string): number | undefined {
  const num = Number(str);
  return Number.isNaN(num) ? undefined : num;
}

/**
 * Parses a string into a boolean. Returns undefined if not a valid boolean string.
 * Accepts 'true' or 'false' (case-insensitive).
 */
function parseBoolean(str: string): boolean | undefined {
  const lower = str.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  // eslint-disable-next-line consistent-return
  return undefined;
}

/**
 * Returns a string config value from environment variables.
 * Logs a warning if the value is missing and `warn` is not explicitly disabled.
 *
 * @param key - The environment variable key to fetch.
 * @param options - Optional settings:
 *   - `warn`: whether to warn if the value is missing (default true unless in test).
 *   - `nullishString`: if true, returns '' instead of undefined when missing.
 *   - `parseType`: parse the variable from string to a specified type.
 *
 * @returns String value of the env var, or ''/undefined if missing.
 */
function getConfig(
  key: string,
  options: GetConfigOptions = {}
): string | number | boolean | undefined {
  if (!key) {
    throw new Error('"key" must be provided to getConfig()');
  }

  const {
    warn = !isTestEnvironment(),
    nullishString = false,
    parseType = 'string'
  } = options;

  const value = _getConfig(key);

  if (value == null) {
    if (warn) {
      console.warn(`getConfig("${key}") returned null or undefined`);
    }
    return nullishString && parseType === 'string' ? '' : undefined;
  }

  switch (parseType) {
    case 'number':
      return parseNumber(value);
    case 'boolean':
      return parseBoolean(value);
    case 'string':
    default:
      return value;
  }
}

export default getConfig;

export function isTestEnvironment(): boolean {
  // eslint-disable-next-line no-use-before-define
  const env = getConfig('NODE_ENV', { warn: false });
  return env === 'test';
}

interface GetConfigOptions {
  warn?: boolean;
}

/**
 * Returns config item from environment
 */
function getConfig(key:string, options: GetConfigOptions = { warn: !isTestEnvironment() }):string | undefined {
  if (!key) {
    throw new Error('"key" must be provided to getConfig()');
  }

  const env =
    (typeof global !== 'undefined' ? global : window)?.process?.env || {};
  const value = env[key];

  if (value == null && options?.warn !== false) {
    console.warn(`getConfig("${key}") returned null`);
  }

  return value;
}

export default getConfig;

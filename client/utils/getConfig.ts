export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test';
}

interface GetConfigOptions {
  parseType?: 'string' | 'number' | 'boolean';
  nullishString?: boolean;
  warn?: boolean;
}

const defaultOptions: GetConfigOptions = {
  parseType: 'string',
  nullishString: false,
  warn: !isTestEnvironment()
};

/**
 * Returns config item from environment
 */
export default function getConfig(
  key: string,
  optionsOverrides: GetConfigOptions = {}
): string | number | boolean | undefined {
  if (!key) {
    throw new Error('"key" must be provided to getConfig()');
  }

  // set options for the output of getConfig
  const options = { ...defaultOptions, ...optionsOverrides };
  const { parseType, nullishString, warn } = options;

  const env =
    (typeof global !== 'undefined' ? global : window)?.process?.env || {};
  const value = env[key];

  // handle nullish values
  if (!value) {
    if (!warn) {
      console.warn(`getConfig("${key}") returned null`);
    }
    return nullishString ? '' : value;
  }

  // handle parsing desired return type
  switch (parseType) {
    case 'number': {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        if (!warn) {
          console.warn(
            `getConfig("${key}") expected a number but got: ${value}`
          );
        }
        return value;
      }
      return parsed;
    }
    case 'boolean': {
      const normalized = value.toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
      if (!warn) {
        console.warn(
          `getConfig("${key}") expected a boolean but got: ${value}`
        );
      }
      return value;
    }
    case 'string':
      return value;
    default:
      return value;
  }
}

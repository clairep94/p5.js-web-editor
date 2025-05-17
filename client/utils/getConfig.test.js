import getConfig from './getConfig.ts';

describe('utils/getConfig()', () => {
  beforeEach(() => {
    delete global.process.env.CONFIG_TEST_KEY_NAME;
    delete window.process.env.CONFIG_TEST_KEY_NAME;
  });

  // check for key
  it('throws if key is not defined', () => {
    expect(() => getConfig(/* key is missing */)).toThrow(/must be provided/);
  });

  it('throws if key is empty string', () => {
    expect(() => getConfig(/* key is empty string */ '')).toThrow(
      /must be provided/
    );
  });

  it('throws if key is null', () => {
    expect(() => getConfig(/* key is null */ null)).toThrow(/must be provided/);
  });

  // check returns happy path
  it('fetches from global.process', () => {
    global.process.env.CONFIG_TEST_KEY_NAME = 'editor.p5js.org';

    expect(getConfig('CONFIG_TEST_KEY_NAME')).toBe('editor.p5js.org');
  });

  it('fetches from window.process', () => {
    window.process.env.CONFIG_TEST_KEY_NAME = 'editor.p5js.org';

    expect(getConfig('CONFIG_TEST_KEY_NAME')).toBe('editor.p5js.org');
  });

  it('can parse numbers', () => {
    window.process.env.CONFIG_TEST_KEY_NAME = '12345';

    expect(getConfig('CONFIG_TEST_KEY_NAME')).toBe('12345');
    expect(getConfig('CONFIG_TEST_KEY_NAME', { parseType: 'number' })).toBe(
      12345
    ); // IDE>components>AssetSize.jsx eg. const limit = getConfig('UPLOAD_LIMIT', true) || 250000000;
  });
  it('can parse booleans', () => {
    window.process.env.CONFIG_TEST_KEY_NAME = 'TRUE';

    expect(getConfig('CONFIG_TEST_KEY_NAME')).toBe('TRUE');
    expect(getConfig('CONFIG_TEST_KEY_NAME', { parseType: 'boolean' })).toBe(
      true
    );
  });

  // check returns unhappy path
  it('warns but does not throw if no value found', () => {
    expect(() => getConfig('CONFIG_TEST_KEY_NAME')).not.toThrow();
  });

  it('returns the expected nullish value when no value is found', () => {
    const result = getConfig('CONFIG_TEST_KEY_NAME');
    expect(result).toBe(undefined);
    expect(!result).toBe(true);
    expect(`${result}`).toBe('undefined');
  });
  it('can be set to return an empty string as the nullish value', () => {
    const result = getConfig('CONFIG_TEST_KEY_NAME', { nullishString: true });
    expect(`${result}`).toBe(''); // eg.IDE>actions>uploader.js `https://s3-${getConfig('AWS_REGION')}.amazonaws.com/${getConfig('S3_BUCKET')}
  });
  it('can warns but does not throw if the wrong parseType is provided', () => {
    window.process.env.CONFIG_TEST_KEY_NAME = 'TRUE';
    expect(getConfig('CONFIG_TEST_KEY_NAME', { parseType: 'number' })).toBe(
      'TRUE'
    );
    expect(() =>
      getConfig('CONFIG_TEST_KEY_NAME', { parseType: 'number' })
    ).not.toThrow();
  });

  it('returns expected for parseing a boolean if the value does not exist', () => {
    const result = getConfig('CONFIG_TEST_KEY_NAME', { parseType: 'boolean' });
    expect(result).toBe(undefined);
    expect(!result).toBe(true);
  });
});

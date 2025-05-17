import getConfig, { isTestEnvironment } from './getConfig';

describe('utils/getConfig()', () => {
  beforeEach(() => {
    delete global.process.env.CONFIG_TEST_KEY_NAME;
    delete window.process.env.CONFIG_TEST_KEY_NAME;
  });

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

  it('fetches from global.process', () => {
    global.process.env.CONFIG_TEST_KEY_NAME = 'editor.p5js.org';

    expect(getConfig('CONFIG_TEST_KEY_NAME')).toBe('editor.p5js.org');
  });

  it('fetches from window.process', () => {
    window.process.env.CONFIG_TEST_KEY_NAME = 'editor.p5js.org';

    expect(getConfig('CONFIG_TEST_KEY_NAME')).toBe('editor.p5js.org');
  });

  it('warns but does not throw if no value found', () => {
    expect(() => getConfig('CONFIG_TEST_KEY_NAME')).not.toThrow();
  });
});

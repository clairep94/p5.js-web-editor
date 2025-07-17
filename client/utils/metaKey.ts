import { isMac } from './device';

const metaKey = isMac() ? 'Cmd' : 'Ctrl';

const metaKeyName = isMac() ? '⌘' : 'Ctrl';

export { metaKey, metaKeyName };

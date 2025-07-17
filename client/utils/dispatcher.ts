// Inspired by
// https://github.com/codesandbox/codesandbox-client/blob/master/packages/codesandbox-api/src/dispatcher/index.ts

/**
 * Codesandbox dispatcher message types
 */
export const MessageTypes = {
  START: 'START',
  STOP: 'STOP',
  FILES: 'FILES',
  SKETCH: 'SKETCH',
  REGISTER: 'REGISTER',
  EXECUTE: 'EXECUTE',
  // eslint-disable-next-line prettier/prettier
} as const;

/**
 * Codesandbox dispatcher message types
 */
export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];

/**
 * Codesandbox dispatcher message
 *   - type: 'START', 'STOP' etc
 *   - payload: additional data for that message type
 */
export type Message = {
  type: MessageType,
  payload?: any
};

const frames: {
  [key: number]: { frame: Window | null, origin: string }
} = {};
let frameIndex = 1;
let listener: ((message: Message) => void) | null = null;

/**
 * Registers a frame to receive future dispatched messages.
 * @param newFrame - The Window object of the frame to register.
 * @param newOrigin - The expected origin to use when posting messages to this frame.
 * @returns A cleanup function that unregisters the frame.
 */
export function registerFrame(
  newFrame: Window | null,
  newOrigin: string | null | undefined
): () => void {
  const frameId = frameIndex;
  frameIndex += 1;
  frames[frameId] = { frame: newFrame, origin: newOrigin ?? '' };
  return () => {
    delete frames[frameId];
  };
}

function notifyListener(message: Message): void {
  if (listener) listener(message);
}

function notifyFrames(message: Message) {
  const rawMessage = JSON.parse(JSON.stringify(message));

  Object.values(frames).forEach((frameObj) => {
    const { frame, origin } = frameObj;
    if (frame) {
      frame.postMessage(rawMessage, origin);
    }
  });
}

/**
 * Sends a message to all registered frames.
 * @param message - The message to dispatch.
 */
export function dispatchMessage(message: Message): void {
  if (!message) return;

  // maybe one day i will understand why in the codesandbox
  // code they leave notifyListeners in here?
  // notifyListener(message);
  notifyFrames(message);
}

/**
 * Register a listener callback for incoming `message`.
 * @param callback - A function to call whenever a message is received.
 * @returns A cleanup function to unregister the listener.
 */
export function listen(callback: (message: Message) => void): () => void {
  listener = callback;
  return () => {
    listener = null;
  };
}

function eventListener(e: MessageEvent): void {
  const { data } = e;

  // should also store origin of parent? idk
  // if (data && e.origin === origin) {
  if (data) {
    notifyListener(data as Message);
  }
}

window.addEventListener('message', eventListener);

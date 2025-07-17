// Inspired by
// https://github.com/codesandbox/codesandbox-client/blob/master/packages/codesandbox-api/src/dispatcher/index.ts

const frames: {
  [key: number]: { frame: Window | null, origin: string | null | undefined }
} = {};
let frameIndex = 1;
let listener = null;

export const MessageTypes = {
  START: 'START',
  STOP: 'STOP',
  FILES: 'FILES',
  SKETCH: 'SKETCH',
  REGISTER: 'REGISTER',
  EXECUTE: 'EXECUTE'
};

export function registerFrame(
  newFrame: Window | null,
  newOrigin: string | null | undefined
) {
  const frameId = frameIndex;
  frameIndex += 1;
  frames[frameId] = { frame: newFrame, origin: newOrigin };
  return () => {
    delete frames[frameId];
  };
}

function notifyListener(message) {
  if (listener) listener(message);
}

function notifyFrames(message: any) {
  const rawMessage = JSON.parse(JSON.stringify(message));

  Object.values(frames).forEach((frameObj) => {
    const { frame, origin } = frameObj;
    if (frame && frame.postMessage) {
      frame.postMessage(rawMessage, origin);
    }
  });
}

export function dispatchMessage(message) {
  if (!message) return;

  // maybe one day i will understand why in the codesandbox
  // code they leave notifyListeners in here?
  // notifyListener(message);
  notifyFrames(message);
}

/**
 * Call callback to remove listener
 */
export function listen(callback) {
  listener = callback;
  return () => {
    listener = null;
  };
}

function eventListener(e: MessageEvent) {
  const { data } = e;

  // should also store origin of parent? idk
  // if (data && e.origin === origin) {
  if (data) {
    notifyListener(data);
  }
}

window.addEventListener('message', eventListener);

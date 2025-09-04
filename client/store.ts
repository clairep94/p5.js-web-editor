import {
  configureStore as _configureStore,
  PreloadedState
} from '@reduxjs/toolkit';
import { listenerMiddleware } from './middleware';
import DevTools from './modules/App/components/DevTools';
import { rootReducer } from './reducers';
import { clearState, loadState } from './persistState';
import { getConfig } from './utils/getConfig';

// necessary to add redux devtool extension to Window interface
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: any;
  }
}

// Enable DevTools only when rendering on client and during development.
// Display the dock monitor only if no browser extension is found.
export function showReduxDevTools() {
  return (
    getConfig('CLIENT') &&
    getConfig('NODE_ENV') === 'development' &&
    // eslint-disable-next-line no-underscore-dangle
    !window.__REDUX_DEVTOOLS_EXTENSION__
  );
}

export function configureStore(
  initialState: PreloadedState<typeof rootReducer>
) {
  const savedState = loadState<typeof rootReducer>();
  clearState();

  const store = _configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: true,
        serializableCheck: false,
        // TODO: enable immutableCheck once the mutations are fixed.
        immutableCheck: false
      }).concat(listenerMiddleware.middleware),
    preloadedState: savedState || initialState,
    enhancers: showReduxDevTools() ? [DevTools.instrument()] : []
  });

  if ((module as any).hot) {
    // Enable Webpack hot module replacement for reducers
    (module as any).hot.accept('./reducers', () => {
      const nextRootReducer = require('./reducers').default; // eslint-disable-line global-require
      store.replaceReducer(nextRootReducer);
    });
  }

  return store;
}

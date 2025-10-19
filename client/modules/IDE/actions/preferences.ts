import i18next from 'i18next';
import { apiClient } from '../../../utils/apiClient';
import * as ActionTypes from '../../../constants';
import type {
  UpdatePreferencesRequestBody,
  UserPreferences,
  Error
} from '../../../../server/types';

export interface BaseAction {
  type: string;
}

export interface ActionWithValue extends BaseAction {
  value: string | number | boolean;
}

export interface ActionWithError extends BaseAction {
  error: Error['error'];
}

export interface ActionWithLanguage extends BaseAction {
  language: string;
}

export interface State {
  user: {
    authenticated: boolean;
  };
}

function updatePreferences(
  formParams: UpdatePreferencesRequestBody,
  dispatch: (
    action: ActionWithValue | ActionWithError | ActionWithLanguage
  ) => void
) {
  apiClient
    .put('/preferences', formParams)
    .then(() => {})
    .catch((error) => {
      dispatch({
        type: ActionTypes.ERROR,
        error: error?.response?.data
      });
    });
}

export function setPreferencesTab(value: number): ActionWithValue {
  return {
    type: ActionTypes.SET_PREFERENCES_TAB,
    value
  };
}

export function setFontSize(value: UserPreferences['fontSize']) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_FONT_SIZE,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          fontSize: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setLineNumbers(value: UserPreferences['lineNumbers']) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_LINE_NUMBERS,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          lineNumbers: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setAutocloseBracketsQuotes(
  value: UserPreferences['autocloseBracketsQuotes']
) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_AUTOCLOSE_BRACKETS_QUOTES,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          autocloseBracketsQuotes: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setAutocompleteHinter(
  value: UserPreferences['autocompleteHinter']
) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_AUTOCOMPLETE_HINTER,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          autocompleteHinter: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setAutosave(value: UserPreferences['autosave']) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_AUTOSAVE,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          autosave: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setLinewrap(value: UserPreferences['linewrap']) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_LINEWRAP,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          linewrap: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setLintWarning(value: UserPreferences['lintWarning']) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_LINT_WARNING,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          lintWarning: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setTextOutput(value: UserPreferences['textOutput']) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_TEXT_OUTPUT,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          textOutput: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setGridOutput(value: UserPreferences['gridOutput']) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_GRID_OUTPUT,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          gridOutput: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setTheme(value: UserPreferences['theme']) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_THEME,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          theme: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setAutorefresh(value: UserPreferences['autorefresh']) {
  return (
    dispatch: (action: ActionWithValue | ActionWithError) => {},
    getState: () => State
  ) => {
    dispatch({
      type: ActionTypes.SET_AUTOREFRESH,
      value
    });
    const state = getState();
    if (state.user.authenticated) {
      const formParams = {
        preferences: {
          autorefresh: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

export function setAllAccessibleOutput(
  value: UserPreferences['textOutput'] | UserPreferences['gridOutput']
) {
  return (dispatch) => {
    dispatch(setTextOutput(value));
    dispatch(setGridOutput(value));
  };
}

export function setLanguage(
  value: UserPreferences['language'],
  { persistPreference = true } = {}
) {
  return (
    dispatch: (action: ActionWithLanguage | ActionWithError) => {},
    getState: () => State
  ) => {
    i18next.changeLanguage(value);
    dispatch({
      type: ActionTypes.SET_LANGUAGE,
      language: value
    });
    const state = getState();
    if (persistPreference && state.user.authenticated) {
      const formParams = {
        preferences: {
          language: value
        }
      };
      updatePreferences(formParams, dispatch);
    }
  };
}

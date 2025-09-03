import i18next from 'i18next';
import { apiClient } from '../../../utils/apiClient';
import * as ActionTypes from '../../../constants';

// Not included in Preferences Form to post to BE
type IdePreferencesTabIndex = number;
type IdeAllAccessibleOutput = boolean;

// Included in Preferences Form to post to BE
type IdeFontSize = number;
type IdeLineNumber = boolean;
type IdeAutoCloseBracketQuotes = boolean;
type IdeAutoCompleteHinter = boolean;
type IdeAutoSave = boolean;
type IdeLineWrap = boolean;
type IdeLintWarning = boolean;
type IdeTextOutput = boolean;
type IdeGridOutput = boolean;
enum IdeTheme {
  LIGHT = 'light',
  DARK = 'dark',
  CONTRAST = 'contrast'
}
type IdeAutoRefresh = boolean;
type IdeLanguage = string;

export interface PreferencesFormParam {
  preferences: Partial<{
    fontSize: IdeFontSize;
    lineNumbers: IdeLineNumber;
    autocloseBracketsQuotes: IdeAutoCloseBracketQuotes;
    autocompleteHinter: IdeAutoCompleteHinter;
    autosave: IdeAutoSave;
    linewrap: IdeLineWrap;
    lintWarning: IdeLintWarning;
    textOutput: IdeTextOutput;
    gridOutput: IdeGridOutput;
    theme: IdeTheme;
    autorefresh: IdeAutoRefresh;
    language: IdeLanguage;
  }>;
}

function updatePreferences(formParams: PreferencesFormParam, dispatch) {
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

export function setPreferencesTab(value: IdePreferencesTabIndex) {
  return {
    type: ActionTypes.SET_PREFERENCES_TAB,
    value
  };
}

export function setFontSize(value: IdeFontSize) {
  return (dispatch, getState) => {
    // eslint-disable-line
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

export function setLineNumbers(value: IdeLineNumber) {
  return (dispatch, getState) => {
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

export function setAutocloseBracketsQuotes(value: IdeAutoCloseBracketQuotes) {
  return (dispatch, getState) => {
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

export function setAutocompleteHinter(value: IdeAutoCompleteHinter) {
  return (dispatch, getState) => {
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

export function setAutosave(value: IdeAutoSave) {
  return (dispatch, getState) => {
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

export function setLinewrap(value: IdeLineWrap) {
  return (dispatch, getState) => {
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

export function setLintWarning(value: IdeLintWarning) {
  return (dispatch, getState) => {
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

export function setTextOutput(value: IdeTextOutput) {
  return (dispatch, getState) => {
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

export function setGridOutput(value: IdeGridOutput) {
  return (dispatch, getState) => {
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

export function setTheme(value: IdeTheme) {
  return (dispatch, getState) => {
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

export function setAutorefresh(value: IdeAutoRefresh) {
  return (dispatch, getState) => {
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

export function setAllAccessibleOutput(value: IdeAllAccessibleOutput) {
  return (dispatch) => {
    dispatch(setTextOutput(value));
    dispatch(setGridOutput(value));
  };
}

export function setLanguage(
  value: IdeLanguage,
  { persistPreference = true } = {}
) {
  return (dispatch, getState) => {
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

import * as ActionTypes from '../../../constants';
import i18n from '../../../i18n';
import { UserPreferences, AppThemeOptions } from '../../../../server/types';

interface UserPreferencesClient
  extends Omit<UserPreferences, 'indentationAmount' | 'isTabIndent'> {
  tabIndex: number;
}

export const initialState: UserPreferencesClient = {
  tabIndex: 0,
  fontSize: 18,
  autosave: true,
  linewrap: true,
  lineNumbers: true,
  lintWarning: false,
  textOutput: false,
  gridOutput: false,
  theme: AppThemeOptions.LIGHT,
  autorefresh: false,
  language: i18n.language,
  autocloseBracketsQuotes: true,
  autocompleteHinter: false
};

const preferences = (
  state: UserPreferencesClient = initialState,
  action: {
    type: keyof ActionTypes;
    value?: any;
    preferences?: UserPreferencesClient;
    language?: UserPreferences['language'];
  }
) => {
  switch (action.type) {
    case ActionTypes.OPEN_PREFERENCES:
      return Object.assign({}, state, { tabIndex: 0 });
    case ActionTypes.SET_PREFERENCES_TAB:
      return Object.assign({}, state, { tabIndex: action.value });
    case ActionTypes.SET_FONT_SIZE:
      return Object.assign({}, state, { fontSize: action.value });
    case ActionTypes.SET_AUTOSAVE:
      return Object.assign({}, state, { autosave: action.value });
    case ActionTypes.SET_LINEWRAP:
      return Object.assign({}, state, { linewrap: action.value });
    case ActionTypes.SET_LINT_WARNING:
      return Object.assign({}, state, { lintWarning: action.value });
    case ActionTypes.SET_TEXT_OUTPUT:
      return Object.assign({}, state, { textOutput: action.value });
    case ActionTypes.SET_GRID_OUTPUT:
      return Object.assign({}, state, { gridOutput: action.value });
    case ActionTypes.SET_PREFERENCES:
      return action.preferences;
    case ActionTypes.SET_THEME:
      return Object.assign({}, state, { theme: action.value });
    case ActionTypes.SET_AUTOREFRESH:
      return Object.assign({}, state, { autorefresh: action.value });
    case ActionTypes.SET_LINE_NUMBERS:
      return Object.assign({}, state, { lineNumbers: action.value });
    case ActionTypes.SET_LANGUAGE:
      return Object.assign({}, state, { language: action.language });
    case ActionTypes.SET_AUTOCLOSE_BRACKETS_QUOTES:
      return Object.assign({}, state, {
        autocloseBracketsQuotes: action.value
      });
    case ActionTypes.SET_AUTOCOMPLETE_HINTER:
      return Object.assign({}, state, {
        autocompleteHinter: action.value
      });
    default:
      return state;
  }
};

export default preferences;

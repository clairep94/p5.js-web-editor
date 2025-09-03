/**
 * Saves and loads a snapshot of the Redux store
 * state to session storage
 */
const key = 'p5js-editor';
const storage: Storage = sessionStorage;

// Use a generic type for state so consumers can specify the shape
export const saveState = <T>(state: T): void => {
  try {
    storage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to persist state to storage:', error);
  }
};

// Returns the stored state or null if not found
export const loadState = <T>(): T | null => {
  try {
    const item = storage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn('Failed to retrieve initialize state from storage:', error);
    return null;
  }
};

export const clearState = (): void => {
  storage.removeItem(key);
};

import rootReducer, { RootState } from '../../../reducers';
import * as ActionTypes from '../../../constants';
import { selectIsSketchMeaningfullyEdited, selectCanAutosave } from './project';

// The files reducer is untyped JS, so RootState['files'] is `any`.
// This mirrors the shape of the nodes it creates (see reducers/files.js).
interface FileNode {
  id: string;
  _id: string;
  name: string;
  content: string;
  fileType: 'file' | 'folder';
  children: string[];
  filePath?: string;
  url?: string;
  isSelectedFile?: boolean;
}

type TestState = Omit<RootState, 'files'> & { files: FileNode[] };

interface StateOverrides {
  user?: RootState['user'];
  preferences?: Partial<RootState['preferences']>;
  ide?: Partial<RootState['ide']>;
}

// A fresh, untouched new sketch, built the same way File > New does it:
// RESET_PROJECT resets the project and files reducers to their initial state.
function createNewSketchState(overrides: StateOverrides = {}): TestState {
  const state = rootReducer(undefined, { type: ActionTypes.RESET_PROJECT });
  return {
    ...state,
    user: overrides.user ?? {
      authenticated: true,
      id: 'user-1',
      username: 'claire'
    },
    preferences: {
      ...state.preferences,
      autosave: true,
      ...overrides.preferences
    },
    ide: { ...state.ide, unsavedChanges: true, ...overrides.ide }
  };
}

function updateFile(
  state: TestState,
  name: string,
  changes: Partial<FileNode>
): TestState {
  return {
    ...state,
    files: state.files.map((f) => (f.name === name ? { ...f, ...changes } : f))
  };
}

function addFile(
  state: TestState,
  file: Partial<FileNode> & { name: string }
): TestState {
  const root = state.files.find((f) => f.name === 'root')!;
  const id = `new-${file.name}`;
  return {
    ...state,
    files: [
      ...state.files.map((f) =>
        f.id === root.id ? { ...f, children: [...f.children, id] } : f
      ),
      {
        id,
        _id: id,
        content: '',
        fileType: 'file',
        children: [],
        filePath: '',
        ...file
      }
    ]
  };
}

describe('selectIsSketchMeaningfullyEdited', () => {
  it('is false for an untouched new sketch', () => {
    expect(selectIsSketchMeaningfullyEdited(createNewSketchState())).toBe(
      false
    );
  });

  describe('editing default files', () => {
    it('is true when sketch.js differs from the default', () => {
      const state = updateFile(createNewSketchState(), 'sketch.js', {
        content: 'function setup() { createCanvas(100, 100); }'
      });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });

    it('is true when style.css differs from the default', () => {
      const state = updateFile(createNewSketchState(), 'style.css', {
        content: 'body { background: red; }'
      });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });

    it('is true when index.html differs from the default', () => {
      const state = updateFile(createNewSketchState(), 'index.html', {
        content: '<html><body>hi</body></html>'
      });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });

    it('is false when an edit is undone back to the default', () => {
      const fresh = createNewSketchState();
      const original = fresh.files.find((f) => f.name === 'sketch.js')!.content;
      const edited = updateFile(fresh, 'sketch.js', { content: 'x' });
      const undone = updateFile(edited, 'sketch.js', { content: original });
      expect(selectIsSketchMeaningfullyEdited(undone)).toBe(false);
    });

    it('ignores whitespace-only differences', () => {
      const fresh = createNewSketchState();
      const original = fresh.files.find((f) => f.name === 'sketch.js')!.content;
      const state = updateFile(fresh, 'sketch.js', {
        content: `${original}\n\n  `
      });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(false);
    });
  });

  describe('adding files', () => {
    it('is false for a blank file with a generic name', () => {
      const state = addFile(createNewSketchState(), { name: 'untitled.js' });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(false);
    });

    it('is true for a non-blank file even with a generic name', () => {
      const state = addFile(createNewSketchState(), {
        name: 'untitled.js',
        content: 'let x = 1;'
      });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });

    it('is true for a blank file with a non-generic name', () => {
      const state = addFile(createNewSketchState(), { name: 'player.js' });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });

    it.each(['untitled.js', 'Untitled2.js', 'file.js', 'new-file.txt'])(
      'treats "%s" as a generic file name',
      (name) => {
        const state = addFile(createNewSketchState(), { name });
        expect(selectIsSketchMeaningfullyEdited(state)).toBe(false);
      }
    );

    it('is false for a blank folder with a generic name', () => {
      const state = addFile(createNewSketchState(), {
        name: 'untitled',
        fileType: 'folder'
      });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(false);
    });

    it('is true for a folder with a non-generic name', () => {
      const state = addFile(createNewSketchState(), {
        name: 'assets',
        fileType: 'folder'
      });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });

    it('is true for an uploaded file (has a url, no content)', () => {
      const state = addFile(createNewSketchState(), {
        name: 'untitled.png',
        url: 'https://assets.example.com/untitled.png'
      });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });
  });

  describe('renaming and deleting', () => {
    it('is true when a default file is renamed', () => {
      const state = updateFile(createNewSketchState(), 'style.css', {
        name: 'main.css'
      });
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });

    it('is true when a default file is deleted', () => {
      const fresh = createNewSketchState();
      const css = fresh.files.find((f) => f.name === 'style.css')!;
      const state = {
        ...fresh,
        files: fresh.files
          .filter((f) => f.id !== css.id)
          .map((f) =>
            f.name === 'root'
              ? { ...f, children: f.children.filter((c) => c !== css.id) }
              : f
          )
      };
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });

    it('is true when the sketch is renamed from its generated name', () => {
      const fresh = createNewSketchState();
      const state = {
        ...fresh,
        project: { ...fresh.project, name: 'My Bouncing Ball' }
      };
      expect(selectIsSketchMeaningfullyEdited(state)).toBe(true);
    });
  });
});

describe('selectCanAutosave', () => {
  const edited = (overrides?: StateOverrides) =>
    updateFile(createNewSketchState(overrides), 'sketch.js', {
      content: 'edited'
    });

  describe('new (never saved) sketch', () => {
    it('is true when logged in, autosave on, and meaningfully edited', () => {
      expect(selectCanAutosave(edited())).toBe(true);
    });

    it('is false when not meaningfully edited', () => {
      expect(selectCanAutosave(createNewSketchState())).toBe(false);
    });

    it('is false when logged out', () => {
      expect(
        selectCanAutosave(edited({ user: { authenticated: false } }))
      ).toBe(false);
    });

    it('is false when the autosave preference is off', () => {
      expect(
        selectCanAutosave(edited({ preferences: { autosave: false } }))
      ).toBe(false);
    });

    it('is false when there are no unsaved changes', () => {
      expect(
        selectCanAutosave(edited({ ide: { unsavedChanges: false } }))
      ).toBe(false);
    });

    it('is false while a save is already in progress', () => {
      const state = edited();
      expect(
        selectCanAutosave({
          ...state,
          project: { ...state.project, isSaving: true }
        })
      ).toBe(false);
    });
  });

  describe('existing sketch', () => {
    const existing = (
      owner: { id: string; username: string },
      overrides?: Partial<RootState>
    ): RootState => {
      const state = createNewSketchState(overrides);
      return {
        ...state,
        project: { ...state.project, id: 'project-1', owner }
      };
    };

    it('is true for the owner with unsaved changes, even if not "meaningful"', () => {
      expect(
        selectCanAutosave(existing({ id: 'user-1', username: 'claire' }))
      ).toBe(true);
    });

    it('is false for a sketch owned by someone else', () => {
      expect(
        selectCanAutosave(existing({ id: 'user-2', username: 'someone' }))
      ).toBe(false);
    });

    it('is false for an unowned sketch view when logged out', () => {
      expect(
        selectCanAutosave(
          existing(
            { id: 'user-2', username: 'someone' },
            { user: { authenticated: false } }
          )
        )
      ).toBe(false);
    });
  });
});

import React from 'react';
import lodash from 'lodash';

import { reduxRender, screen } from '../../../../test-utils';
import rootReducer from '../../../../reducers';
import * as ActionTypes from '../../../../constants';
import AutosaveIndicator from './AutosaveIndicator';

const owner = { id: 'user-1', username: 'claire' };

// Start from a real new-sketch state (as File > New creates it), then apply
// overrides. reduxRender only shallow-merges, so pass complete slices.
const renderComponent = (overrides = {}) => {
  const base = rootReducer(undefined, { type: ActionTypes.RESET_PROJECT });
  const initialState = lodash.merge(
    {},
    base,
    {
      user: { authenticated: true, ...owner },
      preferences: { autosave: true },
      ide: { unsavedChanges: false }
    },
    overrides
  );
  return reduxRender(<AutosaveIndicator />, { initialState });
};

const savedSketch = (overrides = {}) =>
  lodash.merge(
    { project: { id: 'project-1', owner, updatedAt: '2026-10-03T12:00:00Z' } },
    overrides
  );

const editedSketchJs = (state) => ({
  ...state,
  files: state.files.map((f) =>
    f.name === 'sketch.js' ? { ...f, content: 'edited' } : f
  )
});

describe('<AutosaveIndicator />', () => {
  describe('saved sketch owned by the user', () => {
    it('shows "Saved" when there are no unsaved changes', () => {
      renderComponent(savedSketch());
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('shows "Unsaved changes" while waiting for the autosave timer', () => {
      renderComponent(savedSketch({ ide: { unsavedChanges: true } }));
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('shows "Saving…" while a save is in progress', () => {
      renderComponent(
        savedSketch({
          ide: { unsavedChanges: true },
          project: { isSaving: true }
        })
      );
      expect(screen.getByText('Saving…')).toBeInTheDocument();
    });

    it('renders nothing when the autosave preference is off', () => {
      const { container } = renderComponent(
        savedSketch({ preferences: { autosave: false } })
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('new sketch', () => {
    it('renders nothing before it is meaningfully edited', () => {
      const { container } = renderComponent({ ide: { unsavedChanges: true } });
      expect(container).toBeEmptyDOMElement();
    });

    it('shows "Unsaved changes" once meaningfully edited (will autosave)', () => {
      const base = rootReducer(undefined, { type: ActionTypes.RESET_PROJECT });
      renderComponent({
        files: editedSketchJs(base).files,
        ide: { unsavedChanges: true }
      });
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('renders nothing when logged out', () => {
      const base = rootReducer(undefined, { type: ActionTypes.RESET_PROJECT });
      const { container } = renderComponent({
        user: { authenticated: false, id: undefined, username: undefined },
        files: editedSketchJs(base).files,
        ide: { unsavedChanges: true }
      });
      expect(container).toBeEmptyDOMElement();
    });
  });

  it("renders nothing on someone else's sketch", () => {
    const { container } = renderComponent(
      savedSketch({ project: { owner: { id: 'user-2', username: 'other' } } })
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('announces status changes to screen readers', () => {
    renderComponent(savedSketch());
    expect(screen.getByText('Saved').closest('[aria-live]')).toHaveAttribute(
      'aria-live',
      'polite'
    );
  });
});

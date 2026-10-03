import { createSelector } from '@reduxjs/toolkit';
import {
  defaultSketch,
  defaultCSS,
  defaultHTML
} from '../../../../server/domain-objects/createDefaultFiles';
import { parseUrlParams } from '../../../utils/parseURLParams';
import { getIsUserOwner } from './users';

export const selectProjectOwner = (state) => state.project.owner;
export const selectProjectId = (state) => state.project.id;
export const selectProjectName = (state) => state.project.name;

export const selectSketchPath = createSelector(
  selectProjectOwner,
  selectProjectId,
  (owner, id) => (owner && id ? `/${owner.username}/sketches/${id}` : '/')
);

const selectFiles = (state) => state.files;
const selectGeneratedProjectName = (state) => state.project.generatedName;

// Names of files a user might create without intending to keep them,
// e.g. "untitled.js", "Untitled2.js", "file.js", "new-file.txt", "untitled".
const GENERIC_FILE_NAME = /^(untitled|file|new[-_ ]?file)\d*(\.\w+)?$/i;

function getDefaultFileContents() {
  return {
    'sketch.js': defaultSketch,
    'index.html': defaultHTML(parseUrlParams(window.location.href)),
    'style.css': defaultCSS
  };
}

const isBlank = (content) => !content || content.trim() === '';

/**
 * Whether a new sketch has been changed enough to be worth saving to the
 * user's account: default file contents changed, default files renamed or
 * deleted, non-trivial files added, or the sketch itself renamed.
 */
export const selectIsSketchMeaningfullyEdited = createSelector(
  selectFiles,
  selectProjectName,
  selectGeneratedProjectName,
  (files, name, generatedName) => {
    if (generatedName && name !== generatedName) return true;

    const defaults = getDefaultFileContents();
    const nonRootFiles = files.filter((file) => file.name !== 'root');

    const hasMissingDefault = Object.keys(defaults).some(
      (defaultName) => !nonRootFiles.some((file) => file.name === defaultName)
    );
    if (hasMissingDefault) return true;

    return nonRootFiles.some((file) => {
      if (file.name in defaults) {
        return (file.content || '').trim() !== defaults[file.name].trim();
      }
      if (file.url) return true;
      if (!isBlank(file.content)) return true;
      return !GENERIC_FILE_NAME.test(file.name);
    });
  }
);

/**
 * Whether the IDE should autosave right now. Existing sketches autosave for
 * their owner; new sketches autosave (creating the project) once a logged-in
 * user has meaningfully edited them.
 */
export const selectCanAutosave = (state) => {
  const { preferences, ide, project, user } = state;
  if (!preferences.autosave || !ide.unsavedChanges || project.isSaving) {
    return false;
  }
  if (project.id) return getIsUserOwner(state);
  return (
    user.authenticated &&
    !project.owner &&
    selectIsSketchMeaningfullyEdited(state)
  );
};

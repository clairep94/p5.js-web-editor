import files, { initialState } from './files';
import * as ActionTypes from '../../../constants';

describe('files reducer', () => {
  describe('DELETE_FILE action', () => {
    it('removes file from state and parent children array', () => {
      const state = initialState();
      const sketchFile = state.find((f) => f.name === 'sketch.js');
      const rootId = state.find((f) => f.name === 'root').id;

      const action = {
        type: ActionTypes.DELETE_FILE,
        id: sketchFile.id,
        parentId: rootId
      };

      const newState = files(state, action);

      // File should be removed from state
      expect(newState.find((f) => f.id === sketchFile.id)).toBeUndefined();
      expect(newState).toHaveLength(state.length - 1);

      // Parent's children array should be updated
      const root = newState.find((f) => f.id === rootId);
      expect(root.children).not.toContain(sketchFile.id);
      expect(root.children).toHaveLength(2); // Originally 3 children
    });

    it('recursively deletes all descendants when deleting folder', () => {
      // Setup: Create folder with nested file
      let state = initialState();
      const rootId = state.find((f) => f.name === 'root').id;

      state = files(state, {
        type: ActionTypes.CREATE_FILE,
        id: 'folder1',
        _id: 'folder1',
        name: 'components',
        content: '',
        children: [],
        fileType: 'folder',
        parentId: rootId
      });

      state = files(state, {
        type: ActionTypes.CREATE_FILE,
        id: 'child1',
        _id: 'child1',
        name: 'Button.jsx',
        content: '',
        children: [],
        parentId: 'folder1'
      });

      const lengthBefore = state.length;

      // Act: Delete folder
      const action = {
        type: ActionTypes.DELETE_FILE,
        id: 'folder1',
        parentId: rootId
      };

      const newState = files(state, action);

      // Assert: Both folder and child should be deleted
      expect(newState.find((f) => f.id === 'folder1')).toBeUndefined();
      expect(newState.find((f) => f.id === 'child1')).toBeUndefined();
      expect(newState).toHaveLength(lengthBefore - 2);

      // Assert: Parent cleanup
      const root = newState.find((f) => f.id === rootId);
      expect(root.children).not.toContain('folder1');
    });

    it('handles deeply nested folder hierarchies', () => {
      // Setup: root > folder1 > folder2 > deepFile
      let state = initialState();
      const rootId = state.find((f) => f.name === 'root').id;

      state = files(state, {
        type: ActionTypes.CREATE_FILE,
        id: 'folder1',
        _id: 'folder1',
        name: 'src',
        content: '',
        children: [],
        fileType: 'folder',
        parentId: rootId
      });

      state = files(state, {
        type: ActionTypes.CREATE_FILE,
        id: 'folder2',
        _id: 'folder2',
        name: 'utils',
        content: '',
        children: [],
        fileType: 'folder',
        parentId: 'folder1'
      });

      state = files(state, {
        type: ActionTypes.CREATE_FILE,
        id: 'deepFile',
        _id: 'deepFile',
        name: 'helper.js',
        content: '',
        children: [],
        parentId: 'folder2'
      });

      const lengthBefore = state.length;

      // Act: Delete folder1 (should cascade to folder2 and deepFile)
      const action = {
        type: ActionTypes.DELETE_FILE,
        id: 'folder1',
        parentId: rootId
      };

      const newState = files(state, action);

      // Assert: All three items deleted
      expect(newState.find((f) => f.id === 'folder1')).toBeUndefined();
      expect(newState.find((f) => f.id === 'folder2')).toBeUndefined();
      expect(newState.find((f) => f.id === 'deepFile')).toBeUndefined();
      expect(newState).toHaveLength(lengthBefore - 3);
    });

    it('handles empty folder deletion', () => {
      let state = initialState();
      const rootId = state.find((f) => f.name === 'root').id;

      // Create empty folder
      state = files(state, {
        type: ActionTypes.CREATE_FILE,
        id: 'emptyFolder',
        _id: 'emptyFolder',
        name: 'docs',
        content: '',
        children: [],
        fileType: 'folder',
        parentId: rootId
      });

      const action = {
        type: ActionTypes.DELETE_FILE,
        id: 'emptyFolder',
        parentId: rootId
      };

      const newState = files(state, action);

      // Folder should be removed
      expect(newState.find((f) => f.id === 'emptyFolder')).toBeUndefined();

      // Parent should be updated
      const root = newState.find((f) => f.id === rootId);
      expect(root.children).not.toContain('emptyFolder');
    });

    it('does not affect sibling files when deleting', () => {
      const state = initialState();
      const sketchFile = state.find((f) => f.name === 'sketch.js');
      const htmlFile = state.find((f) => f.name === 'index.html');
      const cssFile = state.find((f) => f.name === 'style.css');
      const rootId = state.find((f) => f.name === 'root').id;

      const action = {
        type: ActionTypes.DELETE_FILE,
        id: sketchFile.id,
        parentId: rootId
      };

      const newState = files(state, action);

      // Siblings should still exist with unchanged content
      const htmlInNewState = newState.find((f) => f.id === htmlFile.id);
      const cssInNewState = newState.find((f) => f.id === cssFile.id);

      expect(htmlInNewState).toBeDefined();
      expect(cssInNewState).toBeDefined();
      expect(htmlInNewState.content).toBe(htmlFile.content);
      expect(htmlInNewState.name).toBe('index.html');
    });

    it('maintains state consistency after folder with multiple children deleted', () => {
      let state = initialState();
      const rootId = state.find((f) => f.name === 'root').id;

      // Create folder with multiple children
      state = files(state, {
        type: ActionTypes.CREATE_FILE,
        id: 'components',
        _id: 'components',
        name: 'components',
        content: '',
        children: [],
        fileType: 'folder',
        parentId: rootId
      });

      state = files(state, {
        type: ActionTypes.CREATE_FILE,
        id: 'button',
        _id: 'button',
        name: 'Button.jsx',
        content: '',
        children: [],
        parentId: 'components'
      });

      state = files(state, {
        type: ActionTypes.CREATE_FILE,
        id: 'input',
        _id: 'input',
        name: 'Input.jsx',
        content: '',
        children: [],
        parentId: 'components'
      });

      const lengthBefore = state.length;

      // Delete folder
      const action = {
        type: ActionTypes.DELETE_FILE,
        id: 'components',
        parentId: rootId
      };

      const newState = files(state, action);

      // All three files should be gone
      expect(newState).toHaveLength(lengthBefore - 3);

      // No orphaned files (all remaining files should be reachable from root)
      const referencedIds = new Set();
      newState.forEach((file) => {
        if (file.fileType === 'folder') {
          file.children.forEach((childId) => referencedIds.add(childId));
        }
      });

      const nonRootFiles = newState.filter((f) => f.name !== 'root');
      nonRootFiles.forEach((file) => {
        expect(referencedIds.has(file.id)).toBe(true);
      });
    });
  });
});

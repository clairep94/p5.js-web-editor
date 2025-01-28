import { createSelector } from '@reduxjs/toolkit';
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';
import { orderBy } from 'lodash';
import { DIRECTION } from '../actions/sorting';

const getSketches = (state) => state.sketches;
const getField = (state) => state.sorting.field;
const getDirection = (state) => state.sorting.direction;
const getSearchTerm = (state) => state.search.sketchSearchTerm;

const getFilteredSketches = createSelector(
  getSketches,
  getSearchTerm,
  (sketches, search) => {
    if (search) {
      const searchStrings = sketches?.projects.map((sketch) => {
        const smallSketch = {
          name: sketch.name
        };
        return {
          ...sketch,
          searchString: Object.values(smallSketch).join(' ').toLowerCase()
        };
      });
      return searchStrings.filter((sketch) =>
        sketch.searchString.includes(search.toLowerCase())
      );
    }
    return sketches;
  }
);

export const getSortedSketches = createSelector(
  getFilteredSketches,
  getField,
  getDirection,
  (sketches, field, direction) => {
    if (!sketches?.projects) {
      return [];
    }

    if (field === 'name') {
      if (direction === DIRECTION.DESC) {
        return orderBy(sketches.projects, 'name', 'desc');
      }
      return orderBy(sketches.projects, 'name', 'asc');
    }

    const sortedSketches = [...sketches.projects].sort((a, b) => {
      const result =
        direction === DIRECTION.ASC
          ? differenceInMilliseconds(new Date(a[field]), new Date(b[field]))
          : differenceInMilliseconds(new Date(b[field]), new Date(a[field]));
      return result;
    });

    return sketches.metadata?.hasPagination
      ? { sketches: sortedSketches, metadata: sketches.metadata }
      : sortedSketches;
  }
);

export default getSortedSketches;

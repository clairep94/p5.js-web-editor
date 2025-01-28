import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  sketchesPerPage,
  totalSketches
}) => {
  if (totalPages <= 1) return null;

  const startSketch = (currentPage - 1) * sketchesPerPage + 1;
  const endSketch = Math.min(currentPage * sketchesPerPage, totalSketches);

  return (
    <div className="pagination">
      <ul className="pagination-ul">
        <li className="page-item">
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous Page"
          >
            Prev
          </button>
        </li>

        <li className="pagination-info">
          <span>
            <span className="bold-text">
              {startSketch} - {endSketch}
            </span>{' '}
            of {totalSketches}
          </span>
        </li>

        <li
          className={classNames('page-item', {
            disabled: currentPage === totalPages
          })}
        >
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
          >
            Next
          </button>
        </li>
      </ul>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  sketchesPerPage: PropTypes.number.isRequired,
  totalSketches: PropTypes.number.isRequired
};

export default Pagination;

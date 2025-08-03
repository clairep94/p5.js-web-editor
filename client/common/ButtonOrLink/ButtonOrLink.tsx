import React from 'react';
import { Link } from 'react-router-dom';
import type { ButtonOrLinkProps, Ref } from './ButtonOrLink.types';

/**
 * Helper for switching between `<button>`, `<a>`, and `<Link>`
 * If providing an `href`, will render as a link instead of a button.
 *   - Internal links will use react-router.
 *   - External links should start with 'http' or 'https' and will open in a new window.
 */
const ButtonOrLink = React.forwardRef<Ref, ButtonOrLinkProps>(
  ({ href, children, isDisabled = false, onClick, ...props }, ref) => {
    const handleClick = (
      e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
    ) => {
      if (isDisabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (onClick) {
        onClick(e);
      }
    };

    if (href) {
      if (href.startsWith('http')) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={isDisabled}
            {...props}
            onClick={handleClick}
          >
            {children}
          </a>
        );
      }
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={href}
          aria-disabled={isDisabled}
          {...props}
          onClick={handleClick}
        >
          {children}
        </Link>
      );
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        aria-disabled={isDisabled}
        {...props}
        onClick={handleClick}
      >
        {children}
      </button>
    );
  }
);

export default ButtonOrLink;

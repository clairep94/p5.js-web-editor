import React from 'react';
import { Link } from 'react-router-dom';


/**
 * Accepts all the props of an HTML <a> or <button> tag.
 */
type ButtonOrLinkProps = {
  /**
   * If providing an href, will render as a link instead of a button.
   * Can be internal or external.
   * Internal links will use react-router.
   * External links should start with 'http' or 'https' and will open in a new window.
   */
  href?: string,
  isDisabled?: boolean,
  /**
   * Content of the button/link.
   * Can be either a string or a complex element.
   */
  children: React.ReactNode,
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
};

type Ref = HTMLAnchorElement | HTMLButtonElement

/**
 * Helper for switching between <button>, <a>, and <Link>
 */
const ButtonOrLink = React.forwardRef(
  (
    { href, children, isDisabled = false, onClick, ...props }: ButtonOrLinkProps, 
    ref: React.Ref<Ref>
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
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
            // eslint-disable-next-line prettier/prettier -- not able to parse 'as' for some reason
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

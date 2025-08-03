import React from 'react';

/**
 * Accepts all the props of an HTML <a> or <button> tag.
 */
export type ButtonOrLinkProps = {
  /**
   * Can be internal or external ('http'- or 'https'-).
   */
  href?: string;
  isDisabled?: boolean;
  /**
   * Content of the button/link.
   * Can be either a string or a complex element.
   */
  children: React.ReactNode;
  onClick?: (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => void;
};

export type Ref = HTMLAnchorElement | HTMLButtonElement;

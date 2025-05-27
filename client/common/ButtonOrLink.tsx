import React, {
  ReactNode,
  ButtonHTMLAttributes,
  AnchorHTMLAttributes
} from 'react';
import { Link } from 'react-router-dom';

/**
 * Props for ButtonOrLink component.
 *
 * @property {string} [href] - If provided, renders as a link instead of a button.
 *   - External links (starting with 'http') render as `<a>` and open in a new tab.
 *   - Internal links render using react-router's `<Link>`.
 * @property {ReactNode} children - The content inside the button or link.
 *   Can be plain text or a React element.
 */
type ButtonOrLinkProps = {
  href?: string | undefined,
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'href'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

/**
 * Helper for switching between a `<button>`, `<a>`, or `<Link>` based on the `href` value.
 *
 * - Renders a `<button>` by default.
 * - If `href` is provided:
 *   - If it starts with 'http', renders an external `<a>` link.
 *   - Otherwise, renders an internal `<Link>` from react-router.
 */
const ButtonOrLink: React.FC<ButtonOrLinkProps> = ({
  href = undefined,
  children,
  ...props
}) => {
  if (href) {
    if (href.startsWith('http')) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    );
  }
  return <button {...props}>{children}</button>;
};

export default ButtonOrLink;

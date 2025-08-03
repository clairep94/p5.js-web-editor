import React from 'react';
import { Link } from 'react-router-dom';
import { StyledButton, StyledInlineButton } from './Button.styles';
import { ButtonProps, kinds, displays, buttonTypes } from './Button.types';

/**
 * A Button performs a primary action
 */
const Button = ({
  children = null,
  display = displays.block,
  href,
  kind = kinds.primary,
  iconBefore = null,
  iconAfter = null,
  iconOnly = false,
  'aria-label': ariaLabel,
  to,
  type = buttonTypes.button,
  ...props
}: ButtonProps) => {
  const hasChildren = React.Children.count(children) > 0;
  const content = (
    <>
      {iconBefore}
      {hasChildren && !iconOnly && <span>{children}</span>}
      {iconAfter}
    </>
  );
  const StyledComponent: React.ElementType = iconOnly
    ? StyledInlineButton
    : StyledButton;

  if (href) {
    return (
      <StyledComponent
        kind={kind}
        display={display}
        as="a"
        aria-label={ariaLabel}
        href={href}
        {...props}
      >
        {content}
      </StyledComponent>
    );
  }

  if (to) {
    return (
      <StyledComponent
        kind={kind}
        display={display}
        as={Link}
        aria-label={ariaLabel}
        to={to}
        {...props}
      >
        {content}
      </StyledComponent>
    );
  }

  return (
    <StyledComponent
      kind={kind}
      display={display}
      aria-label={ariaLabel}
      type={type}
      {...props}
    >
      {content}
    </StyledComponent>
  );
};

Button.kinds = kinds;
Button.displays = displays;

export default Button;

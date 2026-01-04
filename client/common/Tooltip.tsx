import React, { ReactElement, useRef, useState } from 'react';

export type TooltipDirection = 'n' | 's' | 'e' | 'w';

export type TooltipProps = {
  content: string;
  direction?: TooltipDirection;
  noDelay?: boolean;
  children: ReactElement;
};

export function Tooltip({
  content,
  direction = 'n',
  noDelay = false,
  children
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipIdRef = useRef(`tooltip-${Math.random().toString(36).slice(2)}`);

  const childProps: Record<string, unknown> = {
    'aria-label': content,
    className: [
      (children.props && children.props.className) || '',
      'tooltipped',
      `tooltipped-${direction}`,
      noDelay ? 'tooltipped-no-delay' : ''
    ]
      .filter(Boolean)
      .join(' '),
    'aria-describedby': tooltipIdRef.current,
    onFocus: (e: React.FocusEvent) => {
      setOpen(true);
      if (children.props && typeof children.props.onFocus === 'function') {
        children.props.onFocus(e);
      }
    },
    onBlur: (e: React.FocusEvent) => {
      setOpen(false);
      if (children.props && typeof children.props.onBlur === 'function') {
        children.props.onBlur(e);
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      setOpen(true);
      if (children.props && typeof children.props.onMouseEnter === 'function') {
        children.props.onMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      setOpen(false);
      if (children.props && typeof children.props.onMouseLeave === 'function') {
        children.props.onMouseLeave(e);
      }
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        (e.target as HTMLElement)?.blur();
      }
      if (children.props && typeof children.props.onKeyDown === 'function') {
        children.props.onKeyDown(e);
      }
    }
  };

  const trigger = React.cloneElement(children, childProps);

  return (
    <span className="tooltip-wrapper">
      {trigger}
      {open && (
        <span id={tooltipIdRef.current} role="tooltip" className="sr-only">
          {content}
        </span>
      )}
    </span>
  );
}

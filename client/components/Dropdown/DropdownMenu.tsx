import React, { forwardRef, useCallback, useRef, useState } from 'react';
import useModalClose from '../../common/useModalClose';
import DownArrowIcon from '../../images/down-filled-triangle.svg';
import { DropdownWrapper } from './DropdownWrapper';
import type { DropdownWrapperProps } from './DropdownWrapper';

type DropdownMenuProps = DropdownWrapperProps & {
  /**
   * Provide <MenuItem> elements as children to control the contents of the menu.
   */
  children: React.ReactNode;
  /**
   * Can optionally override the contents of the button which opens the menu.
   * Defaults to <DownArrowIcon>
   */
  anchor?: React.ReactNode;
  'aria-label'?: string;
  className?: string;
  classes?: {
    button?: string;
    list?: string;
  };
  maxHeight?: string;
};

const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  (
    {
      children,
      anchor,
      'aria-label': ariaLabel,
      align = 'right',
      className = '',
      classes = {},
      maxHeight
    },
    ref
  ) => {
    // Note: need to use a ref instead of a state to avoid stale closures.
    const focusedRef = useRef(false);

    const [isOpen, setIsOpen] = useState(false);

    const close = useCallback(() => setIsOpen(false), [setIsOpen]);

    const anchorRef = useModalClose(close, ref);

    const toggle = useCallback(() => {
      setIsOpen((prevState) => !prevState);
    }, [setIsOpen]);

    const handleFocus = () => {
      focusedRef.current = true;
    };

    const handleBlur = () => {
      focusedRef.current = false;
      setTimeout(() => {
        if (!focusedRef.current) {
          // close();
        }
      }, 200);
    };

    return (
      <div ref={anchorRef} className={className} aria-haspopup="menu">
        <button
          className={classes.button}
          aria-label={ariaLabel}
          tabIndex={0}
          onClick={toggle}
          onBlur={handleBlur}
          onFocus={handleFocus}
        >
          {anchor ?? <DownArrowIcon focusable="false" aria-hidden="true" />}
        </button>
        {isOpen && (
          <DropdownWrapper
            role="menu"
            className={classes.list}
            align={align}
            onMouseUp={() => {
              setTimeout(close, 0);
            }}
            onBlur={handleBlur}
            onFocus={handleFocus}
            style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
          >
            {children}
          </DropdownWrapper>
        )}
      </div>
    );
  }
);

export default DropdownMenu;

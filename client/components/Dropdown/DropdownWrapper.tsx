import styled from 'styled-components';
import { remSize, prop } from '../../theme';

export type DropdownWrapperProps = {
  align?: 'left' | 'right';
};

export const DropdownWrapper = styled.ul<DropdownWrapperProps>`
  background-color: ${prop('Modal.background')};
  border: 1px solid ${prop('Modal.border')};
  box-shadow: 0 0 18px 0 ${prop('shadowColor')};
  color: ${prop('primaryTextColor')};

  position: absolute;
  ${(props) => props.align === 'right' && 'right: 0;'}
  ${(props) => props.align === 'left' && 'left: 0;'}
  ${(props) => !props.align && 'left: 0;'}

  text-align: left;
  width: ${remSize(180)};
  display: flex;
  flex-direction: column;
  height: auto;
  z-index: 2;
  border-radius: ${remSize(6)};

  & li:first-child {
    border-radius: ${remSize(5)} ${remSize(5)} 0 0;
  }
  & li:last-child {
    border-radius: 0 0 ${remSize(5)} ${remSize(5)};
  }

  & li:hover {
    background-color: ${prop('Button.primary.hover.background')};
    color: ${prop('Button.primary.hover.foreground')};

    * {
      color: ${prop('Button.primary.hover.foreground')};
    }
  }

  li {
    height: ${remSize(36)};
    cursor: pointer;
    display: flex;
    align-items: center;

    & button,
    & button span,
    & a {
      padding: ${remSize(8)} ${remSize(16)};
      font-size: ${remSize(12)};
    }

    * {
      text-align: left;
      justify-content: left;

      color: ${prop('primaryTextColor')};
      width: 100%;
      justify-content: flex-start;
    }

    & button span {
      padding: 0px;
    }
  }
`;

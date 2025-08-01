import React, { ComponentType } from 'react';
import styled from 'styled-components';
import Button from './Button';
import { remSize } from '../theme';

const ButtonWrapper = styled(Button)`
  width: ${remSize(48)};
  > svg {
    width: 100%;
    height: 100%;
  }
`;

type IconProps = {
  'aria-label'?: string
};

type IconButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'iconBefore' | 'iconOnly' | 'display' | 'focusable'
> & {
  icon?: ComponentType<IconProps> | null
};

const IconButton = ({ icon: Icon, ...otherProps }: IconButtonProps) => (
  <ButtonWrapper
    iconBefore={Icon ? <Icon /> : undefined}
    iconOnly
    display={Button.displays.inline}
    focusable="false"
    {...otherProps}
  />
);

export default IconButton;

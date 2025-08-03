import React from 'react';
import Button from '../Button';
import { ButtonWrapper } from './IconButton.styles';
import { IconButtonProps } from './IconButton.types';

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

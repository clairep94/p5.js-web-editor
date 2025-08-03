import { ComponentType } from 'react';
import { ButtonProps } from '../Button';

export type IconButtonProps = Omit<
  ButtonProps,
  'iconBefore' | 'display' | 'focusable'
> & {
  icon?: ComponentType<{ 'aria-label'?: string }> | null;
};

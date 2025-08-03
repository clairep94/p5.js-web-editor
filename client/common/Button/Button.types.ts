import React from 'react';
import { LinkProps } from 'react-router-dom';

export const kinds = {
  primary: 'primary',
  secondary: 'secondary'
} as const;

export const displays = {
  block: 'block',
  inline: 'inline'
} as const;

export const buttonTypes = {
  button: 'button',
  submit: 'submit'
} as const;

export type Kind = keyof typeof kinds;
export type Display = keyof typeof displays;
export type ButtonType = keyof typeof buttonTypes;

export type StyledButtonProps = {
  kind: Kind;
  display: Display;
};

type SharedButtonProps = {
  children?: React.ReactNode;
  disabled?: boolean;
  display?: Display;
  iconAfter?: React.ReactNode;
  iconBefore?: React.ReactNode;
  iconOnly?: boolean;
  kind?: Kind;
  href?: string | null;
  'aria-label'?: string | null;
  to?: string | null;
  type?: ButtonType;
  focusable?: boolean | 'true' | 'false';
};

export type ButtonProps = SharedButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> &
  Partial<LinkProps>;

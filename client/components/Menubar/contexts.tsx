import React, { createContext } from 'react';

export const ParentMenuContext = createContext<string>('none');

export const MenuOpenContext = createContext<string>('none');

interface MenubarContextType {
  createMenuHandlers: (id: string) => Record<string, any>;
  createMenuItemHandlers: (id: string) => Record<string, any>;
  toggleMenuOpen: (id: string) => void;
  setMenuOpen?: (id: string) => void;
  hasFocus?: boolean;
}
export const MenubarContext = createContext<MenubarContextType>({
  createMenuHandlers: () => ({}),
  createMenuItemHandlers: () => ({}),
  toggleMenuOpen: () => {},
  hasFocus: false
});

interface SubmenuContextType {
  submenuItems: Set<HTMLElement>;
  setSubmenuActiveIndex: (index: number) => void;
  registerSubmenuItem: (ref: React.RefObject<HTMLElement>) => () => void;
}

export const SubmenuContext = createContext<SubmenuContextType>({
  submenuItems: new Set(),
  setSubmenuActiveIndex: () => {},
  registerSubmenuItem: () => () => {}
});

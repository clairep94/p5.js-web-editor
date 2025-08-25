import { createContext } from 'react';

export const ParentMenuContext = createContext<string>('none');

export const MenuOpenContext = createContext<string>('none');

export const MenubarContext = createContext({
  createMenuHandlers: () => ({}),
  createMenuItemHandlers: () => ({}),
  toggleMenuOpen: () => {}
});

export const SubmenuContext = createContext({});

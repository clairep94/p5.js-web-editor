import React, { createContext } from 'react';

export const ParentMenuContext = createContext<string>('none');

export const MenuOpenContext = createContext<string>('none');

interface MenubarContextType {
  // Menubar
  createMenuHandlers: (id: string) => Record<string, any>;
  toggleMenuOpen: (id: string) => void;
  setMenuOpen: (id: string) => void;

  // MenubarItem
  createMenuItemHandlers: (id: string) => Record<string, any>;
  hasFocus?: boolean;

  // MenubarSubmenu
  setActiveIndex: (index: number) => void;
  menuItems: Set<HTMLElement>;
  registerTopLevelItem: (ref: unknown, id: string) => void;
}

export const MenubarContext = createContext<MenubarContextType>({
  createMenuHandlers: () => ({}),
  createMenuItemHandlers: () => ({}),
  toggleMenuOpen: () => {},
  setMenuOpen: () => {},
  setActiveIndex: () => {},
  hasFocus: false,
  menuItems: Set<HTMLElement>,
  registerTopLevelItem(ref: unknown, id: string): void {
    throw new Error('Function not implemented.');
  }
});

interface SubmenuContextType {
  submenuItems: Set<HTMLElement>;
  setSubmenuActiveIndex: (index: number) => void;
  registerSubmenuItem: (ref: React.RefObject<HTMLElement>) => () => void;
  id: string;
  title: string;
  first: () => {};
  last: () => {};
}

export const SubmenuContext = createContext<SubmenuContextType>({
  submenuItems: new Set(),
  setSubmenuActiveIndex: () => {},
  registerSubmenuItem: () => () => {},
  id: '',
  title: '',
  first(): {} {
    throw new Error('Function not implemented.');
  },
  last(): {} {
    throw new Error('Function not implemented.');
  }
});

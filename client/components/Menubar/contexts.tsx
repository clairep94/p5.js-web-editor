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
  hasFocus: boolean;

  // MenubarSubmenu
  setActiveIndex: (index: number) => void;
  menuItems: Set<HTMLButtonElement>;
  registerTopLevelItem: (
    ref: React.Ref<HTMLButtonElement>,
    id: string
  ) => () => void; // returns unregister fn
}

export const MenubarContext = createContext<MenubarContextType>({
  createMenuHandlers: () => ({}),
  createMenuItemHandlers: () => ({}),
  toggleMenuOpen: () => {},
  setMenuOpen: () => {},
  setActiveIndex: () => {},
  hasFocus: false,
  menuItems: new Set<HTMLButtonElement>(),
  registerTopLevelItem: () => () => {}
});

interface SubmenuContextType {
  submenuItems: Set<HTMLLIElement>;
  setSubmenuActiveIndex: (index: number) => void;
  registerSubmenuItem: (ref: React.Ref<HTMLLIElement>) => () => void;
  id: string;
  title: string;
  first: () => void;
  last: () => void;
}

export const SubmenuContext = createContext<SubmenuContextType>({
  submenuItems: new Set(),
  setSubmenuActiveIndex: () => {},
  registerSubmenuItem: () => () => {},
  id: '',
  title: '',
  first: () => {},
  last: () => {}
});

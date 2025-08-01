import React from 'react';
import { render, screen } from '../test-utils';
import Tab from './RouterTab';

describe('Tab', () => {
  it('renders a NavLink with correct text and link', () => {
    render(<Tab to="/dashboard">Dashboard</Tab>);

    const linkElement = screen.getByText('Dashboard');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement.getAttribute('href')).toBe('/dashboard');
  });

  it('includes the dashboard-header class names', () => {
    const { container } = render(<Tab to="/settings">Settings</Tab>);

    const listItem = container.querySelector('li');
    const link = container.querySelector('a');

    expect(listItem).toHaveClass('dashboard-header__tab');
    expect(link).toHaveClass('dashboard-header__tab__title');
  });
});

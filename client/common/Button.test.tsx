import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '../test-utils';
import Button from './Button';

const MockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg data-testid="mock-icon" {...props} />
);

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as an anchor when href is provided', () => {
    render(<Button href="https://example.com">Link</Button>);
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute('href', 'https://example.com');
  });

  it('renders as a React Router link when `to` is provided', () => {
    render(<Button to="/dashboard">Go</Button>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders with iconBefore', () => {
    render(
      <Button iconBefore={<MockIcon aria-label="github" />}>Create</Button>
    );
    expect(screen.getByLabelText('github')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('uses aria-label when provided', () => {
    render(<Button aria-label="Upload" iconOnly />);
    expect(screen.getByLabelText('Upload')).toBeInTheDocument();
  });
});

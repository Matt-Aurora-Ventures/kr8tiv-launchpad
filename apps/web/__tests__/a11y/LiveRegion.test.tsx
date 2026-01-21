/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { LiveRegion } from '@/components/a11y/LiveRegion';

describe('LiveRegion', () => {
  it('renders with default polite priority', () => {
    render(<LiveRegion message="Test announcement" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('renders with assertive priority', () => {
    render(<LiveRegion message="Urgent!" priority="assertive" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('has aria-atomic attribute', () => {
    render(<LiveRegion message="Test" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });

  it('is visually hidden', () => {
    render(<LiveRegion message="Test" />);
    const region = screen.getByRole('status');
    expect(region).toHaveClass('sr-only');
  });

  it('updates message content', () => {
    const { rerender } = render(<LiveRegion message="First message" />);
    expect(screen.getByText('First message')).toBeInTheDocument();

    rerender(<LiveRegion message="Second message" />);
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('can be cleared', () => {
    const { rerender } = render(<LiveRegion message="Message" />);
    rerender(<LiveRegion message="" />);
    expect(screen.queryByText('Message')).not.toBeInTheDocument();
  });

  it('supports custom id', () => {
    render(<LiveRegion message="Test" id="custom-live-region" />);
    const region = document.getElementById('custom-live-region');
    expect(region).toBeInTheDocument();
  });
});

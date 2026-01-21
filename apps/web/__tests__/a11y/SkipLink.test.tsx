/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { SkipLink } from '@/components/a11y/SkipLink';

describe('SkipLink', () => {
  it('renders with correct href', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('is visually hidden by default', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveClass('sr-only');
  });

  it('accepts custom target', () => {
    render(<SkipLink target="#custom-content" />);
    const link = screen.getByRole('link', { name: /skip to main content/i });
    expect(link).toHaveAttribute('href', '#custom-content');
  });

  it('accepts custom label', () => {
    render(<SkipLink label="Skip to navigation" />);
    const link = screen.getByRole('link', { name: /skip to navigation/i });
    expect(link).toBeInTheDocument();
  });
});

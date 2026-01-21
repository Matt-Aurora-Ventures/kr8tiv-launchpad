/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { VisuallyHidden } from '@/components/a11y/VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders children', () => {
    render(<VisuallyHidden>Hidden text for screen readers</VisuallyHidden>);
    expect(screen.getByText('Hidden text for screen readers')).toBeInTheDocument();
  });

  it('has sr-only class for visual hiding', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    const element = screen.getByText('Hidden text');
    expect(element).toHaveClass('sr-only');
  });

  it('renders as span by default', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    const element = screen.getByText('Hidden text');
    expect(element.tagName).toBe('SPAN');
  });

  it('can render as different element', () => {
    render(<VisuallyHidden as="div">Hidden text</VisuallyHidden>);
    const element = screen.getByText('Hidden text');
    expect(element.tagName).toBe('DIV');
  });

  it('can be made focusable', () => {
    render(<VisuallyHidden focusable>Focusable hidden text</VisuallyHidden>);
    const element = screen.getByText('Focusable hidden text');
    expect(element).toHaveClass('focus:not-sr-only');
  });
});

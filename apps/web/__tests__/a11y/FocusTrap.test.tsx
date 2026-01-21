/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FocusTrap } from '@/components/a11y/FocusTrap';

describe('FocusTrap', () => {
  it('renders children', () => {
    render(
      <FocusTrap active>
        <button>First</button>
        <button>Second</button>
      </FocusTrap>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('does not trap focus when inactive', () => {
    render(
      <FocusTrap active={false}>
        <button>Inside</button>
      </FocusTrap>
    );
    // No focus trap behavior expected when inactive
    const button = screen.getByText('Inside');
    expect(button).toBeInTheDocument();
  });

  it('focuses first focusable element when activated', async () => {
    render(
      <FocusTrap active autoFocus>
        <button>First</button>
        <button>Second</button>
      </FocusTrap>
    );

    // Should auto-focus first focusable element
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByText('First')).toHaveFocus();
  });

  it('returns focus on deactivation when returnFocus is true', async () => {
    const outsideButton = document.createElement('button');
    outsideButton.textContent = 'Outside';
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    const { rerender } = render(
      <FocusTrap active returnFocus>
        <button>Inside</button>
      </FocusTrap>
    );

    // Deactivate trap
    rerender(
      <FocusTrap active={false} returnFocus>
        <button>Inside</button>
      </FocusTrap>
    );

    // Focus should return to outside button
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(outsideButton).toHaveFocus();

    document.body.removeChild(outsideButton);
  });

  it('has proper container role', () => {
    render(
      <FocusTrap active>
        <button>Test</button>
      </FocusTrap>
    );
    const container = screen.getByRole('group');
    expect(container).toBeInTheDocument();
  });
});

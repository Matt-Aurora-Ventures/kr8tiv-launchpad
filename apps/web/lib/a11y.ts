/**
 * Accessibility utilities for KR8TIV Launchpad
 */

/**
 * Generate a unique ID with optional prefix.
 * Useful for linking labels to inputs.
 *
 * @param prefix - Optional prefix for the ID
 * @returns Unique string ID
 */
export function generateId(prefix = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Selector for focusable elements
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * Get all focusable elements within a container.
 *
 * @param container - The container element to search within
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );

  return elements.filter((el) => {
    // Check if element or any ancestor is hidden
    if (el.offsetParent === null && el.getAttribute('aria-hidden') !== 'false') {
      return false;
    }
    return true;
  });
}

/**
 * Check if an element is focusable.
 *
 * @param element - Element to check
 * @returns True if element is focusable
 */
export function isElementFocusable(element: HTMLElement): boolean {
  // Check if disabled
  if ('disabled' in element && (element as HTMLButtonElement).disabled) {
    return false;
  }

  // Check if hidden input
  if (element instanceof HTMLInputElement && element.type === 'hidden') {
    return false;
  }

  // Check tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex === '-1') {
    return false;
  }

  // Check if naturally focusable
  const tagName = element.tagName.toLowerCase();
  const naturallyFocusable = ['button', 'input', 'select', 'textarea'];

  if (naturallyFocusable.includes(tagName)) {
    return true;
  }

  // Check for href on anchor
  if (tagName === 'a') {
    return element.hasAttribute('href');
  }

  // Check for positive tabindex
  if (tabindex !== null && parseInt(tabindex, 10) >= 0) {
    return true;
  }

  // Check for contenteditable
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  return false;
}

/**
 * Trap focus within a container element.
 * Returns a cleanup function to remove the trap.
 *
 * @param container - Container to trap focus within
 * @returns Cleanup function
 */
export function trapFocus(container: HTMLElement): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    // Shift+Tab on first element -> last
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // Tab on last element -> first
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Create aria-describedby attribute value from multiple IDs.
 *
 * @param ids - IDs to combine
 * @returns Object with aria-describedby attribute
 */
export function describedBy(
  ...ids: (string | undefined | null)[]
): { 'aria-describedby': string } {
  const validIds = ids.filter((id): id is string => Boolean(id));
  return { 'aria-describedby': validIds.join(' ') };
}

/**
 * Create aria-labelledby attribute value from multiple IDs.
 *
 * @param ids - IDs to combine
 * @returns Object with aria-labelledby attribute
 */
export function labelledBy(
  ...ids: (string | undefined | null)[]
): { 'aria-labelledby': string } {
  const validIds = ids.filter((id): id is string => Boolean(id));
  return { 'aria-labelledby': validIds.join(' ') };
}

/**
 * Get the first scrollable parent of an element.
 *
 * @param element - Element to find scrollable parent for
 * @returns Scrollable parent or document.body
 */
export function getScrollParent(element: HTMLElement): HTMLElement {
  let parent = element.parentElement;

  while (parent) {
    const { overflow, overflowY } = getComputedStyle(parent);
    if (
      overflow === 'auto' ||
      overflow === 'scroll' ||
      overflowY === 'auto' ||
      overflowY === 'scroll'
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document.body;
}

/**
 * Announce a message to screen readers using a temporary live region.
 * This is a one-shot announcement - for repeated announcements use useAnnounce hook.
 *
 * @param message - Message to announce
 * @param priority - polite (default) or assertive
 */
export function announcePolitely(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  region.textContent = message;

  document.body.appendChild(region);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(region);
  }, 1000);
}

/**
 * Check if element has sufficient color contrast.
 * Returns ratio - WCAG AA requires 4.5:1 for normal text, 3:1 for large text.
 *
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns Contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hex
      .replace('#', '')
      .match(/.{2}/g)!
      .map((x) => parseInt(x, 16) / 255);

    const [r, g, b] = rgb.map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Create an accessible error message ID for form fields.
 *
 * @param fieldId - The form field ID
 * @returns Error message element ID
 */
export function getErrorId(fieldId: string): string {
  return `${fieldId}-error`;
}

/**
 * Create an accessible hint/description ID for form fields.
 *
 * @param fieldId - The form field ID
 * @returns Hint element ID
 */
export function getHintId(fieldId: string): string {
  return `${fieldId}-hint`;
}

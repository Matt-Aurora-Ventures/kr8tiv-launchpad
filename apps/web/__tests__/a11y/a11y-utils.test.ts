/**
 * @jest-environment jsdom
 */
import {
  generateId,
  getFocusableElements,
  isElementFocusable,
  trapFocus,
  describedBy,
  labelledBy,
} from '@/lib/a11y';

describe('a11y utilities', () => {
  describe('generateId', () => {
    it('generates unique IDs with prefix', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');
      expect(id1).toMatch(/^test-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('uses default prefix when none provided', () => {
      const id = generateId();
      expect(id).toMatch(/^a11y-[a-z0-9]+$/);
    });
  });

  describe('getFocusableElements', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="container">
          <button>Button 1</button>
          <a href="#">Link</a>
          <input type="text" />
          <select><option>Option</option></select>
          <textarea></textarea>
          <div tabindex="0">Focusable div</div>
          <div tabindex="-1">Not focusable</div>
          <button disabled>Disabled</button>
          <input type="hidden" />
        </div>
      `;
    });

    it('returns all focusable elements', () => {
      const container = document.getElementById('container')!;
      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(6);
    });

    it('excludes disabled elements', () => {
      const container = document.getElementById('container')!;
      const focusable = getFocusableElements(container);
      const disabled = focusable.find(
        (el) => el instanceof HTMLButtonElement && el.disabled
      );
      expect(disabled).toBeUndefined();
    });

    it('excludes elements with tabindex=-1', () => {
      const container = document.getElementById('container')!;
      const focusable = getFocusableElements(container);
      const negative = focusable.find(
        (el) => el.getAttribute('tabindex') === '-1'
      );
      expect(negative).toBeUndefined();
    });

    it('excludes hidden inputs', () => {
      const container = document.getElementById('container')!;
      const focusable = getFocusableElements(container);
      const hidden = focusable.find(
        (el) => el instanceof HTMLInputElement && el.type === 'hidden'
      );
      expect(hidden).toBeUndefined();
    });
  });

  describe('isElementFocusable', () => {
    it('returns true for button', () => {
      const button = document.createElement('button');
      expect(isElementFocusable(button)).toBe(true);
    });

    it('returns false for disabled button', () => {
      const button = document.createElement('button');
      button.disabled = true;
      expect(isElementFocusable(button)).toBe(false);
    });

    it('returns true for link with href', () => {
      const link = document.createElement('a');
      link.href = '#';
      expect(isElementFocusable(link)).toBe(true);
    });

    it('returns false for link without href', () => {
      const link = document.createElement('a');
      expect(isElementFocusable(link)).toBe(false);
    });

    it('returns true for element with tabindex=0', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      expect(isElementFocusable(div)).toBe(true);
    });

    it('returns false for element with tabindex=-1', () => {
      const div = document.createElement('div');
      div.tabIndex = -1;
      expect(isElementFocusable(div)).toBe(false);
    });
  });

  describe('trapFocus', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="trap">
          <button id="first">First</button>
          <button id="second">Second</button>
          <button id="last">Last</button>
        </div>
      `;
    });

    it('returns cleanup function', () => {
      const container = document.getElementById('trap')!;
      const cleanup = trapFocus(container);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('wraps focus from last to first on Tab', () => {
      const container = document.getElementById('trap')!;
      const first = document.getElementById('first')!;
      const last = document.getElementById('last')!;

      trapFocus(container);
      last.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      container.dispatchEvent(event);
      // Focus trap should prevent default and handle focus
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('describedBy', () => {
    it('returns aria-describedby attribute object', () => {
      const result = describedBy('error-123');
      expect(result).toEqual({ 'aria-describedby': 'error-123' });
    });

    it('joins multiple IDs', () => {
      const result = describedBy('hint-1', 'error-1');
      expect(result).toEqual({ 'aria-describedby': 'hint-1 error-1' });
    });

    it('filters empty values', () => {
      const result = describedBy('id-1', '', undefined as unknown as string, 'id-2');
      expect(result).toEqual({ 'aria-describedby': 'id-1 id-2' });
    });
  });

  describe('labelledBy', () => {
    it('returns aria-labelledby attribute object', () => {
      const result = labelledBy('label-123');
      expect(result).toEqual({ 'aria-labelledby': 'label-123' });
    });

    it('joins multiple IDs', () => {
      const result = labelledBy('title-1', 'subtitle-1');
      expect(result).toEqual({ 'aria-labelledby': 'title-1 subtitle-1' });
    });
  });
});

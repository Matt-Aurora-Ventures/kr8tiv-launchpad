'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { LiveRegion } from '@/components/a11y/LiveRegion';

type Priority = 'polite' | 'assertive';

interface AnnounceContextValue {
  /** Current message being announced */
  message: string;
  /** Current priority level */
  priority: Priority;
  /** Announce a message to screen readers */
  announce: (message: string, priority?: Priority) => void;
  /** Clear the current announcement */
  clear: () => void;
}

const AnnounceContext = createContext<AnnounceContextValue | null>(null);

export interface AnnounceProviderProps {
  children: ReactNode;
  /** Delay before clearing message (ms) */
  clearDelay?: number;
}

/**
 * Provider for programmatic screen reader announcements.
 * Include this at the root of your app.
 */
export function AnnounceProvider({
  children,
  clearDelay = 1000,
}: AnnounceProviderProps) {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('polite');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMessage('');
  }, []);

  const announce = useCallback(
    (newMessage: string, newPriority: Priority = 'polite') => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Clear first to force re-announcement of same message
      setMessage('');

      // Set new message on next tick
      requestAnimationFrame(() => {
        setMessage(newMessage);
        setPriority(newPriority);

        // Auto-clear after delay
        timeoutRef.current = setTimeout(() => {
          setMessage('');
        }, clearDelay);
      });
    },
    [clearDelay]
  );

  return (
    <AnnounceContext.Provider value={{ message, priority, announce, clear }}>
      {children}
      <LiveRegion message={message} priority={priority} />
    </AnnounceContext.Provider>
  );
}

/**
 * Hook to programmatically announce messages to screen readers.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announce } = useAnnounce();
 *
 *   const handleSubmit = async () => {
 *     await saveData();
 *     announce('Changes saved successfully');
 *   };
 *
 *   const handleError = () => {
 *     announce('An error occurred', 'assertive');
 *   };
 *
 *   return <button onClick={handleSubmit}>Save</button>;
 * }
 * ```
 */
export function useAnnounce(): AnnounceContextValue {
  const context = useContext(AnnounceContext);
  if (!context) {
    throw new Error('useAnnounce must be used within an AnnounceProvider');
  }
  return context;
}

export default useAnnounce;

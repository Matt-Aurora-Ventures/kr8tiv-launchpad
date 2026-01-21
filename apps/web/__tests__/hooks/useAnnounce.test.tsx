/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnnounce, AnnounceProvider } from '@/hooks/useAnnounce';

describe('useAnnounce', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AnnounceProvider>{children}</AnnounceProvider>
  );

  it('starts with empty message', () => {
    const { result } = renderHook(() => useAnnounce(), { wrapper });
    expect(result.current.message).toBe('');
  });

  it('announces polite messages', () => {
    const { result } = renderHook(() => useAnnounce(), { wrapper });

    act(() => {
      result.current.announce('Test message');
    });

    expect(result.current.message).toBe('Test message');
    expect(result.current.priority).toBe('polite');
  });

  it('announces assertive messages', () => {
    const { result } = renderHook(() => useAnnounce(), { wrapper });

    act(() => {
      result.current.announce('Urgent message', 'assertive');
    });

    expect(result.current.message).toBe('Urgent message');
    expect(result.current.priority).toBe('assertive');
  });

  it('clears message after delay', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useAnnounce(), { wrapper });

    act(() => {
      result.current.announce('Test message');
    });

    expect(result.current.message).toBe('Test message');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.message).toBe('');
    jest.useRealTimers();
  });

  it('clears immediately when requested', () => {
    const { result } = renderHook(() => useAnnounce(), { wrapper });

    act(() => {
      result.current.announce('Test message');
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.message).toBe('');
  });
});

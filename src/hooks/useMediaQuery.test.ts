import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

type MqlMock = {
  matches: boolean;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
};

function createMqlMock(matches: boolean): MqlMock {
  return {
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
}

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    jest.restoreAllMocks();
  });

  it('returns true when the query matches', () => {
    const mql = createMqlMock(true);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });

  it('returns false when the query does not match', () => {
    const mql = createMqlMock(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(result.current).toBe(false);
  });

  it('subscribes to change events', () => {
    const mql = createMqlMock(true);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('unsubscribes on unmount', () => {
    const mql = createMqlMock(true);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(mql.removeEventListener.mock.calls[0][1]).toBe(mql.addEventListener.mock.calls[0][1]);
  });

  it('re-subscribes when the query changes', () => {
    const first = createMqlMock(true);
    const second = createMqlMock(false);
    const queries = new Map([
      ['(min-width: 768px)', first],
      ['(min-width: 1024px)', second],
    ]);
    window.matchMedia = jest.fn((query: string) => queries.get(query) as unknown as MediaQueryList);

    const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: '(min-width: 768px)' },
    });

    rerender({ query: '(min-width: 1024px)' });

    expect(first.removeEventListener).toHaveBeenCalled();
    expect(second.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(result.current).toBe(false);
  });

  it('updates when a change event fires', () => {
    const mql = createMqlMock(false);
    window.matchMedia = jest.fn().mockReturnValue(mql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    mql.matches = true;
    act(() => {
      mql.addEventListener.mock.calls[0][1]();
    });

    expect(result.current).toBe(true);
  });

  describe('when window.matchMedia is unavailable', () => {
    beforeEach(() => {
      (window as unknown as { matchMedia: unknown }).matchMedia = undefined;
    });

    it('returns false', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(false);
    });

    it('uses a noop unsubscribe without touching listeners', () => {
      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(() => unmount()).not.toThrow();
    });
  });
});

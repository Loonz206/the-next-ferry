import { renderHook, waitFor } from '@testing-library/react';
import { useSchedule } from './useSchedule';
import { cloneSchedule } from '../test/fixtures/baseSchedule';

describe('useSchedule hook', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    delete (globalThis as { __APP_BASE_URL__?: string }).__APP_BASE_URL__;
    jest.restoreAllMocks();
  });

  it('loads schedule successfully', async () => {
    const mockSchedule = cloneSchedule();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockSchedule,
    } as Response);

    const { result } = renderHook(() => useSchedule());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.schedule).toEqual(mockSchedule);
    expect(fetchMock).toHaveBeenCalledWith('/data/schedule.json');
  });

  it('uses custom base URL when provided', async () => {
    const mockSchedule = cloneSchedule();
    (globalThis as { __APP_BASE_URL__?: string }).__APP_BASE_URL__ = '/the-next-ferry/';

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockSchedule,
    } as Response);

    const { result } = renderHook(() => useSchedule());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith('/the-next-ferry/data/schedule.json');
  });

  it('sets error when response is not ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useSchedule());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.schedule).toBeNull();
    expect(result.current.error).toBe('Failed to load schedule: 500');
  });

  it('surfaces recovery guidance when the generated schedule file is missing', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => useSchedule());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.schedule).toBeNull();
    expect(result.current.error).toBe(
      'Schedule data is missing. Run npm run fetch-schedule locally or pull the latest public/data/schedule.json.',
    );
  });

  it('sets error on fetch rejection', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useSchedule());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.schedule).toBeNull();
    expect(result.current.error).toBe('Network down');
  });
});

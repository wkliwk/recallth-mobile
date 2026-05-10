/**
 * Tests for error envelope parsing in apiRequest.
 *
 * Covers issue #16: backend returns { success, data, error } where `error`
 * may be a string, an object with a `.message` property, or absent. We verify
 * the thrown ApiError carries the right human-readable message in each case.
 */

import { ApiError, apiRequest } from '../api';

const MOCK_URL = 'https://recallth-backend.fly.dev/auth/login';

function mockFetch(status: number, body: unknown): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('apiRequest — error envelope parsing', () => {
  it('extracts message from { error: string } envelope (401)', async () => {
    mockFetch(401, { success: false, data: null, error: 'Invalid credentials' });

    await expect(apiRequest(MOCK_URL)).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    });
  });

  it('extracts message from { error: { message: string } } envelope (401)', async () => {
    mockFetch(401, {
      success: false,
      data: null,
      error: { message: 'Email or password is incorrect' },
    });

    await expect(apiRequest(MOCK_URL)).rejects.toMatchObject({
      message: 'Email or password is incorrect',
      status: 401,
    });
  });

  it('falls back to friendly message when error field is absent on 401', async () => {
    mockFetch(401, { success: false, data: null });

    await expect(apiRequest(MOCK_URL)).rejects.toMatchObject({
      message: "We couldn't sign you in. Please try again.",
      status: 401,
    });
  });

  it('falls back to friendly message when error is an empty string on 401', async () => {
    mockFetch(401, { success: false, data: null, error: '' });

    await expect(apiRequest(MOCK_URL)).rejects.toMatchObject({
      message: "We couldn't sign you in. Please try again.",
      status: 401,
    });
  });

  it('falls back to status message for non-401 errors without an error field', async () => {
    mockFetch(500, { success: false, data: null });

    await expect(apiRequest(MOCK_URL)).rejects.toMatchObject({
      message: 'Request failed with status 500',
      status: 500,
    });
  });

  it('extracts top-level { message } for generic API shapes', async () => {
    mockFetch(400, { message: 'Validation failed' });

    await expect(apiRequest(MOCK_URL)).rejects.toMatchObject({
      message: 'Validation failed',
      status: 400,
    });
  });

  it('throws ApiError (not a generic Error) on non-2xx', async () => {
    mockFetch(401, { success: false, data: null, error: 'Unauthorized' });

    try {
      await apiRequest(MOCK_URL);
      fail('Expected ApiError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).name).toBe('ApiError');
    }
  });

  it('resolves successfully on 2xx', async () => {
    mockFetch(200, { success: true, data: { token: 'tok', userId: '1', email: 'a@b.com' }, error: null });

    const result = await apiRequest<{ success: boolean }>(MOCK_URL);
    expect(result).toMatchObject({ success: true });
  });
});

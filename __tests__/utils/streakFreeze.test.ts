/**
 * Unit tests for streak freeze service integration.
 * Tests that applyStreakFreeze correctly hits the API and returns the expected shape.
 */

jest.mock('../../services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

import { api } from '../../services/api';
import { applyStreakFreeze } from '../../services/intake';

const mockPost = api.post as jest.MockedFunction<typeof api.post>;

beforeEach(() => {
  jest.clearAllMocks();
});

test('applyStreakFreeze POSTs to /intake/apply-freeze and returns streak + tokensLeft', async () => {
  mockPost.mockResolvedValue({ streak: 15, tokensLeft: 0 });
  const result = await applyStreakFreeze('test-token');
  expect(mockPost).toHaveBeenCalledWith('/intake/apply-freeze', undefined, { token: 'test-token' });
  expect(result.streak).toBe(15);
  expect(result.tokensLeft).toBe(0);
});

test('applyStreakFreeze propagates API errors', async () => {
  mockPost.mockRejectedValue(new Error('No freeze tokens available'));
  await expect(applyStreakFreeze('test-token')).rejects.toThrow('No freeze tokens available');
});

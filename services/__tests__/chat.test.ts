/**
 * Tests for chat service response shape (issue #33).
 *
 * Backend returns `data.message` as a ChatMessage object `{role, content, timestamp}`,
 * not a bare string. Earlier mobile code assumed a string and crashed in
 * `simulateStreaming` with `fullText.split is not a function`.
 */

import { sendMessage, type SendMessageResponse } from '../chat';

const MOCK_URL = 'https://recallth-backend.fly.dev/chat';

function mockFetch(status: number, body: unknown): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sendMessage — response shape', () => {
  it('returns message as a ChatMessage object with content string', async () => {
    const realShape = {
      success: true,
      error: null,
      data: {
        conversationId: 'conv-1',
        message: {
          role: 'assistant',
          content: 'Hello, here are some recommendations.',
          timestamp: '2026-05-10T18:00:00.000Z',
        },
        extractedData: null,
        detectedLanguage: 'en',
        suggestions: ['Tell me more', 'Add to cabinet'],
        actions: [],
      },
    };
    mockFetch(200, realShape);

    const result: SendMessageResponse = await sendMessage({
      message: 'hi',
      token: 'fake-token',
    });

    expect(typeof result.message).toBe('object');
    expect(result.message.role).toBe('assistant');
    expect(typeof result.message.content).toBe('string');
    expect(result.message.content).toBe('Hello, here are some recommendations.');
    expect(result.conversationId).toBe('conv-1');
  });

  it("makes the streaming-friendly content string usable for split(' ')", async () => {
    mockFetch(200, {
      success: true,
      error: null,
      data: {
        conversationId: 'c',
        message: { role: 'assistant', content: 'one two three', timestamp: 't' },
        extractedData: null,
        detectedLanguage: 'en',
        suggestions: [],
        actions: [],
      },
    });

    const result = await sendMessage({ message: 'hi', token: 'tok' });
    expect(() => result.message.content.split(' ')).not.toThrow();
    expect(result.message.content.split(' ')).toEqual(['one', 'two', 'three']);
  });
});

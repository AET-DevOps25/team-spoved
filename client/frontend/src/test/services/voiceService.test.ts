import VoiceService from '../../api/voiceService';

// Ensure we can type-hint the mocked fetch
type FetchMock = jest.MockedFunction<typeof fetch>;

describe('VoiceService Tests', () => {
  let mockFetch: FetchMock;

  beforeEach(() => {
    mockFetch = fetch as FetchMock;
    mockFetch.mockClear();

    // Provide a JWT for getAuthHeaders()
    (window.sessionStorage.getItem as jest.Mock).mockReturnValue('mock.jwt.token');
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  /* ------------------------------------------------------------------ *
   * speechToText
   * ------------------------------------------------------------------ */
  describe('speechToText', () => {
    const audioBlob = new Blob(['dummy'], { type: 'audio/wav' });

    it('converts speech to text successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transcript: 'Hello world' }),
      } as unknown as Response);

      const transcript = await VoiceService.speechToText(audioBlob);

      expect(transcript).toBe('Hello world');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0])
        .toBe('http://localhost:8000/voice/speech-to-text');
      const init = mockFetch.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>).Authorization)
        .toBe('Bearer mock.jwt.token');
    });

    it('throws when backend returns an error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      } as unknown as Response);

      await expect(VoiceService.speechToText(audioBlob))
        .rejects.toThrow('Speech-to-text failed: Bad Request');
    });

    it('throws on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network down'));

      await expect(VoiceService.speechToText(audioBlob))
        .rejects.toThrow('Network down');
    });
  });

  /* ------------------------------------------------------------------ *
   * queryAI
   * ------------------------------------------------------------------ */
  describe('queryAI', () => {
    it('returns AI response & updated history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Hi there',
          updatedHistory: 'Previous | Hi there',
        }),
      } as unknown as Response);

      const result = await VoiceService.queryAI('Hi', '');

      expect(result).toEqual({
        response: 'Hi there',
        updatedHistory: 'Previous | Hi there',
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0])
        .toBe('http://localhost:8000/voice/query-ai');
    });

    it('throws when backend returns an error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      } as unknown as Response);

      await expect(VoiceService.queryAI('Hi', ''))
        .rejects.toThrow('AI query failed: Internal Server Error');
    });
  });

  /* ------------------------------------------------------------------ *
   * textToSpeech
   * ------------------------------------------------------------------ */
  describe('textToSpeech', () => {
    it('returns an audio blob on success', async () => {
      const expectedBlob = new Blob(['audio data'], { type: 'audio/wav' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => expectedBlob,
      } as unknown as Response);

      const result = await VoiceService.textToSpeech('Hello');

      expect(result).toBeInstanceOf(Blob);
      expect(result.size).toBe(expectedBlob.size);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0])
        .toBe('http://localhost:8000/voice/text-to-speech');
    });

    it('throws when backend returns an error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable',
      } as unknown as Response);

      await expect(VoiceService.textToSpeech('Hello'))
        .rejects.toThrow('Text-to-speech failed: Service Unavailable');
    });

    it('throws on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(VoiceService.textToSpeech('Hello'))
        .rejects.toThrow('Network error');
    });
  });
}); 
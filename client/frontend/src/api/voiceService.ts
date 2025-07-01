import { getAuthHeaders } from './utils';

// Voice processing service that matches the backend API implementation
class VoiceService {
  private static readonly BASE_URL = import.meta.env.VITE_GENAI_API_URL;
  
  /**
   * Convert speech audio to text using backend speech-to-text service
   * @param audioBlob - The recorded audio blob
   * @returns Promise<string> - The transcribed text
   */
  static async speechToText(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    const response = await fetch(`${this.BASE_URL}/voice/speech-to-text`, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Speech-to-text failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.transcript;
  }
  
  /**
   * Query AI for a response based on user input and conversation history
   * @param prompt - The user's speech/text input
   * @param conversationHistoric - The conversation history
   * @returns Promise<{response: string, updatedHistory: string}> - AI response and updated history
   */
  static async queryAI(prompt: string, conversationHistoric: string): Promise<{ response: string, updatedHistory: string }> {
    const response = await fetch(`${this.BASE_URL}/voice/query-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        prompt,
        conversation_historic: conversationHistoric
      }),
    });
    
    if (!response.ok) {
      throw new Error(`AI query failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Convert text to speech using backend text-to-speech service
   * @param text - The text to convert to speech
   * @returns Promise<Blob> - The audio blob
   */
  static async textToSpeech(text: string): Promise<Blob> {
    const response = await fetch(`${this.BASE_URL}/voice/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error(`Text-to-speech failed: ${response.statusText}`);
    }
    
    return await response.blob();
  }
}

export default VoiceService;

// Legacy function - kept for backward compatibility but redirects to new implementation
/**
 * @deprecated Use VoiceService.queryAI() instead
 * Send the user's speech to the genai to process it
 * @param message - The user's speech
 * @returns The response from the genai
 */
export const sendResponse = async (message: string): Promise<string> => {
  console.warn('sendResponse is deprecated. Use VoiceService.queryAI() instead.');
  const result = await VoiceService.queryAI(message, '');
  return result.response;
};



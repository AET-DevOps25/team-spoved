import { useState, useRef, useCallback } from 'react';
import VoiceService from '../api/voiceService';

interface Message {
  type: 'user' | 'system';
  text: string;
  timestamp: Date;
}

interface UseVoiceToVoiceReturn {
  messages: Message[];
  isRecording: boolean;
  isPlaying: boolean;
  isProcessing: boolean;
  errorMsg: string;
  conversationHistoric: string;
  startRecording: () => void;
  stopRecording: () => void;
  clearConversation: () => void;
  startVoiceConversation: () => void;
}

// Audio recording class similar to MicrophoneStream in Python
class MicrophoneStream {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private recordingDuration: number;
  
  constructor(recordingDuration: number = 5000) { // 5 seconds default
    this.recordingDuration = recordingDuration;
  }
  
  async start(): Promise<void> {
    try {

      // Get device media
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // Create media recorder
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      // Add data available event listener
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      
      // Auto-stop after duration
      setTimeout(() => {
        this.stop();
      }, this.recordingDuration);
      
    } catch (error) {
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

export const useVoiceToVoice = (): UseVoiceToVoiceReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [conversationHistoric, setConversationHistoric] = useState('');
  
  const microphoneStreamRef = useRef<MicrophoneStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play audio from blob (similar to text_to_speech function in Python)
  const playAudio = useCallback(async (audioBlob: Blob): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onloadeddata = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Failed to play audio'));
      };
      
      audio.play().catch(reject);
    });
  }, []);

  // Main voice conversation loop (similar to main_sts function in Python)
  const startVoiceConversation = useCallback(async () => {
    if (isRecording || isProcessing || isPlaying) {
      return;
    }
    
    try {
      setErrorMsg('');
      setIsProcessing(true);
      
      // Step 1: Start recording (similar to MicrophoneStream context manager)
      setIsRecording(true);
      microphoneStreamRef.current = new MicrophoneStream(5000); // 5 seconds
      await microphoneStreamRef.current.start();
      
      // Wait for recording to complete
      const audioBlob = await microphoneStreamRef.current.stop();
      setIsRecording(false);
      
      if (audioBlob.size === 0) {
        throw new Error('No audio recorded');
      }
      
      // Step 2: Speech-to-text (similar to listen_print_loop)
      const transcript = await VoiceService.speechToText(audioBlob);
      
      if (!transcript.trim()) {
        throw new Error('No speech detected');
      }
      
      // Add user message to conversation
      const userMessage: Message = {
        type: 'user',
        text: transcript,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Step 3: Query AI (similar to query_gemini)
      const { response: aiResponse, updatedHistory } = await VoiceService.queryAI(transcript, conversationHistoric);
      setConversationHistoric(updatedHistory);
      
      // Add AI message to conversation
      const systemMessage: Message = {
        type: 'system',
        text: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
      
      // Step 4: Text-to-speech and play (similar to text_to_speech function)
      const audioResponseBlob = await VoiceService.textToSpeech(aiResponse);
      await playAudio(audioResponseBlob);
      
    } catch (error) {
      console.error('Voice conversation error:', error);
      setErrorMsg(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setIsRecording(false);
    }
  }, [isRecording, isProcessing, isPlaying, conversationHistoric, playAudio]);

  const startRecording = useCallback(async () => {
    if (isRecording || isProcessing || isPlaying) {
      return;
    }
    
    try {
      setErrorMsg('');
      setIsRecording(true);
      microphoneStreamRef.current = new MicrophoneStream(5000);
      await microphoneStreamRef.current.start();
    } catch (error) {
      console.error('Recording start error:', error);
      setErrorMsg(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRecording(false);
    }
  }, [isRecording, isProcessing, isPlaying]);

  const stopRecording = useCallback(async () => {
    if (!microphoneStreamRef.current || !isRecording) {
      return;
    }
    
    try {
      const audioBlob = await microphoneStreamRef.current.stop();
      setIsRecording(false);
      
      if (audioBlob.size > 0) {
        setIsProcessing(true);
        
        // Process the recorded audio
        const transcript = await VoiceService.speechToText(audioBlob);
        
        if (transcript.trim()) {
          const userMessage: Message = {
            type: 'user',
            text: transcript,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
          
          const { response: aiResponse, updatedHistory } = await VoiceService.queryAI(transcript, conversationHistoric);
          setConversationHistoric(updatedHistory);
          
          const systemMessage: Message = {
            type: 'system',
            text: aiResponse,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, systemMessage]);
          
          const audioResponseBlob = await VoiceService.textToSpeech(aiResponse);
          await playAudio(audioResponseBlob);
        }
      }
    } catch (error) {
      console.error('Recording stop error:', error);
      setErrorMsg(`Error processing recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [isRecording, conversationHistoric, playAudio]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationHistoric('');
    setErrorMsg('');
    
    // Stop any ongoing operations
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.stop();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsRecording(false);
    setIsPlaying(false);
    setIsProcessing(false);
  }, []);

  return {
    messages,
    isRecording,
    isPlaying,
    isProcessing,
    errorMsg,
    conversationHistoric,
    startRecording,
    stopRecording,
    clearConversation,
    startVoiceConversation
  };
};

// Type declarations for speech APIs
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

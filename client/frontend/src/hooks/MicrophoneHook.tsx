import { useState, useRef, useCallback } from "react";

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

export const useVoiceToVoice = (): UseVoiceToVoiceReturn => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [conversationHistoric, setConversationHistoric] = useState('');

    // Refs for managing audio recording and playback
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Backend API base URL
    const GENAI_API_URL = import.meta.env.VITE_GENAI_API_URL;

    /**
     * Speech-to-Text function adapted from Google Cloud Speech API sample
     * Instead of using Google Cloud client directly, we use our backend API
     */
    const speechToText = async (audioBlob: Blob): Promise<string> => {
        try {
            // Create FormData similar to Google's multipart upload approach
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');

            // Call our backend API which uses Google Cloud Speech client
            const response = await fetch(`${GENAI_API_URL}/voice/speech-to-text`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Speech-to-text failed: ${response.statusText}`);
            }

            const data = await response.json();
            const transcript = data.transcript;

            if (!transcript || transcript.trim() === '') {
                throw new Error('No speech detected in audio');
            }

            console.log(`Transcription: ${transcript}`);
            return transcript;

        } catch (error) {
            console.error('Speech-to-text error:', error);
            throw error;
        }
    };

    /**
     * Text-to-Speech function adapted from Google Cloud TTS API sample
     * Instead of using Google Cloud client directly, we use our backend API
     */
    const textToSpeech = async (text: string): Promise<void> => {
        try {
            // Add system message to conversation
            setMessages(prevMessages => [...prevMessages, {
                type: 'system',
                text: text,
                timestamp: new Date()
            }]);

            setIsPlaying(true);

            // Call our backend API which uses Google Cloud TTS client
            const response = await fetch(`${GENAI_API_URL}/voice/text-to-speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error(`Text-to-speech failed: ${response.statusText}`);
            }

            // Get audio blob from response
            const audioBlob = await response.blob();
            
            // Create audio URL and play directly (similar to Google's sample)
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.play().then(() => {
                console.log('Audio playback started');
            }).catch((error) => {
                console.error('Audio playback failed:', error);
                setIsPlaying(false);
            });

            // Clean up the URL after playback (similar to Google's sample)
            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
                setIsPlaying(false);
            });

            audio.addEventListener('error', () => {
                URL.revokeObjectURL(audioUrl);
                setIsPlaying(false);
            });

        } catch (error) {
            console.error('Text-to-speech error:', error);
            setIsPlaying(false);
            throw error;
        }
    };

    /**
     * Query AI function that sends user input to our Gemini-powered backend
     */
    const queryAI = async (userText: string): Promise<string> => {
        try {
            const response = await fetch(`${GENAI_API_URL}/voice/query-ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: userText,
                    conversation_historic: conversationHistoric
                }),
            });

            if (!response.ok) {
                throw new Error(`AI query failed: ${response.statusText}`);
            }

            const data = await response.json();
            setConversationHistoric(data.updatedHistory);
            return data.response;

        } catch (error) {
            console.error('AI query error:', error);
            throw error;
        }
    };

    /**
     * Start recording function adapted from Google's streaming recognition sample
     * Uses browser MediaRecorder API instead of node-record-lpcm16
     */
    const startRecording = async (): Promise<void> => {
        if (isRecording || isProcessing || isPlaying) {
            return;
        }

        try {
            setErrorMsg('');
            setIsRecording(true);
            audioChunksRef.current = [];

            // Get user media (similar to Google's microphone input setup)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,  // Same as Google's sample (16kHz)
                    channelCount: 1,    // Mono, like Google's LINEAR16 encoding
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            audioStreamRef.current = stream;

            // Create MediaRecorder (browser equivalent of Google's streaming setup)
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsRecording(false);
                setIsProcessing(true);

                try {
                    // Create audio blob from recorded chunks
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    
                    if (audioBlob.size === 0) {
                        throw new Error('No audio recorded');
                    }

                    // Process the recorded audio through our pipeline
                    await processRecordedAudio(audioBlob);

                } catch (error) {
                    console.error('Processing error:', error);
                    setErrorMsg(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.start();
            console.log('Listening, press stop to end recording...');

            // Auto-stop after 5 seconds (similar to timeout in Google samples)
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    stopRecording();
                }
            }, 5000);

        } catch (error) {
            console.error('Recording start error:', error);
            setErrorMsg(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsRecording(false);
        }
    };

    /**
     * Process the recorded audio through our STT -> AI -> TTS pipeline
     * This follows the same flow as Google's samples but adapted for our backend
     */
    const processRecordedAudio = async (audioBlob: Blob): Promise<void> => {
        try {
            // Step 1: Speech-to-Text (similar to Google's streaming recognition)
            const transcript = await speechToText(audioBlob);

            // Add user message to conversation
            setMessages(prevMessages => [...prevMessages, {
                type: 'user',
                text: transcript,
                timestamp: new Date()
            }]);

            // Step 2: Query AI for response
            const aiResponse = await queryAI(transcript);

            // Step 3: Text-to-Speech (similar to Google's synthesis sample)
            await textToSpeech(aiResponse);

        } catch (error) {
            console.error('Audio processing error:', error);
            throw error;
        }
    };

    /**
     * Stop recording function
     */
    const stopRecording = (): void => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    /**
     * Start voice conversation (one-click recording and processing)
     */
    const startVoiceConversation = useCallback(async (): Promise<void> => {
        await startRecording();
    }, []);

    /**
     * Clear conversation
     */
    const clearConversation = useCallback((): void => {
        setMessages([]);
        setConversationHistoric('');
        setErrorMsg('');
        
        // Stop any ongoing operations
        stopRecording();
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
        startVoiceConversation,
    };
};
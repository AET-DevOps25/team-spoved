import { useState, useRef, useCallback } from "react";
import { createMedia } from '../api/mediaService';
import { useNavigate } from "react-router-dom";

interface Message {
    type: 'user' | 'system';
    text: string;
    timestamp: Date;
}

interface AudioSegment {
    blob: Blob;
    timestamp: Date;
    type: 'user' | 'system';
    duration?: number;
}

interface UseVoiceToVoiceReturn {
    messages: Message[];
    isRecording: boolean;
    isPlaying: boolean;
    isProcessing: boolean;
    errorMsg: string;
    conversationHistoric: string;
    completed: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    clearConversation: () => void;
    startVoiceConversation: () => void;
    handleSendMessage: () => Promise<void>;
}

export const useVoiceToVoice = (): UseVoiceToVoiceReturn => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Refs for managing audio recording and playback
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // New refs for tracking conversation audio
    const audioSegmentsRef = useRef<AudioSegment[]>([]);
    const conversationHistoricRef = useRef<string>('');

    const navigate = useNavigate();

    // Backend API base URL
    const GENAI_API_URL = import.meta.env.VITE_GENAI_API_URL;

    // Completion phrase to detect
    const COMPLETION_PHRASE = "Thank you for the information, I am creating a ticket for you.";

    /**
     * Convert audio blob to consistent format for merging with compression
     */
    const convertToWAV = async (audioBlob: Blob): Promise<Blob> => {
        try {
            const audioContext = new AudioContext();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Reduce sample rate for compression (16kHz instead of default 44.1kHz)
            const targetSampleRate = 16000;
            const targetLength = Math.floor(audioBuffer.length * targetSampleRate / audioBuffer.sampleRate);
            
            // Create new buffer with reduced sample rate
            const resampledBuffer = audioContext.createBuffer(1, targetLength, targetSampleRate);
            const sourceData = audioBuffer.getChannelData(0);
            const targetData = resampledBuffer.getChannelData(0);
            
            // Simple resampling
            for (let i = 0; i < targetLength; i++) {
                const sourceIndex = Math.floor(i * audioBuffer.length / targetLength);
                targetData[i] = sourceData[sourceIndex];
            }
            
            // Convert to WAV format with reduced quality
            const length = resampledBuffer.length;
            const buffer = new ArrayBuffer(44 + length * 2);
            const view = new DataView(buffer);
            
            // WAV header
            const writeString = (offset: number, string: string) => {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            };
            
            writeString(0, 'RIFF');
            view.setUint32(4, 36 + length * 2, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, targetSampleRate, true);
            view.setUint32(28, targetSampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(36, 'data');
            view.setUint32(40, length * 2, true);
            
            // PCM samples
            let offset = 44;
            for (let i = 0; i < length; i++) {
                const sample = Math.max(-1, Math.min(1, targetData[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
            
            return new Blob([buffer], { type: 'audio/wav' });
        } catch (error) {
            console.error('Audio conversion error:', error);
            return audioBlob; // Return original if conversion fails
        }
    };

    /**
     * Merge all audio segments in chronological order
     */
    const mergeAudioSegments = async (segments: AudioSegment[]): Promise<Blob> => {
        try {
            if (segments.length === 0) {
                throw new Error('No audio segments to merge');
            }

            // Sort segments by timestamp
            const sortedSegments = [...segments].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            
            // Convert all segments to WAV format
            const wavSegments = await Promise.all(
                sortedSegments.map(segment => convertToWAV(segment.blob))
            );

            // Create audio context for merging
            const audioContext = new AudioContext();
            const audioBuffers: AudioBuffer[] = [];
            
            // Decode all audio segments
            for (const wavBlob of wavSegments) {
                const arrayBuffer = await wavBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                audioBuffers.push(audioBuffer);
            }

            // Calculate total length
            const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
            const sampleRate = audioBuffers[0].sampleRate;
            
            // Create merged buffer
            const mergedBuffer = audioContext.createBuffer(1, totalLength, sampleRate);
            const channelData = mergedBuffer.getChannelData(0);
            
            // Copy all audio data
            let offset = 0;
            for (const buffer of audioBuffers) {
                const sourceData = buffer.getChannelData(0);
                channelData.set(sourceData, offset);
                offset += buffer.length;
            }

            // Convert merged buffer to WAV blob
            const length = mergedBuffer.length;
            const buffer = new ArrayBuffer(44 + length * 2);
            const view = new DataView(buffer);
            
            // WAV header
            const writeString = (offset: number, string: string) => {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            };
            
            writeString(0, 'RIFF');
            view.setUint32(4, 36 + length * 2, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(36, 'data');
            view.setUint32(40, length * 2, true);
            
            // PCM samples
            const mergedChannelData = mergedBuffer.getChannelData(0);
            let dataOffset = 44;
            for (let i = 0; i < length; i++) {
                const sample = Math.max(-1, Math.min(1, mergedChannelData[i]));
                view.setInt16(dataOffset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                dataOffset += 2;
            }
            
            return new Blob([buffer], { type: 'audio/wav' });
        } catch (error) {
            console.error('Audio merging error:', error);
            throw error;
        }
    };

    /**
     * Save merged conversation audio to media database with error handling
     */
    const saveConversationAudio = async (): Promise<void> => {
        try {
            if (audioSegmentsRef.current.length === 0) {
                console.warn('No audio segments to save');
                return;
            }
            
            // Merge all audio segments
            const mergedAudio = await mergeAudioSegments(audioSegmentsRef.current);
            
            // Check file size before upload
            const fileSizeMB = mergedAudio.size / (1024 * 1024);

            if (fileSizeMB > 45) { // Leave some buffer under 50MB limit
                console.warn('Audio file too large, skipping save');
                setErrorMsg('Conversation audio too large to save');
                return;
            }
            
            // Create form data for upload
            const formData = new FormData();
            formData.append('file', mergedAudio, `conversation-${Date.now()}.wav`);
            formData.append('mediaType', 'AUDIO');
            formData.append('blobType', 'audio/wav');

            // Save to media database
            await createMedia(formData);
            
            // Clear audio segments after successful save
            audioSegmentsRef.current = [];
            
        } catch (error) {
            console.error('Failed to save conversation audio:', error);
            
            // More specific error messages
            if (error instanceof Error) {
                if (error.message.includes('413') || error.message.includes('Content Too Large')) {
                    setErrorMsg('Conversation audio file too large for server');
                } else if (error.message.includes('Network Error')) {
                    setErrorMsg('Network error - check if server is running');
                } else {
                    setErrorMsg(`Failed to save conversation audio: ${error.message}`);
                }
            } else {
                setErrorMsg('Failed to save conversation audio: Unknown error');
            }
        }
    };

    /**
     * Speech-to-Text function adapted from Google Cloud Speech API sample
     * Instead of using Google Cloud client directly, we use our backend API
     * It also tracks the audio segment and detects completion phrase
     */
    const speechToText = async (audioBlob: Blob): Promise<string> => {
        try {
            // Store user audio segment
            audioSegmentsRef.current.push({
                blob: audioBlob,
                timestamp: new Date(),
                type: 'user'
            });

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
            
            // Store system audio segment
            audioSegmentsRef.current.push({
                blob: audioBlob,
                timestamp: new Date(),
                type: 'system'
            });

            // Check if this is the completion phrase
            if (text.includes(COMPLETION_PHRASE)) {
                setCompleted(true);
                
            }
            
            // Create audio URL and play directly (similar to Google's sample)
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.play().then(() => {}).catch((error) => {
                console.error('Audio playback failed:', error);
                setIsPlaying(false);
            });

            // Clean up the URL after playback (similar to Google's sample)
            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioUrl);
                setIsPlaying(false);
                
                // If this was the completion phrase, save audio
                if (text.includes(COMPLETION_PHRASE)) {
                    setCompleted(true);
                }
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
                    conversation_historic: conversationHistoricRef.current
                }),
            });

            if (!response.ok) {
                throw new Error(`AI query failed: ${response.statusText}`);
            }

            const data = await response.json();
            conversationHistoricRef.current = data.updatedHistory;
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

            // Auto-stop after 10 seconds (similar to timeout in Google samples)
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    stopRecording();
                }
            }, 20000);

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
        conversationHistoricRef.current = '';
        audioSegmentsRef.current = []; // Clear audio segments
        setErrorMsg('');
        
        // Stop any ongoing operations
        stopRecording();
        setIsRecording(false);
        setIsPlaying(false);
        setIsProcessing(false);
    }, []);
    
    const handleSendMessage = useCallback(async (): Promise<void> => {
        if (completed) {
            try {
                await saveConversationAudio();
                navigate('/worker');
            } catch (error) {
                console.error('Failed to save conversation audio before navigation:', error);
                // Still navigate even if save fails, but user will see the error message
                navigate('/worker');
            }
        }
    }, [completed, navigate]);

    return {
        messages,
        isRecording,
        isPlaying,
        isProcessing,
        errorMsg,
        conversationHistoric: conversationHistoricRef.current,
        completed,
        startRecording,
        stopRecording,
        clearConversation,
        startVoiceConversation,
        handleSendMessage,
    };
};
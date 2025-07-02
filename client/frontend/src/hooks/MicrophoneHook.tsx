import { useState, useRef, useCallback } from "react";
import { createMedia } from '../api/mediaService';
import { useNavigate } from "react-router-dom";
import VoiceService from '../api/voiceService';

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
    recordingTimeLeft: number;
    audioLevel: number;
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
    const [recordingTimeLeft, setRecordingTimeLeft] = useState(30);
    const [audioLevel, setAudioLevel] = useState(0);

    // Refs for managing audio recording and playback
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // New refs for tracking conversation audio
    const audioSegmentsRef = useRef<AudioSegment[]>([]);
    const conversationHistoricRef = useRef<string>('');

    // Add refs for audio analysis
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>(0);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const navigate = useNavigate();

    // Completion phrase to detect
    const COMPLETION_PHRASE = "Thank you for the information, I am creating a ticket for you.";

    /**
     * Monitor audio levels to ensure speech is being captured
     */
    const startAudioLevelMonitoring = (stream: MediaStream) => {
        try {
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            
            analyserRef.current.fftSize = 256;
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const updateAudioLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    
                    // Calculate average volume
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    setAudioLevel(Math.round(average));
                    
                    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
                }
            };
            
            updateAudioLevel();
        } catch (error) {
            console.warn('Audio level monitoring failed:', error);
        }
    };

    /**
     * Stop audio level monitoring
     */
    const stopAudioLevelMonitoring = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setAudioLevel(0);
    };

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
     * Speech-to-Text function using VoiceService
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

            // Use VoiceService for speech-to-text conversion
            const transcript = await VoiceService.speechToText(audioBlob);

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

            // Use VoiceService for text-to-speech conversion
            const audioBlob = await VoiceService.textToSpeech(text);
            
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
            
            // Create audio URL and play directly
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.play().then(() => {}).catch((error) => {
                console.error('Audio playback failed:', error);
                setIsPlaying(false);
            });

            // Clean up the URL after playback
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
     * Query AI function using VoiceService
     */
    const queryAI = async (userText: string): Promise<string> => {
        try {
            const data = await VoiceService.queryAI(userText, conversationHistoricRef.current);
            conversationHistoricRef.current = data.updatedHistory;
            return data.response;

        } catch (error) {
            console.error('AI query error:', error);
            throw error;
        }
    };

    /**
     * Enhanced start recording with better audio settings and monitoring
     */
    const startRecording = async (): Promise<void> => {
        if (isRecording || isProcessing || isPlaying) {
            return;
        }

        try {
            setErrorMsg('');
            setIsRecording(true);
            audioChunksRef.current = [];
            setRecordingTimeLeft(30);

            // Enhanced audio constraints for better quality
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 44100, // Higher sample rate for better quality
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    //googEchoCancellation: true,
                    //googNoiseSuppression: true,
                    //googAutoGainControl: true,
                    //googHighpassFilter: true, 
                    //googTypingNoiseDetection: true,
                    // Volume constraints
                    //volume: 1.0,
                }
            });

            audioStreamRef.current = stream;
            
            // Start audio level monitoring
            startAudioLevelMonitoring(stream);

            // Try different MIME types for better compatibility
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = ''; // Let browser choose
                    }
                }
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType || undefined,
                audioBitsPerSecond: 128000, // 128 kbps for good quality
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
                
                // Stop audio monitoring
                stopAudioLevelMonitoring();

                // Clear timers
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }
                if (recordingTimeoutRef.current) {
                    clearTimeout(recordingTimeoutRef.current);
                    recordingTimeoutRef.current = null;
                }

                try {
                    const audioBlob = new Blob(audioChunksRef.current, { 
                        type: mimeType || 'audio/webm' 
                    });
                    
                    
                    if (audioBlob.size === 0) {
                        throw new Error('No audio data was recorded. Please check your microphone.');
                    }

                    if (audioBlob.size < 1000) { // Less than 1KB is likely silent
                        throw new Error('Audio recording too short or silent. Please speak louder and try again.');
                    }

                    await processRecordedAudio(audioBlob);

                } catch (error) {
                    console.error('Processing error:', error);
                    setErrorMsg(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                setErrorMsg('Recording failed. Please check your microphone permissions.');
                stopRecording();
            };

            // Start with timeslice for regular data collection
            mediaRecorder.start(500); // Collect data every 500ms

            // Start countdown
            countdownIntervalRef.current = setInterval(() => {
                setRecordingTimeLeft(prev => {
                    if (prev <= 1) {
                        stopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Backup timeout
            recordingTimeoutRef.current = setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    stopRecording();
                }
            }, 30000);

        } catch (error) {
            console.error('Recording start error:', error);
            setErrorMsg(`Failed to start recording: ${error instanceof Error ? error.message : 'Microphone access denied or unavailable'}`);
            setIsRecording(false);
            setRecordingTimeLeft(30);
            stopAudioLevelMonitoring();
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
     * Enhanced stop recording with proper cleanup
     */
    const stopRecording = (): void => {
        
        // Clear all timers
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        if (recordingTimeoutRef.current) {
            clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = null;
        }

        // Stop audio monitoring
        stopAudioLevelMonitoring();

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            audioStreamRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        setRecordingTimeLeft(30);
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
        recordingTimeLeft,
        audioLevel,
        startRecording,
        stopRecording,
        clearConversation,
        startVoiceConversation,
        handleSendMessage,
    };
};
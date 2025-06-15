// hooks/useVideoRecorder.ts
import { useEffect, useRef, useState } from 'react';
import { createMedia } from '../api/mediaService';
import type { MediaType } from '../types/MediaDto';

interface UseVideoRecorderReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  isRecording: boolean;
  isPreviewMode: boolean;
  previewUrl: string | null;
  uploading: boolean;
  errorMsg: string;
  startRecording: () => void;
  stopRecording: () => Promise<void>;
  handleCameraChange: (deviceId: string) => void;
  handleSendVideo: () => Promise<void>;
  handleReRecord: () => void;
}

export const useVideoRecorder = (onUploadComplete: () => void): UseVideoRecorderReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getCameraDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((device) => device.kind === 'videoinput');
    setCameras(videoDevices);

    const preferred = videoDevices.find((d) => d.label.toLowerCase().includes('back')) || videoDevices[0];
    if (preferred) {
      setSelectedCamera(preferred.deviceId);
      startCamera(preferred.deviceId);
    }
  };

  const startCamera = async (deviceId: string) => {
    try {
      if (currentStream) 
        currentStream.getTracks().forEach((track) => track.stop());

      const constraints = { video: { deviceId: { exact: deviceId } } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) 
        videoRef.current.srcObject = stream;

      setCurrentStream(stream);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(`Camera error: ${err.message}`);
      } else {
        setErrorMsg('Camera error: Unknown error');
      }
    }
  };

  const startRecording = () => {
    setRecordedChunks([]);
    if (currentStream) {
      // Define compression settings
      const compressionSettings = {
        videoBitsPerSecond: 1000000, // 1 Mbps - adjust this value to control quality/size
        audioBitsPerSecond: 128000,  // 128 kbps for audio
      };

      let mimeType = 'video/webm';
      let videoBitsPerSecond = compressionSettings.videoBitsPerSecond;

      // Try to use VP9 with compression if supported
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
        videoBitsPerSecond = 800000; // VP9 is more efficient, can use lower bitrate
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
        mimeType = 'video/mp4;codecs=h264';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      try {
        const mediaRecorder = new MediaRecorder(currentStream, {
          mimeType: mimeType,
          videoBitsPerSecond: videoBitsPerSecond,
          audioBitsPerSecond: compressionSettings.audioBitsPerSecond,
        });
        
        // Add quality settings for the video track
        const videoTrack = currentStream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          if (capabilities.width && capabilities.height) {
            // Set a reasonable resolution (e.g., 720p)
            const constraints = {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            };
            videoTrack.applyConstraints(constraints).catch(console.error);
          }
        }
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };
  
        mediaRecorder.start(1000); // Collect data every second
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);

      } catch (error) {
        console.error('Error creating MediaRecorder:', error);
        setErrorMsg('Failed to record video. Please try again.');
        setIsRecording(false);
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Wait for the last chunk
      await new Promise(resolve => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = resolve;
        }
      });

      const mimeType = mediaRecorderRef.current.mimeType;
      
      // Create a blob from all chunks and create preview URL
      const blob = new Blob(recordedChunks, { type: mimeType });
      const previewUrl = URL.createObjectURL(blob);
      setPreviewUrl(previewUrl);
      setIsPreviewMode(true);

      // Update video source to show preview
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = previewUrl;
        videoRef.current.play();
      }
    }
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    startCamera(deviceId);
  };

  const handleSendVideo = async () => {
    if (!recordedChunks.length) return;
    setUploading(true);

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    
    try {
        const formData = new FormData();
        formData.append('file', blob, 'video.webm');
        formData.append('mediaType', 'VIDEO');
        formData.append('blobType', 'video/webm');

        await createMedia(formData);


        onUploadComplete();

        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
          setCurrentStream(null); // Clear the stream reference
        }

        // Reload the page after successful upload
        window.location.reload();

    } catch (err) {
      
      setErrorMsg('Hochladen fehlgeschlagen');
      console.error(err);
    
    } finally {
      setUploading(false);
    }
  };

  const handleReRecord = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIsPreviewMode(false);
    setRecordedChunks([]);
    if (videoRef.current) {
      videoRef.current.src = '';
      startCamera(selectedCamera);
    }
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }})
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCurrentStream(stream);
        getCameraDevices();
      })
      .catch(err => {
        console.error(err);
        setErrorMsg(`Kamera zugang verweigert: ${err.name} – ${err.message}`);
      });


    return () => {
      if (currentStream) currentStream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    cameras,
    selectedCamera,
    isRecording,
    isPreviewMode,
    previewUrl,
    uploading,
    errorMsg,
    startRecording,
    stopRecording,
    handleCameraChange,
    handleSendVideo,
    handleReRecord,
  };
};
import { useEffect, useRef, useState } from 'react';
import { createMedia, triggerAutoTicketGeneration } from '../api/mediaService';

interface UsePhotoCaptureReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  photos: string[];
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  uploading: boolean;
  errorMsg: string;
  autoTicketStatus: 'idle' | 'generating' | 'success' | 'failed';
  handleCameraChange: (deviceId: string) => void;
  takePhoto: () => void;
  handleSendPhoto: () => Promise<void>;
  removePhoto: (index: number) => void;
}

export const usePhotoCapture = (onUploadComplete: () => void): UsePhotoCaptureReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoTicketStatus, setAutoTicketStatus] = useState<'idle' | 'generating' | 'success' | 'failed'>('idle');

  const startCamera = async (deviceId: string) => {
    try {
      if (stream) stream.getTracks().forEach(track => track.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;
    } catch (err) {
      setErrorMsg('Failed to access camera');
    }
  };

  const getCameras = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    setCameras(videoDevices);
    if (videoDevices[0]) {
      setSelectedCamera(videoDevices[0].deviceId);
      startCamera(videoDevices[0].deviceId);
    }
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    startCamera(deviceId);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setPhotos(prev => [...prev, dataUrl]);
  };

  const handleSendPhoto = async () => {
    if (photos.length === 0) return;
    setUploading(true);
    setAutoTicketStatus('generating');

    try {
      // Convert each photo data URL to blob and upload
      for (const photoDataUrl of photos) {
        // Convert data URL to blob
        const response = await fetch(photoDataUrl);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('file', blob, 'photo.png');
        formData.append('mediaType', 'PHOTO');
        formData.append('blobType', 'image/png');

        // createMedia already triggers automation internally
        await createMedia(formData);
      }

      setAutoTicketStatus('success');
      onUploadComplete();

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Reload the page after successful upload
      setTimeout(() => window.location.reload(), 2000);

    } catch (err) {
      setAutoTicketStatus('failed');
      setErrorMsg('Hochladen fehlgeschlagen');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStream(stream);
        getCameras();
      })
      .catch(err => {
        console.error(err);
        setErrorMsg(`Camera access denied: ${err.name} – ${err.message}`);
      });
  
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);
  


  return {
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    photos,
    cameras,
    selectedCamera,
    uploading,
    errorMsg,
    autoTicketStatus,
    handleCameraChange,
    takePhoto,
    handleSendPhoto,
    removePhoto
  };
};

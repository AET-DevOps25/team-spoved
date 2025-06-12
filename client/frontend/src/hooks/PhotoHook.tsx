import { useEffect, useRef, useState } from 'react';

interface UsePhotoCaptureReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  photos: string[];
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  errorMsg: string;
  handleCameraChange: (deviceId: string) => void;
  takePhoto: () => void;
  clearPhotos: () => void;
  handleSendPhoto: () => Promise<void>;
}

export const usePhotoCapture = (onUploadComplete: () => void): UsePhotoCaptureReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const clearPhotos = () => setPhotos([]);

  const handleSendPhoto = async () => {
    if (photos.length === 0) return;
    onUploadComplete();

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    // Reload the page after successful upload
    window.location.reload();
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
    errorMsg,
    handleCameraChange,
    takePhoto,
    clearPhotos,
    handleSendPhoto
  };
};

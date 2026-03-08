import { useState, useRef, useCallback } from 'react';

export function useScreenCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setScreenshot(dataUrl);
    return dataUrl;
  }, []);

  const startCapture = useCallback(async (intervalMs = 10000) => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "never" } as any,
        audio: false,
      });
      streamRef.current = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      videoRef.current = video;
      await video.play();

      setIsCapturing(true);

      // Capture immediately
      setTimeout(() => captureFrame(), 500);

      // Then capture at interval
      intervalRef.current = setInterval(() => {
        captureFrame();
      }, intervalMs);

      // Handle user stopping share
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopCapture();
      });
    } catch (err: any) {
      setError(err.message || 'Falha ao capturar tela');
      setIsCapturing(false);
    }
  }, [captureFrame]);

  const stopCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  return { isCapturing, screenshot, error, startCapture, stopCapture, captureFrame };
}

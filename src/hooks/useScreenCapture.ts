import { useState, useRef, useCallback } from 'react';

export function useScreenCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastCaptureRef = useRef<number>(0);

  // Capture frame instantly from live video - no delay
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setScreenshot(dataUrl);
    return dataUrl;
  }, []);

  // Continuous real-time loop: updates screenshot every ~2s for display,
  // but captureFrame() always grabs the CURRENT frame instantly when called
  const startLiveLoop = useCallback(() => {
    const loop = () => {
      const now = Date.now();
      // Update preview every 2 seconds to avoid excessive re-renders
      if (now - lastCaptureRef.current >= 2000) {
        captureFrame();
        lastCaptureRef.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [captureFrame]);

  const startCapture = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "never", frameRate: { ideal: 30 } } as any,
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

      // Start real-time loop immediately
      startLiveLoop();

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopCapture();
      });
    } catch (err: any) {
      setError(err.message || 'Falha ao capturar tela');
      setIsCapturing(false);
    }
  }, [captureFrame, startLiveLoop]);

  const stopCapture = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    canvasRef.current = null;
    setIsCapturing(false);
  }, []);

  return { isCapturing, screenshot, error, startCapture, stopCapture, captureFrame };
}

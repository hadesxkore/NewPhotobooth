"use client";

import React from "react";

interface UseCameraOptions {
  onError?: (error: Error) => void;
  mirrored?: boolean;
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isLoading: boolean;
  error: Error | null;
  takePhoto: () => string | null;
  retryCamera: () => void;
  isMirrored: boolean;
  toggleMirror: () => void;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  forceShowCamera: () => void;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [isMirrored, setIsMirrored] = React.useState<boolean>(options.mirrored ?? true);
  const [isStable, setIsStable] = React.useState<boolean>(false);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const attemptRef = React.useRef<number>(0);
  const isStartingRef = React.useRef<boolean>(false);

  // Check if the browser supports getUserMedia
  React.useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = new Error("Your browser doesn't support camera access. Please try a different browser.");
      setError(err);
      if (options.onError) {
        options.onError(err);
      }
    }
  }, [options]);

  const startCamera = React.useCallback(async () => {
    // Prevent multiple simultaneous start attempts
    if (isStartingRef.current) {
      console.log("Camera already starting, ignoring duplicate start request");
      return;
    }
    
    // If we already have a stream and it's active, don't restart
    if (stream && stream.active && stream.getVideoTracks().some(track => track.readyState === 'live')) {
      console.log("Camera already running with active tracks, not restarting");
      setIsLoading(false);
      return;
    }
    
    console.log("Starting camera");
    isStartingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Reset video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Get camera stream with default settings
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log("Camera access successful!");
      setStream(mediaStream);
      
      if (videoRef.current) {
        // Connect stream to video element
        videoRef.current.srcObject = mediaStream;
        
        // Set up event handlers
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          setIsLoading(false);
          setIsStable(true);
          isStartingRef.current = false;
          
          // Play video after metadata is loaded to avoid interruption errors
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play().catch(e => {
                console.error("Error playing video after metadata loaded:", e);
              });
            }
          }, 100);
        };
        
        videoRef.current.oncanplay = () => {
          console.log("Video can play now");
          setIsLoading(false);
          setIsStable(true);
          isStartingRef.current = false;
        };
        
        // Don't try to play immediately - wait for metadata loaded event
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      const error = err instanceof Error ? err : new Error(err?.message || "Unknown camera error");
      setError(error);
      if (options.onError) {
        options.onError(err);
      }
      setIsLoading(false);
      isStartingRef.current = false;
    }
  }, [options, stream]);

  const stopCamera = React.useCallback(() => {
    console.log("Stopping camera");
    isStartingRef.current = false;
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStable(false);
  }, [stream]);

  const retryCamera = React.useCallback(() => {
    console.log("Retrying camera connection");
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 300);
  }, [stopCamera, startCamera]);

  const toggleMirror = React.useCallback(() => {
    setIsMirrored(prev => !prev);
  }, []);

  const takePhoto = React.useCallback((): string | null => {
    if (!videoRef.current) {
      console.error("Video element not found when taking photo");
      return null;
    }
    
    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) {
      console.error("Could not get canvas context");
      return null;
    }
    
    // Set canvas dimensions to match video
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      canvas.width = 640;
      canvas.height = 480;
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    // Draw the video frame to the canvas, with mirroring if enabled
    if (isMirrored) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      console.error("Error drawing video to canvas:", e);
      return null;
    }
    
    // Reset transform if we applied mirroring
    if (isMirrored) {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    // Convert canvas to data URL
    try {
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch (e) {
      console.error("Error converting canvas to data URL:", e);
      return null;
    }
  }, [isMirrored]);

  // Simple method to force the camera to be visible
  const forceShowCamera = React.useCallback(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => {
        console.error("Error playing video:", e);
      });
    } else {
      startCamera();
    }
  }, [stream, startCamera]);

  return {
    videoRef,
    stream,
    isLoading,
    error,
    takePhoto,
    retryCamera,
    isMirrored,
    toggleMirror,
    startCamera,
    stopCamera,
    forceShowCamera
  };
} 
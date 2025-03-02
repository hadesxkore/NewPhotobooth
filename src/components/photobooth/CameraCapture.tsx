"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCamera } from "@/hooks/useCamera";
import { Camera, RefreshCw, Loader2, FlipHorizontal, AlertTriangle, Image, Upload, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CameraCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  isMirrored: boolean;
  onToggleMirror: () => void;
}

export function CameraCapture({ 
  onCapture,
  isMirrored,
  onToggleMirror
}: CameraCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [flashActive, setFlashActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string>("Initializing camera...");
  const [initializationTime, setInitializationTime] = useState<number>(0);
  const [showFallbackOption, setShowFallbackOption] = useState(false);
  const [forceShowUpload, setForceShowUpload] = useState(false);
  const [skipCamera, setSkipCamera] = useState(false);
  const [stableState, setStableState] = useState(false);
  
  const { 
    videoRef, 
    stream, 
    isLoading, 
    error, 
    takePhoto,
    retryCamera,
    startCamera,
    stopCamera,
    forceShowCamera
  } = useCamera({
    mirrored: isMirrored,
    onError: (err) => {
      console.error("Camera error in component:", err);
      setCameraStatus(`Error: ${err.message}`);
      setShowFallbackOption(true);
    }
  });

  // Start camera when component mounts
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current || skipCamera) {
      return;
    }
    
    hasInitializedRef.current = true;
    console.log("CameraCapture: Starting camera");
    setCameraStatus("Starting camera...");
    const startTime = Date.now();
    
    // Add a global window event listener for debugging
    const handleVisibilityChange = () => {
      console.log("Document visibility changed:", document.visibilityState);
      if (document.visibilityState === 'visible' && !videoReady && !error && !skipCamera && !stableState) {
        console.log("Document became visible again, retrying camera");
        retryCamera();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start the camera immediately without delays
    startCamera()
      .then(() => {
        console.log("CameraCapture: Camera started successfully");
        setCameraStatus("Camera started, waiting for video...");
      })
      .catch(err => {
        console.error("CameraCapture: Error starting camera:", err);
        setCameraStatus(`Failed to start camera: ${err.message}`);
        setShowFallbackOption(true);
      });
    
    // Set up a timer to track initialization time
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setInitializationTime(elapsed);
      
      // After 3 seconds, show fallback option
      if (elapsed > 3 && !videoReady && !error) {
        setShowFallbackOption(true);
      }
      
      // After 8 seconds, force show upload option
      if (elapsed > 8 && !videoReady && !error) {
        setForceShowUpload(true);
        setCameraStatus("Camera initialization timed out. Please use the upload option.");
      }
    }, 1000);
    
    // Clean up when component unmounts
    return () => {
      console.log("CameraCapture: Stopping camera");
      stopCamera();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startCamera, stopCamera, error, retryCamera, skipCamera]);

  const handleVideoLoaded = () => {
    console.log("CameraCapture: Video element loaded metadata");
    
    // Check if video has actual dimensions
    if (videoRef.current && (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0)) {
      console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
      setCameraStatus("Camera ready");
      setVideoReady(true);
      setShowFallbackOption(false);
      setStableState(true);
    } else {
      console.warn("Video metadata loaded but dimensions are zero");
      // Try again in a moment
      setTimeout(() => {
        if (videoRef.current && (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0)) {
          console.log("Video dimensions (delayed check):", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
          setCameraStatus("Camera ready");
          setVideoReady(true);
          setShowFallbackOption(false);
          setStableState(true);
        } else {
          console.error("Video still has zero dimensions after delay");
          // Force video ready even without dimensions as a last resort
          setCameraStatus("Camera ready (forced)");
          setVideoReady(true);
          setStableState(true);
        }
      }, 500);
    }
  };

  const handleCaptureClick = () => {
    setIsCountingDown(true);
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capturePhoto = () => {
    const photoDataUrl = takePhoto();
    
    if (photoDataUrl) {
      // Apply flash effect
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 150);
      
      setCapturedPhoto(photoDataUrl);
      
      // Reset countdown state
      setIsCountingDown(false);
    } else {
      console.error("CameraCapture: Failed to capture photo");
      setCameraStatus("Failed to capture photo");
      setShowFallbackOption(true);
    }
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      setCapturedPhoto(null);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleManualRetry = () => {
    console.log("CameraCapture: Manual retry requested");
    setCameraStatus("Retrying camera connection...");
    setVideoReady(false);
    setInitializationTime(0);
    setShowFallbackOption(false);
    setForceShowUpload(false);
    setSkipCamera(false);
    retryCamera();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log("File selected:", file.name, file.type, file.size);
    setCameraStatus("Processing uploaded image...");
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageDataUrl = event.target.result as string;
        console.log("File loaded as data URL, length:", imageDataUrl.length);
        setCapturedPhoto(imageDataUrl);
        setCameraStatus("Image uploaded successfully");
      }
    };
    reader.onerror = (err) => {
      console.error("Error reading file:", err);
      setCameraStatus("Error reading file");
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleSkipCamera = () => {
    console.log("User chose to skip camera and upload image");
    setSkipCamera(true);
    stopCamera();
    triggerFileInput();
  };

  // If user chose to skip camera, show upload UI
  if (skipCamera && !capturedPhoto) {
    return (
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              Upload an Image
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Select an image from your device to use in the photobooth.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button 
                onClick={triggerFileInput}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Image className="mr-2 h-4 w-4" /> Select Image
              </Button>
              <Button 
                variant="outline" 
                onClick={handleManualRetry}
                className="w-full"
              >
                <Camera className="mr-2 h-4 w-4" /> Try Camera Again
              </Button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileInputChange} 
              className="hidden" 
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have a critical error or force showing upload
  if (error || forceShowUpload) {
    return (
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
            <div className={cn(
              "p-3 rounded-full",
              error ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"
            )}>
              {error ? (
                <Camera className="h-8 w-8 text-red-600 dark:text-red-400" />
              ) : (
                <Upload className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
            <h3 className={cn(
              "text-xl font-semibold",
              error ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
            )}>
              {error ? "Camera Error" : "Camera Unavailable"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              {error 
                ? (error.message || "Unable to access camera. Please make sure you've granted camera permissions and no other application is using it.")
                : "Camera initialization is taking too long. This could be due to browser permissions, hardware issues, or another application using your camera."
              }
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button 
                onClick={triggerFileInput}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Image className="mr-2 h-4 w-4" /> Upload Image Instead
              </Button>
              <Button 
                variant="outline" 
                onClick={handleManualRetry}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Try Camera Again
              </Button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileInputChange} 
              className="hidden" 
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="relative aspect-video bg-black">
          {/* Loading state */}
          {(isLoading || !videoReady) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 text-white animate-spin mb-4" />
              <div className="text-white text-center">
                <p>{cameraStatus}</p>
                <p className="text-sm text-gray-400 mt-1">Time elapsed: {initializationTime}s</p>
                
                {/* Simplified message */}
                <p className="mt-4 text-sm text-gray-400 max-w-md mx-auto">
                  Please allow camera access when prompted by your browser.
                </p>
              </div>
              
              {showFallbackOption && (
                <div className="mt-6 max-w-md text-center">
                  <div className="flex items-center justify-center mb-2 text-yellow-400">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>Camera initialization is taking longer than expected</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    This could be due to browser permissions, hardware issues, or another application using your camera.
                  </p>
                  
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={handleManualRetry}
                      className="bg-white/10 hover:bg-white/20 text-white"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Retry Camera
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Video preview */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              display: videoReady && !capturedPhoto ? 'block' : 'none' 
            }}
            onLoadedMetadata={() => {
              console.log("Video metadata loaded");
              if (!videoReady) {
                setVideoReady(true);
                setCameraStatus("Camera ready");
                setStableState(true);
              }
            }}
            onCanPlay={() => {
              console.log("Video can play now");
              if (!videoReady) {
                setVideoReady(true);
                setCameraStatus("Camera ready");
                setStableState(true);
              }
            }}
            className={cn(
              "w-full h-full object-cover",
              isMirrored && "scale-x-[-1]"
            )}
          />
          
          {/* Canvas for capturing (hidden) */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* File input for fallback (hidden) */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handleFileInputChange} 
            className="hidden" 
          />
          
          {/* Flash effect */}
          {flashActive && (
            <div className="absolute inset-0 bg-white animate-flash" />
          )}
          
          {/* Countdown overlay */}
          <AnimatePresence>
            {isCountingDown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              >
                <motion.div
                  key={countdown}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-white text-8xl font-bold"
                >
                  {countdown}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Photo review overlay */}
          <AnimatePresence>
            {capturedPhoto && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black"
              >
                <img 
                  src={capturedPhoto} 
                  alt="Captured" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Mirror toggle button */}
          {videoReady && !capturedPhoto && (
            <Button
              size="icon"
              variant="outline"
              onClick={onToggleMirror}
              className="absolute top-4 left-4 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border-white/20"
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Controls */}
        <div className="p-6 flex justify-center">
          {capturedPhoto ? (
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={handleRetake}
                className="px-8"
              >
                Retake
              </Button>
              <Button 
                onClick={handleConfirm}
                className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Use Photo
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              {videoReady && (
                <Button
                  size="lg"
                  onClick={isLoading || isCountingDown ? undefined : handleCaptureClick}
                  className={`rounded-full h-16 w-16 p-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white ${
                    isLoading || isCountingDown ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Camera className="h-6 w-6" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
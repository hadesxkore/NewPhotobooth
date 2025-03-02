"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCamera } from "@/hooks/useCamera";
import { Camera, RefreshCw, Loader2, FlipHorizontal, AlertTriangle, Image, Upload, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import FilterSelector, { FILTERS } from "./FilterSelector";
import "@/styles/filters.css";

export interface CameraCaptureProps {
  onCapture: (photo: { dataUrl: string; filter: string }) => void;
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
  const [selectedFilter, setSelectedFilter] = useState("none");
  
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
      
      // Apply filter to the captured image
      if (canvasRef.current) {
        applyFilterToCanvas(canvasRef.current, selectedFilter);
      }
    } else {
      console.error("CameraCapture: Failed to capture photo");
      setCameraStatus("Failed to capture photo");
      setShowFallbackOption(true);
    }
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture({
        dataUrl: capturedPhoto,
        filter: selectedFilter
      });
      setCapturedPhoto(null);
      // Reset the selected filter after confirming
      setSelectedFilter("none");
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

  const applyFilterToCanvas = (canvas: HTMLCanvasElement, filterId: string) => {
    const ctx = canvas.getContext('2d');
    const filter = FILTERS.find(f => f.id === filterId)?.class || "";
    
    if (!ctx) return; // Add null check for context
    
    // Apply CSS filter to canvas context if a filter is selected
    if (filter) {
      // Convert CSS filter to canvas filter
      switch(filterId) {
        case "grayscale":
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg; // red
            data[i + 1] = avg; // green
            data[i + 2] = avg; // blue
          }
          ctx.putImageData(imageData, 0, 0);
          break;
        case "sepia":
          const sepiaData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const sepiaPixels = sepiaData.data;
          for (let i = 0; i < sepiaPixels.length; i += 4) {
            const r = sepiaPixels[i];
            const g = sepiaPixels[i + 1];
            const b = sepiaPixels[i + 2];
            
            sepiaPixels[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            sepiaPixels[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            sepiaPixels[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
          }
          ctx.putImageData(sepiaData, 0, 0);
          break;
        case "vintage":
          const vintageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const vintagePixels = vintageData.data;
          for (let i = 0; i < vintagePixels.length; i += 4) {
            const r = vintagePixels[i];
            const g = vintagePixels[i + 1];
            const b = vintagePixels[i + 2];
            
            // Sepia effect (lighter than full sepia)
            vintagePixels[i] = Math.min(255, (r * 0.35) + (g * 0.75) + (b * 0.18));
            vintagePixels[i + 1] = Math.min(255, (r * 0.31) + (g * 0.65) + (b * 0.15));
            vintagePixels[i + 2] = Math.min(255, (r * 0.27) + (g * 0.53) + (b * 0.13));
            
            // Increase contrast
            vintagePixels[i] = Math.min(255, vintagePixels[i] * 1.2);
            vintagePixels[i + 1] = Math.min(255, vintagePixels[i + 1] * 1.2);
            vintagePixels[i + 2] = Math.min(255, vintagePixels[i + 2] * 1.2);
          }
          ctx.putImageData(vintageData, 0, 0);
          break;
        case "contrast":
          const contrastData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const contrastPixels = contrastData.data;
          const factor = 1.5; // Contrast factor
          
          for (let i = 0; i < contrastPixels.length; i += 4) {
            contrastPixels[i] = factor * (contrastPixels[i] - 128) + 128;
            contrastPixels[i + 1] = factor * (contrastPixels[i + 1] - 128) + 128;
            contrastPixels[i + 2] = factor * (contrastPixels[i + 2] - 128) + 128;
          }
          ctx.putImageData(contrastData, 0, 0);
          break;
        case "brightness":
          const brightnessData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const brightnessPixels = brightnessData.data;
          const brightnessValue = 50; // Brightness increase
          
          for (let i = 0; i < brightnessPixels.length; i += 4) {
            brightnessPixels[i] = Math.min(255, brightnessPixels[i] + brightnessValue);
            brightnessPixels[i + 1] = Math.min(255, brightnessPixels[i + 1] + brightnessValue);
            brightnessPixels[i + 2] = Math.min(255, brightnessPixels[i + 2] + brightnessValue);
          }
          ctx.putImageData(brightnessData, 0, 0);
          break;
        case "invert":
          const invertData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const invertPixels = invertData.data;
          
          for (let i = 0; i < invertPixels.length; i += 4) {
            invertPixels[i] = 255 - invertPixels[i];
            invertPixels[i + 1] = 255 - invertPixels[i + 1];
            invertPixels[i + 2] = 255 - invertPixels[i + 2];
          }
          ctx.putImageData(invertData, 0, 0);
          break;
        case "blur":
          // Blur is difficult to implement directly with pixel manipulation
          // We'll use a workaround by drawing the image to another canvas with CSS blur
          // and then drawing it back
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) { // Add null check for tempCtx
            tempCtx.filter = 'blur(4px)';
            tempCtx.drawImage(canvas, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0);
          }
          break;
        default:
          // No filter
          break;
      }
    }
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

  // Simplified filter selector UI
  const renderFilterOptions = () => {
    return (
      <div className="grid grid-cols-4 gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`p-2 rounded-md transition-all ${
              selectedFilter === filter.id 
                ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500' 
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label={`Apply ${filter.name} filter`}
          >
            <div className="text-xs font-medium text-center">{filter.name}</div>
          </button>
        ))}
      </div>
    );
  };

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
            className={cn(
              "w-full h-full object-cover filter-transition",
              isMirrored && "scale-x-[-1]",
              FILTERS.find(f => f.id === selectedFilter)?.class || ""
            )}
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
            <div className="flex flex-col w-full gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2 text-center">Choose a filter</h3>
                {renderFilterOptions()}
              </div>
              <div className="flex gap-4 justify-center">
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

        {/* Remove the filter selector when not in review mode */}
        {videoReady && !capturedPhoto && (
          <div className="p-4 bg-background/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 mb-4">
            <h3 className="text-sm font-medium mb-2 text-center">Preview filter (select after capture)</h3>
            {renderFilterOptions()}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
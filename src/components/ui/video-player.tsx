import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onClose?: () => void;
}

export function VideoPlayer({ src, poster, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [videoRatio, setVideoRatio] = useState<number | null>(null);
  
  // Determine if we should use overlay mode based on onClose prop
  const isOverlayMode = !!onClose;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      
      // Calculate and store video aspect ratio
      if (video.videoWidth && video.videoHeight) {
        const ratio = video.videoWidth / video.videoHeight;
        setVideoRatio(ratio);
        console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}, ratio: ${ratio}`);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // Auto-play when component mounts
    video.play().catch(error => {
      console.error('Auto-play failed:', error);
      // Most browsers require user interaction before auto-play
    });
    setIsPlaying(true);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => {
        console.error('Play failed:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const toggleFullscreen = () => {
    const videoContainer = document.getElementById('video-container');
    if (!videoContainer) return;

    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreenMode(true);
    } else {
      document.exitFullscreen();
      setIsFullscreenMode(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Create a dynamic class for the progress bar width instead of inline styles
  const progressBarClass = `progress-width-${Math.round(progress)}`;
  
  // Add a dynamic style tag to the document head
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `.${progressBarClass} { width: ${progress}%; }`;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
    };
  }, [progress, progressBarClass]);
  
  // Determine container style based on video ratio
  const getContainerStyle = () => {
    if (!videoRatio) return {};
    
    // Portrait video (e.g., 9:16)
    if (videoRatio < 1) {
      return {
        maxWidth: `${Math.min(80 * videoRatio, 100)}vh`, // Limit width based on height
        width: '100%',
        height: 'auto',
        margin: '0 auto',
        padding: '20px',
        paddingBottom: '120px' // Add more padding at bottom for controls
      };
    }
    // Landscape video (e.g., 16:9)
    else {
      return {
        width: '100%',
        maxHeight: '80vh',
        height: 'auto',
        padding: '20px',
        paddingBottom: '120px' // Add more padding at bottom for controls
      };
    }
  };

  return (
    <div 
      id="video-container" 
      ref={containerRef}
      className={isOverlayMode ? 
        "fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" : 
        "relative w-full h-full bg-black flex items-center justify-center overflow-visible"}
      style={{ isolation: 'isolate' }}
    >
      <div style={getContainerStyle()} className="relative w-full max-w-full rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full object-contain mx-auto"
          src={src}
          poster={poster}
          playsInline
          preload="auto"
          controlsList="nodownload"
          disablePictureInPicture
          muted={false}
          autoPlay
        />
        
        {/* Video Controls */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 sm:p-6 z-[200]" 
          style={{ 
            marginBottom: isOverlayMode ? 0 : '60px',
            transform: 'translateZ(10px)', // Force onto a new stacking context
            paddingBottom: '20px'
          }}>
          {/* Progress Bar */}
          <div 
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-3"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-primary rounded-full" 
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-label="Video progress"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-3 sm:space-x-5">
              <button 
                onClick={togglePlay}
                className="text-white hover:text-primary transition-colors p-2 rounded-full bg-black/30"
                title={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button 
                onClick={toggleMute}
                className="text-white hover:text-primary transition-colors p-2 rounded-full bg-black/30"
                title={isMuted ? "Unmute" : "Mute"}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <span className="text-white text-sm sm:text-base font-medium whitespace-nowrap bg-black/30 px-2 py-1 rounded">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-5">
              <button 
                onClick={toggleFullscreen}
                className="text-white hover:text-primary transition-colors p-2 rounded-full bg-black/30"
                title="Fullscreen"
                aria-label="Toggle fullscreen mode"
              >
                <Maximize size={20} />
              </button>
              
              {onClose && (
                <button 
                  onClick={onClose}
                  className="text-white hover:text-primary transition-colors p-2 rounded-full bg-black/30"
                  title="Close"
                  aria-label="Close video player"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

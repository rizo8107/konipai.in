import { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerFallbackProps {
  videoUrl: string;
}

export function VideoPlayerFallback({ videoUrl }: VideoPlayerFallbackProps) {
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  
  const handlePlayClick = () => {
    // Open the video in a new tab/window as a fallback solution
    window.open(videoUrl, '_blank');
    setShowFallbackMessage(true);
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Video Thumbnail with Play Button */}
      <div className="relative w-full h-full">
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <span className="text-white text-lg">Product Video</span>
        </div>
        
        <div 
          className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center hover:bg-opacity-20 transition-all cursor-pointer"
          onClick={handlePlayClick}
        >
          <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center hover:bg-opacity-100 transition-all mb-4">
            <Play className="h-8 w-8 text-primary fill-primary ml-1" />
          </div>

        </div>
      </div>
      

    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

const IntroVideo: React.FC<IntroVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleEnded = () => {
        if (!isVideoEnded) {
          setIsVideoEnded(true);
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      };

      video.addEventListener('ended', handleEnded);

      // We wait for user interaction to play
      // video.play() is moved to handleStart

      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [onComplete, isVideoEnded]);

  const handleStart = () => {
    setHasStarted(true);
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error("Play failed:", e));
      
      // Backup timeout in case 'ended' event fails for some reason (8 seconds + 1.5s buffer)
      setTimeout(() => {
        if (!isVideoEnded) {
          setIsVideoEnded(true);
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      }, 9500);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[99999999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-1000 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {!hasStarted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <button 
            onClick={handleStart}
            className="px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all animate-pulse flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
            اضغط للبدء
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        src="/intro.mp4"
        className="w-full h-[100dvh] object-cover bg-black"
        playsInline
        preload="auto"
      />
    </div>
  );
};

export default IntroVideo;

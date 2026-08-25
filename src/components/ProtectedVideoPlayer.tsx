import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Shield, Lock } from 'lucide-react';

interface ProtectedVideoPlayerProps {
  src: string;
  title: string;
  studentName?: string;
  studentRollNumber?: string;
}

export const ProtectedVideoPlayer: React.FC<ProtectedVideoPlayerProps> = ({
  src,
  title,
  studentName = 'Oritech Student',
  studentRollNumber = 'ORI-2026-REG',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Disable context menu and key hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 's' || e.key === 'u' || e.key === 'i' || e.key === 'j' || e.key === 'c')
      ) {
        e.preventDefault();
      }
      if (e.key === 'F12') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(current);
    setDuration(dur);
    setProgress((current / dur) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '00:00';
    const minutes = Math.floor(timeInSec / 60);
    const seconds = Math.floor(timeInSec % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none"
    >
      {/* Top Security Banner */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-slate-950/80 to-transparent p-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 text-xs font-mono text-red-500 bg-red-950/80 backdrop-blur px-2.5 py-1 rounded-md border border-red-800/50">
          <Shield className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="font-bold">DRM Encrypted Stream (HLS/AES-128)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/90 px-2 py-1 rounded border border-slate-800">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Protected Player</span>
        </div>
      </div>

      {/* Dynamic Anti-Piracy Watermark Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-25 hover:opacity-40 transition-opacity">
        <div className="transform -rotate-12 bg-black/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl text-center">
          <p className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest">ORITECH SECURE STREAM</p>
          <p className="text-sm font-mono text-red-400 font-black">{studentRollNumber} | {studentName}</p>
          <p className="text-[10px] text-slate-300 mt-0.5">Licensed to Student ID • Unauthorized Copying Prohibited</p>
        </div>
      </div>

      {/* HTML5 Protected Video Element */}
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        className="w-full aspect-video object-contain bg-black cursor-pointer"
      />

      {/* Custom Control Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-4 opacity-100 transition-opacity">
        {/* Progress Slider */}
        <div className="relative mb-3 flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 accent-red-600 rounded-lg cursor-pointer hover:h-2 transition-all"
          />
        </div>

        <div className="flex items-center justify-between text-slate-200">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-slate-300 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-700 accent-red-600 rounded cursor-pointer"
              />
            </div>

            <span className="text-xs font-mono text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[200px] font-medium">
              {title}
            </span>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

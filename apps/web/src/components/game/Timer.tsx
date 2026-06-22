import { useEffect, useState } from 'react';

interface TimerProps {
  seconds: number;
  totalSeconds: number;
  showCircular?: boolean;
}

export default function GameTimer({ seconds, totalSeconds, showCircular = true }: TimerProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const percentage = (seconds / totalSeconds) * 100;
    setProgress(percentage);
  }, [seconds, totalSeconds]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const getColor = () => {
    if (progress > 50) return 'text-success';
    if (progress > 25) return 'text-warning';
    return 'text-error';
  };

  // Circular progress calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (!showCircular) {
    return (
      <div className={`text-2xl font-mono font-bold ${getColor()}`}>
        {formatTime(seconds)}
      </div>
    );
  }

  return (
    <div className="relative w-24 h-24">
      {/* Circular progress */}
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-surface"
        />
        {/* Progress circle */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${getColor()} transition-all duration-1000 ease-linear`}
        />
      </svg>
      
      {/* Time display in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-mono font-bold ${getColor()}`}>
          {formatTime(seconds)}
        </span>
      </div>

      {/* Timeout indicator */}
      {seconds === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-error/90 rounded-full animate-pulse">
          <span className="text-white text-xs font-bold">TIMEOUT</span>
        </div>
      )}
    </div>
  );
}

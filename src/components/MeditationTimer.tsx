import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMeditation } from '@/hooks/useMeditation';

const PRESET_TIMES = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
];

export function MeditationTimer() {
  const [selectedTime, setSelectedTime] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionLogged, setSessionLogged] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { logSession, getTodayTotalMinutes } = useMeditation();

  // Log session when timer completes
  useEffect(() => {
    if (timeLeft === 0 && !sessionLogged && selectedTime > 0) {
      logSession(selectedTime);
      setSessionLogged(true);
    }
  }, [timeLeft, sessionLogged, selectedTime, logSession]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (soundEnabled) {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVTe');
              audio.play().catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, soundEnabled]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedTime);
    setSessionLogged(false);
  };

  const handleSelectTime = (seconds: number) => {
    if (!isRunning) {
      setSelectedTime(seconds);
      setTimeLeft(seconds);
      setSessionLogged(false);
    }
  };

  const todayMinutes = getTodayTotalMinutes();

  const progress = ((selectedTime - timeLeft) / selectedTime) * 100;

  return (
    <div className="bg-card rounded-xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          🧘 Meditation
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-8 w-8"
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        {PRESET_TIMES.map((preset) => (
          <Button
            key={preset.seconds}
            variant={selectedTime === preset.seconds ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSelectTime(preset.seconds)}
            disabled={isRunning}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="relative flex justify-center items-center mb-4">
        <div className="relative h-32 w-32">
          {/* Background circle */}
          <svg className="h-full w-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - progress / 100)}`}
              className="text-primary transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {!isRunning ? (
          <Button
            onClick={handleStart}
            disabled={timeLeft === 0}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {timeLeft === 0 ? 'Complete!' : 'Start'}
          </Button>
        ) : (
          <Button onClick={handlePause} variant="secondary" className="gap-2">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}
        <Button
          onClick={handleReset}
          variant="outline"
          size="icon"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {timeLeft === 0 && (
        <p className="text-center text-sm text-primary mt-3 animate-pulse">
          🎉 Great job! Session complete.
        </p>
      )}

      {todayMinutes > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Today: {todayMinutes} min meditated
        </p>
      )}
    </div>
  );
}

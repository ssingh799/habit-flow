import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Timer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface HabitTimerProps {
  onComplete: (durationSeconds: number) => void;
  onCancel: () => void;
  habitName: string;
}

type TimerMode = 'stopwatch' | 'countdown';
type TimerState = 'idle' | 'running' | 'paused';

export function HabitTimer({ onComplete, onCancel, habitName }: HabitTimerProps) {
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdownMinutes, setCountdownMinutes] = useState(30);
  const [countdownInitialSeconds, setCountdownInitialSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Format time display
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get display time based on mode
  const getDisplayTime = () => {
    if (mode === 'stopwatch') {
      return elapsedSeconds;
    } else {
      const remaining = countdownInitialSeconds - elapsedSeconds;
      return remaining > 0 ? remaining : 0;
    }
  };

  // Clear interval on cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle countdown completion
  useEffect(() => {
    if (mode === 'countdown' && timerState === 'running') {
      const remaining = countdownInitialSeconds - elapsedSeconds;
      if (remaining <= 0) {
        handleStop();
      }
    }
  }, [elapsedSeconds, mode, countdownInitialSeconds, timerState]);

  const startTimer = useCallback(() => {
    if (mode === 'countdown' && countdownInitialSeconds === 0) {
      setCountdownInitialSeconds(countdownMinutes * 60);
    }
    
    setTimerState('running');
    startTimeRef.current = Date.now() - (pausedTimeRef.current * 1000);
    
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 100);
  }, [mode, countdownMinutes, countdownInitialSeconds]);

  const pauseTimer = useCallback(() => {
    setTimerState('paused');
    pausedTimeRef.current = elapsedSeconds;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [elapsedSeconds]);

  const resumeTimer = useCallback(() => {
    setTimerState('running');
    startTimeRef.current = Date.now() - (pausedTimeRef.current * 1000);
    
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 100);
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState('idle');
    setElapsedSeconds(0);
    pausedTimeRef.current = 0;
    setCountdownInitialSeconds(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleStop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const duration = mode === 'stopwatch' 
      ? elapsedSeconds 
      : Math.min(elapsedSeconds, countdownInitialSeconds);
    
    if (duration > 0) {
      onComplete(duration);
    }
  }, [mode, elapsedSeconds, countdownInitialSeconds, onComplete]);

  const handleModeChange = (newMode: string) => {
    if (timerState === 'idle') {
      setMode(newMode as TimerMode);
      resetTimer();
    }
  };

  const displayTime = getDisplayTime();
  const isCountdownComplete = mode === 'countdown' && timerState === 'running' && displayTime <= 0;

  return (
    <div className="flex flex-col items-center gap-4 p-4 sm:p-6">
      {/* Habit Name */}
      <div className="text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">Timing</p>
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{habitName}</h3>
      </div>

      {/* Mode Selector */}
      <Tabs 
        value={mode} 
        onValueChange={handleModeChange}
        className="w-full max-w-xs"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="stopwatch" 
            disabled={timerState !== 'idle'}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Timer className="h-3.5 w-3.5" />
            Stopwatch
          </TabsTrigger>
          <TabsTrigger 
            value="countdown" 
            disabled={timerState !== 'idle'}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Clock className="h-3.5 w-3.5" />
            Countdown
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Countdown Duration Input */}
      {mode === 'countdown' && timerState === 'idle' && (
        <div className="flex items-center gap-2">
          <Label htmlFor="duration" className="text-xs sm:text-sm text-muted-foreground">
            Duration:
          </Label>
          <Input
            id="duration"
            type="number"
            min={1}
            max={180}
            value={countdownMinutes}
            onChange={(e) => setCountdownMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
            className="w-16 sm:w-20 text-center text-sm"
          />
          <span className="text-xs sm:text-sm text-muted-foreground">minutes</span>
        </div>
      )}

      {/* Timer Display */}
      <div 
        className={cn(
          "relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 rounded-full",
          "bg-gradient-to-br from-primary/20 to-accent/20",
          "border-4 border-primary/30",
          timerState === 'running' && "animate-pulse-subtle",
          isCountdownComplete && "border-accent"
        )}
      >
        {/* Progress ring for countdown */}
        {mode === 'countdown' && countdownInitialSeconds > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="4"
              strokeDasharray={`${(1 - displayTime / countdownInitialSeconds) * 283} 283`}
              className="transition-all duration-100"
            />
          </svg>
        )}
        
        <span className="text-3xl sm:text-4xl font-mono font-bold text-foreground z-10">
          {formatTime(displayTime)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {timerState === 'idle' && (
          <Button
            onClick={startTimer}
            size="lg"
            className="gap-2"
          >
            <Play className="h-4 w-4 sm:h-5 sm:w-5" />
            Start
          </Button>
        )}
        
        {timerState === 'running' && (
          <>
            <Button
              onClick={pauseTimer}
              variant="secondary"
              size="lg"
              className="gap-2"
            >
              <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
              Pause
            </Button>
            <Button
              onClick={handleStop}
              variant="default"
              size="lg"
              className="gap-2"
            >
              <Square className="h-4 w-4 sm:h-5 sm:w-5" />
              Done
            </Button>
          </>
        )}
        
        {timerState === 'paused' && (
          <>
            <Button
              onClick={resumeTimer}
              size="lg"
              className="gap-2"
            >
              <Play className="h-4 w-4 sm:h-5 sm:w-5" />
              Resume
            </Button>
            <Button
              onClick={handleStop}
              variant="default"
              size="lg"
              className="gap-2"
            >
              <Square className="h-4 w-4 sm:h-5 sm:w-5" />
              Done
            </Button>
          </>
        )}
        
        {timerState !== 'idle' && (
          <Button
            onClick={resetTimer}
            variant="ghost"
            size="icon"
            className="h-10 w-10 sm:h-11 sm:w-11"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}
      </div>

      {/* Elapsed time for countdown */}
      {mode === 'countdown' && timerState !== 'idle' && (
        <p className="text-xs sm:text-sm text-muted-foreground">
          Time elapsed: {formatTime(elapsedSeconds)}
        </p>
      )}

      {/* Cancel button */}
      <Button
        onClick={onCancel}
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
      >
        Cancel
      </Button>
    </div>
  );
}
import confetti from 'canvas-confetti';
import { useCallback, useRef } from 'react';

export function useAchievementCelebration() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const celebrate = useCallback(() => {
    // Play sound effect
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/achievement-unlock.mp3');
      audioRef.current.volume = 0.5;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // Ignore audio play errors (e.g., user hasn't interacted with page yet)
    });

    // Fire confetti from both sides
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#f59e0b', '#eab308', '#fbbf24', '#fcd34d', '#fef3c7'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Also fire a center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
  }, []);

  return { celebrate };
}

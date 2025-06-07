import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const triggerConfetti = useCallback(() => {
    // Main burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Left side burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 250);
    
    // Right side burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 500);
  }, []);

  const triggerCelebration = useCallback(() => {
    // Multiple waves of confetti for big celebrations
    triggerConfetti();
    
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']
      });
    }, 1000);
  }, [triggerConfetti]);

  const triggerSuccess = useCallback(() => {
    // Green success confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#6EE7B7']
    });
  }, []);

  return {
    triggerConfetti,
    triggerCelebration,
    triggerSuccess
  };
}; 
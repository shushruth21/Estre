import { useEffect, useState } from 'react';

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

export function useInactivityDetector(timeoutMs: number = 120000) {
  const [isInactive, setIsInactive] = useState(false);
  const isVisible = usePageVisibility();

  useEffect(() => {
    if (!isVisible) {
      setIsInactive(true);
      return;
    }

    setIsInactive(false);
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      setIsInactive(false);
      timeoutId = setTimeout(() => setIsInactive(true), timeoutMs);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer, true));

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer, true));
    };
  }, [isVisible, timeoutMs]);

  return { isInactive, isVisible };
}

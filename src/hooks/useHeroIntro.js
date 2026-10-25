import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// A single page-load timeline. Scrolling never starts or resets the animation.
export function useHeroIntro(sceneRef, composition) {
  const [state, setState] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'complete' : 'pending');
  const complete = useRef(state === 'complete');
  const initialComposition = useRef(composition);
  const fallback = useRef(null);

  const finish = useCallback(() => {
    if (complete.current) return;
    complete.current = true;
    window.clearTimeout(fallback.current);
    setState('complete');
  }, []);

  useLayoutEffect(() => {
    if (complete.current) return;
    // Crossing the art-direction breakpoint during the intro reveals the final
    // scene instead of replaying the animation on newly mounted elements.
    if (initialComposition.current !== composition) { finish(); return; }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreferenceChange = () => { if (reducedMotion.matches) finish(); };
    reducedMotion.addEventListener('change', onPreferenceChange);
    if (reducedMotion.matches) { finish(); return () => reducedMotion.removeEventListener('change', onPreferenceChange); }

    let cancelled = false;
    let firstFrame;
    let secondFrame;
    const images = [...sceneRef.current.querySelectorAll('[data-intro-hermes] img, [data-intro-dialog] img')];
    Promise.allSettled([document.fonts.ready, ...images.map(image => image.decode())]).then(() => {
      if (cancelled || complete.current) return;
      // Paint the hidden starting state after the original image is decoded.
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          if (cancelled || complete.current) return;
          setState('running');
          fallback.current = window.setTimeout(finish, 2700);
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(fallback.current);
      reducedMotion.removeEventListener('change', onPreferenceChange);
    };
  }, [composition, finish, sceneRef]);

  const onAnimationEnd = useCallback(event => {
    if (event.animationName === 'hero-dialog-arrival' && event.target.dataset.introDialog === '3') finish();
  }, [finish]);

  return { state, onAnimationEnd };
}

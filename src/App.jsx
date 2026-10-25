import { useLayoutEffect, useRef, useState } from 'react';
import DesktopScene from './components/scenes/DesktopScene.jsx';
import MobileScene from './components/scenes/MobileScene.jsx';
import { useHeroIntro } from './hooks/useHeroIntro.js';
import { useSchemeIntro } from './hooks/useSchemeIntro.js';
import { useMessageIntros } from './hooks/useMessageIntros.js';
import { useCrackIntro } from './hooks/useCrackIntro.js';

const DESKTOP_QUERY = '(min-width: 900px)';

export default function App() {
  const viewportRef = useRef(null);
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const [width, setWidth] = useState(() => Math.min(window.innerWidth, window.matchMedia(DESKTOP_QUERY).matches ? 2160 : 820));
  const heroIntro = useHeroIntro(viewportRef, desktop);
  const schemeIntro = useSchemeIntro(viewportRef, desktop);
  useMessageIntros(viewportRef, desktop);
  const crackIntro = useCrackIntro(viewportRef, desktop);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const referenceWidth = desktop ? 1440 : 402;
  const referenceHeight = desktop ? 6269 : 4980;
  const scale = width / referenceWidth;

  return (
    <main className="selfmap" data-composition={desktop ? 'desktop' : 'mobile'} data-hero-intro={heroIntro.state} data-scheme-intro={schemeIntro.state} data-crack-intro={crackIntro} onAnimationEnd={heroIntro.onAnimationEnd} onAnimationEndCapture={schemeIntro.onAnimationEnd} aria-label="Self-Map — Греки давно знали?">
      <div ref={viewportRef} className="scene-viewport" style={{ aspectRatio: `${referenceWidth} / ${referenceHeight}` }}>
        <div className="scene-transform" style={{ width: referenceWidth, height: referenceHeight, transform: `scale(${scale})` }}>
          {desktop ? <DesktopScene /> : <MobileScene />}
        </div>
      </div>
    </main>
  );
}

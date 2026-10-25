import { useLayoutEffect, useRef } from 'react';

// Keep the approved hero/scheme modules untouched. These two dialogues share
// the hero's existing keyframes, but have independent once-only scroll triggers.
const dialogues = [
  { id: 'boundaries', desktop: ['1537:124', '1538:131', '1538:143', '1538:149'], mobile: ['boundaries-question', 'boundaries-search', 'boundaries-found', 'boundaries-hope'] },
  { id: 'archetypes', desktop: ['1547:33'], mobile: ['archetypes-question'] },
];

export function useMessageIntros(viewportRef, desktop) {
  const completed = useRef(new Set());
  useLayoutEffect(() => {
    const root = viewportRef.current;
    const scene = root.querySelector('.figma-scene');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cleanups = [];
    for (const dialogue of dialogues) {
      const nodes = dialogue[desktop ? 'desktop' : 'mobile'].map(id => root.querySelector(desktop ? `[data-node-id="${id}"]` : `[data-message-id="${id}"]`));
      if (nodes.some(node => !node)) continue;
      let timer;
      let observer;
      let started = false;
      const finish = () => {
        completed.current.add(dialogue.id);
        observer?.disconnect();
        clearTimeout(timer);
        nodes.forEach(node => { node.dataset.scrollMessageState = 'complete'; });
      };
      const scale = scene.getBoundingClientRect().width / (desktop ? 1440 : 402);
      const sceneRect = scene.getBoundingClientRect();
      // display:contents desktop groups have no box; measure their existing
      // painted children before temporarily giving the group an animation box.
      const targets = nodes.map(node => [...node.querySelectorAll('svg, img, [data-node-id]')].filter(child => {
        const rect = child.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }));
      nodes.forEach((node, index) => {
        if (desktop) {
          const rects = targets[index].map(child => child.getBoundingClientRect());
          const left = Math.min(...rects.map(rect => rect.left));
          const right = Math.max(...rects.map(rect => rect.right));
          const top = Math.min(...rects.map(rect => rect.top));
          const bottom = Math.max(...rects.map(rect => rect.bottom));
          node.style.setProperty('--scroll-dialog-origin', `${((left + right) / 2 - sceneRect.left) / scale}px ${((top + bottom) / 2 - sceneRect.top) / scale}px`);
        }
        node.dataset.scrollMessage = dialogue.id;
        node.dataset.scrollMessageOrder = index;
        node.style.setProperty('--scroll-dialog-delay', `${index * 250}ms`);
        node.dataset.scrollMessageState = reduced.matches || completed.current.has(dialogue.id) ? 'complete' : 'idle';
      });
      if (!reduced.matches && !completed.current.has(dialogue.id)) {
        observer = new IntersectionObserver(entries => {
          if (started || !entries.some(entry => entry.isIntersecting)) return;
          started = true;
          observer.disconnect();
          nodes.forEach(node => { node.dataset.scrollMessageState = 'running'; });
          timer = setTimeout(finish, (nodes.length - 1) * 250 + 550);
        }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
        observer.observe(desktop ? targets[0][0] : nodes[0]);
      }
      const onEnd = event => {
        if (event.target === nodes.at(-1) && event.animationName === 'hero-dialog-arrival') finish();
      };
      const onReduced = () => { if (reduced.matches) finish(); };
      root.addEventListener('animationend', onEnd);
      reduced.addEventListener('change', onReduced);
      cleanups.push(() => {
        if (started) completed.current.add(dialogue.id);
        observer?.disconnect();
        clearTimeout(timer);
        root.removeEventListener('animationend', onEnd);
        reduced.removeEventListener('change', onReduced);
      });
    }
    return () => cleanups.forEach(cleanup => cleanup());
  }, [viewportRef, desktop]);
}
